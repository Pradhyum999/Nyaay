import OpenAI from 'openai';

// NVIDIA NIM Integration: OpenAI-compatible endpoint
// Model: openai/gpt-oss-20b
// Endpoint: https://integrate.api.nvidia.com/v1/chat/completions

export const DEFAULT_NVIDIA_API_KEY =
  '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';

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NvidiaGlmResponse {
  content: string;
  reasoning?: string;
  model: string;
  usage?: any;
}

export function getNvidiaApiKey(): string {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('nyaay_nvidia_key');
    if (customKey && customKey.trim() && customKey.trim().startsWith('nvapi-')) {
      return customKey.trim();
    }
  }
  return import.meta.env.VITE_NVIDIA_API_KEY || DEFAULT_NVIDIA_API_KEY;
}

export function saveNvidiaApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (!key.trim()) {
      localStorage.removeItem('nyaay_nvidia_key');
    } else {
      localStorage.setItem('nyaay_nvidia_key', key.trim());
    }
  }
}

export const NVIDIA_PROXY_URL =
  'https://ecourts-cors-proxy.peach-gas.workers.dev/api/nvidia/v1';

export function getNvidiaBaseURL(): string {
  // Always use the edge CORS proxy to ensure identical behavior on mobile, PWA, desktop and localhost
  return NVIDIA_PROXY_URL;
}

export function getNvidiaClient(customBaseUrl?: string): OpenAI {
  return new OpenAI({
    baseURL: customBaseUrl || getNvidiaBaseURL(),
    apiKey: getNvidiaApiKey(),
    dangerouslyAllowBrowser: true,
    maxRetries: 0,
    timeout: 25000,
  });
}

export async function callNvidiaGLM5(
  messages: ChatMessagePayload[],
  options?: {
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    timeoutMs?: number;
  }
): Promise<NvidiaGlmResponse> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    throw new Error('NVIDIA API Key not configured');
  }

  const model = options?.model || 'openai/gpt-oss-20b';
  const temperature = options?.temperature ?? 0.3;
  const top_p = options?.top_p ?? 1;
  const max_tokens = options?.max_tokens ?? 4096;
  const timeoutMs = options?.timeoutMs ?? 35000;

  // Primary: Active Cloudflare edge CORS proxy; Fallbacks: local dev proxy, direct NVIDIA endpoint
  const basesToTry = [
    NVIDIA_PROXY_URL,
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `${window.location.origin}/api/nvidia/v1`
      : 'https://integrate.api.nvidia.com/v1',
    'https://integrate.api.nvidia.com/v1',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: any = null;

  for (const base of basesToTry) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use clean standard fetch to avoid OpenAI SDK adding proprietary headers that trigger CORS preflight errors
      const endpoint = base.endsWith('/chat/completions') ? base : `${base.replace(/\/+$/, '')}/chat/completions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          top_p,
          max_tokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`NVIDIA endpoint returned ${res.status}: ${errText.slice(0, 200)}`);
      }

      const completion = await res.json();
      const choice = completion.choices?.[0];
      const msg = choice?.message as any;
      const reasoning =
        msg?.reasoning_content ||
        (msg && typeof msg === 'object' && 'reasoning' in msg ? msg.reasoning : undefined);

      let content = (msg?.content && msg.content.trim()) || '';
      // If content is empty but model reasoned, extract clean output
      if (!content && reasoning) {
        content = reasoning.trim();
      }
      if (!content) {
        content = 'No response generated.';
      }

      return {
        content,
        reasoning,
        model: completion.model || model,
        usage: completion.usage,
      };
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`callNvidiaGLM5 failed with base ${base}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to connect to NVIDIA NIM endpoint.');
}

// Convenient alias for code calling callNvidiaAI
export const callNvidiaAI = callNvidiaGLM5;

/**
 * Quick Test Hit to verify the API directly from the app
 */
export async function testNvidiaAPI(): Promise<{ success: boolean; content: string; reasoning?: string; error?: string }> {
  try {
    const res = await callNvidiaGLM5([
      { role: 'user', content: 'Which number is larger, 9.11 or 9.8?' }
    ], {
      model: 'openai/gpt-oss-20b',
      temperature: 1,
      top_p: 1,
      max_tokens: 4096,
    });
    return {
      success: true,
      content: res.content,
      reasoning: res.reasoning,
    };
  } catch (err: any) {
    return {
      success: false,
      content: '',
      error: err?.message || String(err),
    };
  }
}

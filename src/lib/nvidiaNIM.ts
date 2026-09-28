import OpenAI from 'openai';

// NVIDIA NIM Integration: GLM-5.3 Model by Z-ai
// Endpoint: https://integrate.api.nvidia.com/v1/chat/completions

const NVIDIA_API_KEY =
  import.meta.env.VITE_NVIDIA_API_KEY ||
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

export function getNvidiaBaseURL(): string {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api/nvidia/v1';
  }
  return 'https://integrate.api.nvidia.com/v1';
}

export function getNvidiaClient(): OpenAI {
  return new OpenAI({
    baseURL: getNvidiaBaseURL(),
    apiKey: NVIDIA_API_KEY,
    dangerouslyAllowBrowser: true,
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
  const apiKey = NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA API Key not configured');
  }

  const client = getNvidiaClient();
  const timeoutMs = options?.timeoutMs ?? 90000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Default to z-ai/glm-5.3-flash for vastly faster responses (~30s vs ~10min)
  const model = options?.model || 'z-ai/glm-5.3-flash';

  try {
    const completion = await client.chat.completions.create(
      {
        model,
        messages,
        temperature: options?.temperature ?? 0.3,
        top_p: options?.top_p ?? 1,
        max_tokens: options?.max_tokens ?? 1024,
        stream: false,
      },
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timer);

    const choice = completion.choices?.[0];
    const msg = choice?.message as any;
    const content = msg?.content || msg?.reasoning_content || 'No response generated.';
    const reasoning = msg?.reasoning_content;

    return {
      content,
      reasoning,
      model: completion.model || model,
      usage: completion.usage,
    };
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

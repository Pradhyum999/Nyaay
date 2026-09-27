import { GoogleGenAI } from '@google/genai';
import {
  CaseProfile,
  CaseTask,
  CaseTimelineEvent,
  DocumentItem,
  HearingItem,
  CaseFile,
} from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env');
    }
    client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return client;
}

export function isCaseAIConfigured(): boolean {
  return !!API_KEY;
}

const INTAKE_SYSTEM_PROMPT = `You are NYAAY INTAKE, a structured legal case-intake engine for Indian citizens.
Your job is NOT to give a generic answer. Your job is to INTERVIEW the user and produce a structured CASE PROFILE.

You must ask clarifying questions when key facts are missing (dates, documents, jurisdiction, written notice, payment proof, counterparty details).
Ask at most 3 focused questions per turn. Be empathetic, concise, and use simple language.

When you have enough information to classify the matter, output your response as normal conversational text, and ALSO append a fenced JSON block containing the case profile, using EXACTLY this schema and nothing else inside the block:

\`\`\`json
{
  "matterType": "short matter label e.g. Rental deposit dispute",
  "legalArea": "e.g. Landlord-tenant / civil dispute",
  "location": "city / state",
  "facts": ["key fact 1", "key fact 2"],
  "missingInfo": ["info still needed 1"],
  "documentsAvailable": ["doc 1"],
  "documentsRequired": ["doc needed 1"],
  "urgency": "low|medium|high",
  "confidenceScore": 0,
  "summaryText": "2-4 sentence neutral summary a lawyer can read in 30 seconds"
}
\`\`\`

Rules:
- Only emit the JSON block once you can reasonably classify the matter (confidenceScore >= 50).
- Until then, keep interviewing and do NOT emit JSON.
- Never invent facts the user did not state.
- Always add a short disclaimer that this is informational, not legal advice.`;

export interface IntakeTurnResult {
  text: string;                 // conversational reply (JSON block stripped)
  profile: CaseProfile | null;  // parsed profile if the model emitted one
}

/**
 * One turn of the structured intake interview.
 * Returns the assistant's reply and, when available, a parsed CaseProfile.
 */
export async function runCaseIntakeTurn(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  language: 'en' | 'hi' = 'en',
  previousInteractionId?: string
): Promise<IntakeTurnResult> {
  const ai = getClient();

  const langNote = language === 'hi'
    ? '\n\nRespond in Hindi (हिन्दी). But keep the JSON keys in English exactly as specified.'
    : '';

  const historyText = history
    .map(m => `${m.role === 'user' ? 'Client' : 'Intake'}: ${m.content}`)
    .join('\n');

  const input = historyText
    ? `${historyText}\nClient: ${userMessage}`
    : userMessage;

  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    system_instruction: INTAKE_SYSTEM_PROMPT + langNote,
    input,
  });

  const full = interaction.output_text || '';
  const { text, profile } = extractProfile(full);
  return { text, profile };
}

/** Extract the trailing JSON case-profile block, if present. */
export function extractProfile(raw: string): { text: string; profile: CaseProfile | null } {
  const fenceMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  if (!fenceMatch) {
    return { text: raw.trim(), profile: null };
  }
  const jsonStr = fenceMatch[1].trim();
  const text = raw.replace(fenceMatch[0], '').trim();
  try {
    const parsed = JSON.parse(jsonStr);
    const profile: CaseProfile = {
      matterType: String(parsed.matterType || 'General legal matter'),
      legalArea: String(parsed.legalArea || 'General'),
      location: String(parsed.location || ''),
      facts: Array.isArray(parsed.facts) ? parsed.facts.map(String) : [],
      missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo.map(String) : [],
      documentsAvailable: Array.isArray(parsed.documentsAvailable) ? parsed.documentsAvailable.map(String) : [],
      documentsRequired: Array.isArray(parsed.documentsRequired) ? parsed.documentsRequired.map(String) : [],
      urgency: ['low', 'medium', 'high'].includes(parsed.urgency) ? parsed.urgency : 'medium',
      confidenceScore: Number(parsed.confidenceScore) || 50,
      summaryText: String(parsed.summaryText || ''),
      generatedAt: new Date().toISOString(),
    };
    return { text, profile };
  } catch {
    return { text: raw.trim(), profile: null };
  }
}

// ── "Ask My Case" — AI grounded on the actual case workspace ────────────────

export interface CaseRoomContext {
  caseFile: CaseFile | null;
  documents: DocumentItem[];
  hearings: HearingItem[];
  tasks: CaseTask[];
  timeline: CaseTimelineEvent[];
}

function buildCaseContext(ctx: CaseRoomContext): string {
  const c = ctx.caseFile;
  const lines: string[] = [];

  lines.push('=== CASE FILE ===');
  if (c) {
    lines.push(`Case Number: ${c.caseNumber}`);
    lines.push(`Matter/Type: ${c.caseType}`);
    lines.push(`Parties: ${c.clientName} vs ${c.opponentName}`);
    lines.push(`Court: ${c.courtLocation} (${c.court})`);
    lines.push(`Stage: ${c.stage || 'N/A'} | Status: ${c.status}`);
    lines.push(`Next Hearing: ${c.nextHearingDate}`);
    if (c.profile) {
      lines.push(`AI Summary: ${c.profile.summaryText}`);
      lines.push(`Known Facts: ${c.profile.facts.join('; ')}`);
      lines.push(`Missing Info: ${c.profile.missingInfo.join('; ')}`);
    }
  } else {
    lines.push('(No case file found)');
  }

  lines.push('\n=== DOCUMENTS ===');
  if (ctx.documents.length === 0) lines.push('(none)');
  ctx.documents.forEach(d => {
    lines.push(`- ${d.titleEn} [${d.status}]${d.uploadedAt ? ` uploaded ${d.uploadedAt}` : ''}`);
  });

  lines.push('\n=== HEARINGS ===');
  if (ctx.hearings.length === 0) lines.push('(none)');
  ctx.hearings.forEach(h => {
    lines.push(`- ${h.hearingDate} | ${h.purposeEn} | Bench: ${h.judgeName}`);
    if (h.previousOrderSummaryEn) lines.push(`  Order: ${h.previousOrderSummaryEn}`);
  });

  lines.push('\n=== TASKS / ACTION ITEMS ===');
  if (ctx.tasks.length === 0) lines.push('(none)');
  ctx.tasks.forEach(t => {
    lines.push(`- [${t.status}] ${t.titleEn} (assigned to: ${t.assignedTo})${t.dueDate ? ` due ${t.dueDate}` : ''}`);
  });

  lines.push('\n=== TIMELINE ===');
  if (ctx.timeline.length === 0) lines.push('(none)');
  ctx.timeline.forEach(e => {
    lines.push(`- ${e.eventDate}: ${e.titleEn}${e.descriptionEn ? ` — ${e.descriptionEn}` : ''}`);
  });

  return lines.join('\n');
}

/**
 * Answer a question strictly from the user's case workspace.
 * This is the "Ask My Case" differentiator: the AI reads the case, not the internet.
 */
export async function askMyCase(
  question: string,
  ctx: CaseRoomContext,
  language: 'en' | 'hi' = 'en'
): Promise<string> {
  const ai = getClient();

  const context = buildCaseContext(ctx);

  const systemInstruction = `You are NYAAY CASE AI. You answer ONLY from the user's own case workspace provided below.
Rules:
- If the answer is not in the case data, say so plainly and suggest which document or information is missing.
- Never invent court orders, dates, or facts.
- Be concise, clear, and use plain language.
- When explaining orders, translate legal jargon into simple terms.
- Keep a short disclaimer: informational, not legal advice.
${language === 'hi' ? '- Respond in Hindi (हिन्दी).' : ''}

${context}`;

  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    system_instruction: systemInstruction,
    input: question,
  });

  return interaction.output_text || 'I could not find that in your case file.';
}

// ─── Order summarization in a chosen regional language ───────────────────────

export async function summarizeOrder(
  orderText: string,
  language: 'en' | 'hi' = 'en',
  targetLanguageName?: string
): Promise<string> {
  const ai = getClient();

  const targetNote = targetLanguageName
    ? `Respond in ${targetLanguageName}.`
    : language === 'hi'
    ? 'Respond in Hindi (हिन्दी).'
    : 'Respond in English.';

  const prompt = `Explain the following Indian court order in simple, everyday language for a layperson.
${targetNote}

Structure:
1. What the court decided (one line)
2. What it means for the parties
3. What happens next / next date if mentioned
4. Any action required by the client

Court Order text:
"""
${orderText}
"""`;

  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    input: prompt,
  });

  return interaction.output_text || 'Unable to summarize the order.';
}

// ── Prepared-client packet (rendered for the lawyer) ───────────────────────

export function renderPreparedClientPacket(ctx: CaseRoomContext): string {
  const c = ctx.caseFile;
  const parts: string[] = [];
  parts.push(`PREPARED CLIENT — ${c?.profile?.matterType || c?.caseType || 'New matter'}`);
  if (c?.profile) {
    parts.push(`Jurisdiction: ${c.profile.location}`);
    parts.push(`Legal area: ${c.profile.legalArea}`);
    parts.push(`Urgency: ${c.profile.urgency.toUpperCase()}`);
  }
  parts.push('');
  parts.push('AI SUMMARY:');
  parts.push(c?.profile?.summaryText || 'N/A');
  parts.push('');
  if (c?.profile?.facts?.length) {
    parts.push('KEY FACTS:');
    c.profile.facts.forEach(f => parts.push(`• ${f}`));
    parts.push('');
  }
  if (ctx.documents.length) {
    parts.push('DOCUMENTS:');
    ctx.documents.forEach(d => parts.push(`• ${d.titleEn} [${d.status}]`));
    parts.push('');
  }
  if (c?.profile?.missingInfo?.length) {
    parts.push('MISSING INFORMATION:');
    c.profile.missingInfo.forEach(m => parts.push(`• ${m}`));
  }
  return parts.join('\n');
}
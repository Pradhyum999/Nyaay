import { GoogleGenAI } from '@google/genai';
import { callNvidiaGLM5, ChatMessagePayload } from './nvidiaNIM';
import { getGeminiApiKey } from './caseAI';
import { getISTDateString } from './istDate';
import {
  CaseFile,
  CaseTask,
  DocumentItem,
  HearingItem,
  InvoiceItem,
  Language,
} from '../types';

// ── Lawyer AI Chat — grounded Q&A over ALL of the advocate's live data ──────
// Unlike the client intake engine (which interviews and classifies), this
// assistant answers ANY question the lawyer asks using the full context of
// his chambers: cases, hearings, tasks, invoices, documents and chat threads.

export interface LawyerAIContextInput {
  lawyerName?: string;
  cases: CaseFile[];
  hearings: HearingItem[];
  invoices: InvoiceItem[];
  documents: DocumentItem[];
  tasks?: CaseTask[];
  threads?: Array<{ id: string; recipientName?: string; lastMessage?: string }>;
  language?: Language;
}

export interface LawyerAIAnswer {
  text: string;
  modelUsed: string;
}

const fmtMoney = (n?: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

const trim = (s: string | undefined, n: number) =>
  (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

/** Compact, prompt-bounded digest of every record the advocate owns. */
export function buildLawyerContextDigest(input: LawyerAIContextInput): string {
  const today = getISTDateString();
  const parts: string[] = [];

  parts.push(`TODAY (IST): ${today}`);
  if (input.lawyerName) parts.push(`ADVOCATE: ${input.lawyerName}`);

  // ── Practice snapshot ──
  const activeCases = input.cases.filter(c => (c.status || 'Active').toLowerCase() === 'active');
  const unpaid = input.invoices.filter(i => i.status !== 'Paid');
  const pendingTasks = (input.tasks || []).filter(t => t.status !== 'done');
  parts.push(
    `\nPRACTICE SNAPSHOT: ${input.cases.length} cases (${activeCases.length} active) | ` +
    `${input.invoices.length} invoices (${unpaid.length} unpaid, ${fmtMoney(unpaid.reduce((s, i) => s + (i.totalAmount || 0), 0))} outstanding) | ` +
    `${(input.tasks || []).length} tasks (${pendingTasks.length} open) | ${input.documents.length} documents`
  );

  // ── Cases ──
  if (input.cases.length) {
    const lines = input.cases.slice(0, 25).map(c =>
      `- ${c.caseNumber}: ${c.clientName}${c.opponentName ? ` vs ${c.opponentName}` : ''} | ` +
      `${c.caseType || 'Matter'} | ${c.courtLocation || c.court || 'Court'} | stage: ${c.stage || '—'} | ` +
      `status: ${c.status || 'Active'} | priority: ${c.priority || 'Normal'} | next hearing: ${c.nextHearingDate || 'TBD'} | ` +
      `billed: ${fmtMoney(c.totalBilled)} collected: ${fmtMoney(c.totalCollected)}`
    );
    parts.push(`\nCASES (${input.cases.length}):\n${lines.join('\n')}`);
  }

  // ── Hearings ──
  if (input.hearings.length) {
    const sorted = [...input.hearings].sort((a, b) => (a.hearingDate || '').localeCompare(b.hearingDate || ''));
    const lines = sorted.slice(0, 35).map(h =>
      `- ${h.hearingDate || 'TBD'} ${h.hearingTime || ''} | ${h.caseNumber || '—'} | ${h.courtName || (h as any).court || 'Court'} | ` +
      `stage: ${h.stage || '—'} | urgent: ${h.isUrgent ? 'yes' : 'no'}${h.previousOrderSummaryEn ? ` | last order: ${trim(h.previousOrderSummaryEn, 120)}` : ''}`
    );
    parts.push(`\nHEARINGS / CAUSE LIST:\n${lines.join('\n')}`);
  }

  // ── Tasks ──
  if ((input.tasks || []).length) {
    const lines = (input.tasks || []).slice(0, 30).map(t =>
      `- ${t.dueDate || 'no date'} | ${t.titleEn || t.titleHi || 'Task'} | case: ${t.caseId || '—'} | ` +
      `status: ${t.status} | assigned to: ${t.assignedTo}`
    );
    parts.push(`\nTASKS:\n${lines.join('\n')}`);
  }

  // ── Invoices ──
  if (input.invoices.length) {
    const lines = input.invoices.slice(0, 25).map(i =>
      `- ${i.invoiceNumber || i.id}: ${i.clientName || '—'} | ${i.caseNumber || '—'} | ${fmtMoney(i.totalAmount)} | ` +
      `${i.status}${i.paidVia ? ` via ${i.paidVia}` : ''} | ${i.date || '—'}`
    );
    parts.push(`\nINVOICES / FEES:\n${lines.join('\n')}`);
  }

  // ── Documents ──
  if (input.documents.length) {
    const lines = input.documents.slice(0, 20).map(d =>
      `- ${d.name || d.id} | case: ${d.caseNumber || d.caseId || '—'} | status: ${d.status || '—'}${d.uploadedAt ? ` | uploaded: ${d.uploadedAt}` : ''}`
    );
    parts.push(`\nDOCUMENTS:\n${lines.join('\n')}`);
  }

  // ── Chat threads ──
  if ((input.threads || []).length) {
    const lines = (input.threads || []).slice(0, 15).map(th =>
      `- ${th.recipientName || th.id}${th.lastMessage ? ` | last message: ${trim(th.lastMessage, 100)}` : ''}`
    );
    parts.push(`\nCLIENT CHAT THREADS:\n${lines.join('\n')}`);
  }

  return parts.join('\n');
}

export const LAWYER_AI_SYSTEM_PROMPT = `You are NYAAY COUNSEL — the private AI assistant built into the NYAAYNEETI advocate suite.
You answer the advocate's questions STRICTLY using the CHAMBERS DATA provided below (his own cases, hearings, tasks, invoices, documents and client chats) plus general Indian law knowledge (BNS, BNSS, BSA, CPC, NI Act, Evidence Act).

Rules:
- When the question is about HIS data (hearings, clients, fees, tasks, documents), ground the answer in the CHAMBERS DATA and cite specific case numbers, dates and amounts.
- If the data does not contain the answer, say so plainly and suggest what to check.
- For legal-drafting requests (notices, bail applications, plaints), produce a clean, usable draft.
- Be concise, structured and professional. Use short bullet points. Bold key facts with **bold**.
- Never fabricate case numbers, dates or amounts that are not in the data.
- Add a one-line reminder that AI output should be verified before court filing.
- Reply in the same language the advocate uses (English, Hindi or Marathi).

CHAMBERS DATA:
`;

/** Try NVIDIA NIM (GLM-5) first — the platform's primary model. */
async function askNvidia(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  question: string
): Promise<string> {
  const messages: ChatMessagePayload[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content }) as ChatMessagePayload),
    { role: 'user', content: question },
  ];
  const res = await callNvidiaGLM5(messages, { temperature: 0.3, max_tokens: 1400, timeoutMs: 25000 });
  const text = (res as any)?.choices?.[0]?.message?.content || (res as any)?.content || '';
  if (!text.trim()) throw new Error('Empty GLM response');
  return text.trim();
}

/** Gemini fallback when NVIDIA NIM is unreachable (CORS / cold start). */
async function askGemini(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  question: string
): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) throw new Error('Gemini API key not configured.');
  const ai = new GoogleGenAI({ apiKey: key });
  const contents = [
    ...history.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: { systemInstruction: systemPrompt, temperature: 0.3 },
  });
  const text = response?.text || '';
  if (!text.trim()) throw new Error('Empty Gemini response');
  return text.trim();
}

/**
 * Ask NYAAY COUNSEL anything — grounded on the advocate's full chambers data.
 * NVIDIA NIM (GLM-5) first, Gemini fallback, then an offline deterministic
 * digest so the advocate ALWAYS gets an answer even when both APIs fail.
 */
export async function askLawyerCounsel(
  input: LawyerAIContextInput,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  question: string
): Promise<LawyerAIAnswer> {
  const digest = buildLawyerContextDigest(input);
  const systemPrompt = LAWYER_AI_SYSTEM_PROMPT + digest;

  // 1. NVIDIA NIM (GLM-5) — primary platform model
  try {
    const text = await askNvidia(systemPrompt, history, question);
    return { text, modelUsed: 'nvidia-glm-5' };
  } catch (err) {
    console.warn('LawyerAI: NVIDIA GLM failed, falling back to Gemini:', err);
  }

  // 2. Gemini fallback
  try {
    const text = await askGemini(systemPrompt, history, question);
    return { text, modelUsed: 'gemini-2.5-flash' };
  } catch (err) {
    console.warn('LawyerAI: Gemini failed, using offline chambers digest:', err);
  }

  // 3. Offline deterministic answer built from his own data
  return { text: buildOfflineLawyerAnswer(input, question), modelUsed: 'offline-digest' };
}

/** Offline deterministic answer when both AI models are unreachable. */
export function buildOfflineLawyerAnswer(input: LawyerAIContextInput, question: string): string {
  const q = question.toLowerCase();
  const today = getISTDateString();
  const activeCases = input.cases.filter(c => (c.status || 'Active').toLowerCase() === 'active');
  const unpaid = input.invoices.filter(i => i.status !== 'Paid');
  const openTasks = (input.tasks || []).filter(t => t.status !== 'done');
  const footer = '\n\n⚠️ _Offline summary from your chambers data — verify before court filing._';

  // ── Hearings / cause list ──
  if (
    q.includes('hearing') || q.includes('सुनवाई') || q.includes('सुनवै') ||
    q.includes('cause list') || q.includes('court date') || q.includes('tomorrow') ||
    q.includes('today') || q.includes('कल') || q.includes('आज')
  ) {
    const upcoming = [...input.hearings]
      .filter(h => (h.hearingDate || '') >= today)
      .sort((a, b) => (a.hearingDate || '').localeCompare(b.hearingDate || ''))
      .slice(0, 8);
    if (!upcoming.length) {
      return `📋 **No upcoming hearings found** in your chambers data on or after ${today} (today).` + footer;
    }
    return (
      '📋 **Upcoming Hearings / Cause List:**\n' +
      upcoming.map(h =>
        `• **${h.hearingDate}${h.hearingTime ? ` ${h.hearingTime}` : ''}** — ${h.caseNumber} (${h.clientName}) @ ${h.courtName || 'Court'}${h.isUrgent ? ' 🔴' : ''}`
      ).join('\n') + footer
    );
  }

  // ── Fees / invoices / outstanding payments ──
  if (
    q.includes('fee') || q.includes('invoice') || q.includes('payment') ||
    q.includes('owed') || q.includes('owe') || q.includes('unpaid') ||
    q.includes('outstanding') || q.includes('billing') ||
    q.includes('शुल्क') || q.includes('भुगतान') || q.includes('फी')
  ) {
    if (!unpaid.length) {
      return `💰 **All invoices are settled.** ${input.invoices.length} invoice(s) on record, ${fmtMoney(0)} outstanding.` + footer;
    }
    return (
      '💰 **Outstanding Invoices:**\n' +
      unpaid.slice(0, 8).map(i =>
        `• **${i.invoiceNumber}** — ${i.clientName} (${i.caseNumber}): ${fmtMoney(i.totalAmount)} · ${i.status}`
      ).join('\n') +
      `\n\n**Total outstanding: ${fmtMoney(unpaid.reduce((s, i) => s + (i.totalAmount || 0), 0))}**` + footer
    );
  }

  // ── Specific case lookup (quote the case number) ──
  const caseMatch = input.cases.find(c => q.includes(c.caseNumber.toLowerCase()));
  if (caseMatch) {
    const caseHearings = input.hearings.filter(h => h.caseNumber === caseMatch.caseNumber);
    return (
      `⚖️ **${caseMatch.caseNumber} — ${caseMatch.clientName}${caseMatch.opponentName ? ` vs ${caseMatch.opponentName}` : ''}**\n` +
      `• Court: ${caseMatch.courtLocation || (caseMatch as any).court || '—'}\n` +
      `• Type: ${caseMatch.caseType || '—'} · Stage: ${caseMatch.stage || '—'} · Status: ${caseMatch.status || 'Active'}\n` +
      `• Next hearing: ${caseMatch.nextHearingDate || 'TBD'}\n` +
      `• Billed: ${fmtMoney(caseMatch.totalBilled)} · Collected: ${fmtMoney(caseMatch.totalCollected)}\n` +
      (caseHearings.length ? `• Hearings on record: ${caseHearings.length} (latest: ${caseHearings[caseHearings.length - 1].hearingDate})\n` : '') +
      '\n⚠️ _Verify details in the case dossier before relying on this._'
    );
  }

  // ── Tasks / checklist ──
  if (q.includes('task') || q.includes('कार्य') || q.includes('todo') || q.includes('to-do') || q.includes('checklist')) {
    if (!openTasks.length) {
      return '✅ **No open tasks** — your procedural checklist is clear.' + footer;
    }
    return (
      '✅ **Open Tasks:**\n' +
      openTasks.slice(0, 8).map(t =>
        `• ${t.dueDate || 'no due date'} — ${t.titleEn || t.titleHi || 'Task'} (${t.assignedTo})`
      ).join('\n') + footer
    );
  }

  // ── Documents ──
  if (q.includes('document') || q.includes('दस्तावेज')) {
    if (!input.documents.length) {
      return '📁 **No documents on record** yet — upload via the Case Room.' + footer;
    }
    return (
      '📁 **Recent Documents:**\n' +
      input.documents.slice(0, 8).map(d =>
        `• ${d.name || d.id} — ${d.caseNumber || d.caseId || 'unfiled'} · ${d.status || '—'}`
      ).join('\n') + footer
    );
  }

  // ── Practice summary (default) ──
  return (
    '📊 **Chambers Snapshot:**\n' +
    `• Cases: ${input.cases.length} (${activeCases.length} active)\n` +
    `• Outstanding fees: ${fmtMoney(unpaid.reduce((s, i) => s + (i.totalAmount || 0), 0))} across ${unpaid.length} invoice(s)\n` +
    `• Open tasks: ${openTasks.length}\n` +
    `• Documents on record: ${input.documents.length}\n` +
    `• Client chat threads: ${(input.threads || []).length}\n\n` +
    'Ask me about a specific case (quote the case number), upcoming hearings, fees, tasks or drafting.' +
    footer
  );
}
import { GoogleGenAI } from '@google/genai';

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

const NYAAYNEETI_SYSTEM_PROMPT = `You are NYAAYNEETI AI, an advanced, highly specialized legal intelligence assistant for Indian citizens and advocates. 
You provide guidance on Indian law, court procedures, procedural timelines, and constitutional rights in crystal-clear language.
You understand English, Hindi, and Hinglish. 
Key principles:
- Always clarify that you provide general legal information, not legal advice
- Recommend consulting a licensed advocate for specific legal matters
- Use simple language accessible to common people
- Reference relevant Indian laws (IPC, CPC, CrPC, Constitution etc.) when applicable
- Be empathetic and supportive
- For urgent/criminal matters, advise immediate legal help
- When asked in Hindi, respond in Hindi
- Keep responses concise and actionable
Format your responses with:
1. Brief answer to the question
2. Relevant law/section if applicable
3. Suggested next steps
4. Whether they need a lawyer immediately`;

export async function sendLegalQuery(
  userMessage: string,
  previousInteractionId?: string,
  language: 'en' | 'hi' = 'en'
): Promise<{ text: string; interactionId: string }> {
  const ai = getClient();
  
  const systemInstruction = NYAAYNEETI_SYSTEM_PROMPT + (language === 'hi' 
    ? '\n\nPlease respond in Hindi (हिन्दी) as the user prefers Hindi.' 
    : '');

  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    system_instruction: systemInstruction,
    input: userMessage,
    ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
  });

  return {
    text: interaction.output_text || 'Sorry, I could not process your request.',
    interactionId: interaction.id,
  };
}

export async function streamLegalQuery(
  userMessage: string,
  onChunk: (text: string) => void,
  onComplete: (interactionId: string) => void,
  previousInteractionId?: string,
  language: 'en' | 'hi' = 'en'
): Promise<void> {
  const ai = getClient();
  
  const systemInstruction = NYAAYNEETI_SYSTEM_PROMPT + (language === 'hi'
    ? '\n\nकृपया हिन्दी में जवाब दें।'
    : '');

  const stream = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    system_instruction: systemInstruction,
    input: userMessage,
    stream: true,
    ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
  });

  let finalInteractionId = '';

  for await (const event of stream) {
    if (event.event_type === 'step.delta') {
      if (event.delta?.type === 'text' && event.delta.text) {
        onChunk(event.delta.text);
      }
    } else if (event.event_type === 'interaction.completed') {
      finalInteractionId = event.interaction?.id || '';
    }
  }

  onComplete(finalInteractionId);
}

export async function generateCaseBrief(
  chatHistory: Array<{ role: string; content: string }>,
  language: 'en' | 'hi' = 'en'
): Promise<string> {
  const ai = getClient();

  const conversationText = chatHistory
    .map(msg => `${msg.role === 'user' ? 'Client' : 'AI'}: ${msg.content}`)
    .join('\n');

  const prompt = language === 'hi'
    ? `निम्नलिखित कानूनी परामर्श बातचीत के आधार पर एक संक्षिप्त केस सारांश बनाएं जो एक वकील को भेजा जा सके:\n\n${conversationText}\n\nकृपया निम्नलिखित शामिल करें:\n1. मामले का सारांश\n2. मुख्य कानूनी मुद्दे\n3. संभावित धाराएं/कानून\n4. अनुशंसित कार्रवाई`
    : `Based on the following legal consultation, generate a structured brief to share with an advocate:\n\n${conversationText}\n\nInclude:\n1. Case Summary\n2. Key Legal Issues\n3. Potentially Applicable Laws/Sections\n4. Recommended Next Steps\n5. Urgency Level (Low/Medium/High)`;

  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    input: prompt,
  });

  return interaction.output_text || 'Unable to generate brief.';
}

export async function analyzeDocument(
  documentText: string,
  documentType: string,
  language: 'en' | 'hi' = 'en'
): Promise<string> {
  const ai = getClient();

  const prompt = language === 'hi'
    ? `यह ${documentType} दस्तावेज़ देखें और सरल हिंदी में समझाएं:\n\n${documentText}\n\nमुख्य बिंदु, महत्वपूर्ण तारीखें, और कोई भी कानूनी जोखिम बताएं।`
    : `Review this ${documentType} document and explain it in simple language:\n\n${documentText}\n\nHighlight key points, important dates, obligations, and any legal risks.`;

  const interaction = await ai.interactions.create({
    model: 'gemini-3.8-flash',
    input: prompt,
  });

  return interaction.output_text || 'Unable to analyze document.';
}

export function isGeminiConfigured(): boolean {
  return !!API_KEY;
}


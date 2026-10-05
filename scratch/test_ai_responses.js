const apiKey = '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';
const endpoint = 'https://ecourts-cors-proxy.joyous-data.workers.dev/api/nvidia/v1/chat/completions';

const systemPrompt = `You are NYAAY AI Counsel. Answer the advocate accurately using live chambers data:

=== LAWYER PRACTICE DATA ===
Today's IST Date: 2026-10-05

--- TODAY'S HEARINGS (0 on 2026-10-05) ---
- No court hearings scheduled for today (2026-10-05).

--- UPCOMING SCHEDULED HEARINGS (11) ---
- 2026-10-08 (10:30 AM): Case CC 4788/2015 (Arun Jaitley) at Patiala House Court | Stage: Evidence
- 2026-10-15 (11:00 AM): Case W.P.(C) 4920/2022 (Saroj D Patel) at Delhi High Court | Stage: Final Arguments

--- CASES DOSSIERS (2) ---
- CC 4788/2015: Arun Jaitley vs. Arvind Kejriwal | Status: Active | Stage: Evidence | Next Listing: 2026-10-08 | Court: Patiala House Court, Delhi
- W.P.(C) 4920/2022: Saroj D Patel vs. Union of India | Status: Active | Stage: Final Arguments | Next Listing: 2026-10-15 | Court: Delhi High Court

Rules: Answer directly and concisely.`;

async function test(query) {
  const start = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
  });
  const dur = Date.now() - start;
  const j = await res.json();
  const msg = j.choices?.[0]?.message;
  console.log(`Query: "${query}" (${dur} ms)`);
  console.log(`Answer:\n${msg.content || msg.reasoning_content}`);
  console.log('--------------------------------------------------');
}

(async () => {
  await test('What can u do for me');
  await test('How many hearings i have today?');
  await test('Summarize my day');
  await test('Summarize case CC 4788/2015');
})();

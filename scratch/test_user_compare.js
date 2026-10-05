const apiKey = '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';
const base = 'https://ecourts-cors-proxy.joyous-data.workers.dev/api/nvidia/v1';

async function test(contextDesc) {
  const start = Date.now();
  console.log(`Starting test: ${contextDesc}...`);
  try {
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { 
            role: 'system', 
            content: `You are NYAAY AI Counsel. Answer the advocate query accurately. Context: ${contextDesc}.` 
          },
          { role: 'user', content: 'Hi' }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });
    const duration = Date.now() - start;
    const json = await res.json();
    console.log(`Status: ${res.status}, Time: ${duration}ms`);
    console.log('Result:', json.choices?.[0]?.message?.content);
  } catch(e) {
    console.error(`Failed after ${Date.now() - start}ms:`, e.message);
  }
}

async function run() {
  await test('User 1: 6 cases, 15 hearings, 4 invoices');
  await test('User 2: 2 cases, 11 hearings, 5 invoices');
}

run();

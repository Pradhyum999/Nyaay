const apiKey = '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';
const base = 'https://ecourts-cors-proxy.joyous-data.workers.dev/api/nvidia/v1';

async function testWithHistory() {
  const start = Date.now();
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
          { role: 'system', content: 'You are NYAAY AI Counsel.' },
          { role: 'assistant', content: 'Greetings Counsel! I am NYAAY AI Judicial Assistant. I am grounded in your live chamber records (cases, cause lists, tasks, invoices, documents). How may I assist your practice today?' },
          { role: 'user', content: 'Hi' }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });
    const duration = Date.now() - start;
    const json = await res.json();
    console.log(`Status: ${res.status}, Time: ${duration}ms`);
    console.log('Result:', json);
  } catch(e) {
    console.error(`Failed after ${Date.now() - start}ms:`, e.message);
  }
}

testWithHistory();

const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'http://localhost:5173/api/nvidia/v1',
  apiKey: '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',
  dangerouslyAllowBrowser: true,
  maxRetries: 0
});

async function run() {
  console.log('Testing 1: "hi" ...');
  let t0 = Date.now();
  let res = await client.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: 'hi' }],
    temperature: 1,
    top_p: 1,
    max_tokens: 4096,
    stream: false
  });
  console.log('Result 1 (' + ((Date.now() - t0) / 1000).toFixed(2) + 's):', res.choices[0].message.content);
  if (res.choices[0].message.reasoning_content) {
    console.log('Reasoning 1:', res.choices[0].message.reasoning_content);
  }

  console.log('\nTesting 2: "Which number is larger, 9.11 or 9.8?" ...');
  t0 = Date.now();
  res = await client.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: 'Which number is larger, 9.11 or 9.8?' }],
    temperature: 1,
    top_p: 1,
    max_tokens: 4096,
    stream: false
  });
  console.log('Result 2 (' + ((Date.now() - t0) / 1000).toFixed(2) + 's):', res.choices[0].message.content);
  if (res.choices[0].message.reasoning_content) {
    console.log('Reasoning 2:', res.choices[0].message.reasoning_content);
  }
}

run().catch(console.error);

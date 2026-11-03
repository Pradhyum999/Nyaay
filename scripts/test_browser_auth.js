import { spawn } from 'child_process';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getDebuggerUrl(port) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {}
    await wait(500);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

class SimpleCDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.callbacks = new Map();
    this.eventListeners = [];

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      } else if (data.method) {
        for (const listener of this.eventListeners) {
          listener(data.method, data.params);
        }
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve) => {
      this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  onEvent(cb) {
    this.eventListeners.push(cb);
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

async function run() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const port = 9222;
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--disable-blink-features=AutomationControlled',
    '--user-data-dir=' + process.env.TEMP + '\\chrome_test_profile_' + Date.now()
  ]);

  try {
    const wsUrl = await getDebuggerUrl(port);
    const appUrl = 'http://127.0.0.1:4173';
    const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${appUrl}`, { method: 'PUT' });
    const tabData = await newTabRes.json();
    const tabWs = tabData.webSocketDebuggerUrl;

    const cdp = new SimpleCDP(tabWs);
    await cdp.ready();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Console.enable");

    cdp.onEvent(async (method, params) => {
      if (method === "Runtime.consoleAPICalled") {
        console.log(`[Browser Console ${params.type}]`, ...params.args.map(a => a.value || a.description || JSON.stringify(a)));
      } else if (method === "Network.responseReceived") {
        const url = params.response.url;
        if (url.includes("signInWithPhoneNumber") || url.includes("sendVerificationCode")) {
          console.log(`[Network Response ${params.response.status}]`, url);
        }
      }
    });

    console.log("Loading app...");
    await wait(2500);

    // Language continue
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const contBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Continue');
        if (contBtn) contBtn.click();
      })()`
    });
    await wait(1000);

    // Select Citizen
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => 
          d.className.includes('cursor-pointer') && (d.innerText.includes('Citizen') || d.innerText.includes('Help'))
        );
        if (cards[0]) cards[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      })()`
    });
    await wait(1000);

    // Continue with Phone
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const phoneBtn = btns.find(b => b.innerText.toLowerCase().includes('phone'));
        if (phoneBtn) phoneBtn.click();
      })()`
    });
    await wait(1000);

    // Enter test phone number: 9999999999
    console.log("Entering phone number: 9999999999");
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('input[type="tel"]') || document.querySelector('input');
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, '9999999999');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()`
    });
    await wait(1000);

    // Click Send OTP
    console.log("Clicking Send OTP...");
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submitBtn = btns.find(b => b.innerText.toLowerCase().includes('otp'));
        if (submitBtn) submitBtn.click();
      })()`
    });

    // Wait until 6 OTP inputs appear
    console.log("Awaiting OTP inputs...");
    let readyForOtp = false;
    for (let i = 0; i < 15; i++) {
      await wait(500);
      const inputCountRes = await cdp.send("Runtime.evaluate", {
        expression: "document.querySelectorAll('input').length"
      });
      if (inputCountRes.result?.value === 6) {
        readyForOtp = true;
        break;
      }
    }

    if (!readyForOtp) {
      throw new Error("Did not reach 6 OTP inputs within 7.5s");
    }

    console.log("✅ Reached OTP verification screen! Typing code 123456...");

    // Fill each digit in the OTP boxes
    const fillResult = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const code = '123456';
        code.split('').forEach((digit, i) => {
          const inp = inputs[i];
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeInputValueSetter.call(inp, digit);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return inputs.map(i => i.value).join('');
      })()`
    });
    console.log("Typed OTP value:", fillResult.result?.value);

    await wait(1000);

    // Click Verify & Continue
    console.log("Clicking Verify & Continue...");
    const verifyClickRes = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const vBtn = btns.find(b => b.innerText.includes('Verify') || b.innerText.includes('Continue'));
        if (vBtn) {
          vBtn.click();
          return 'Clicked button: ' + vBtn.innerText.replace(/\\n/g, ' ');
        }
        return 'Verify button not found';
      })()`
    });
    console.log("Verify action:", verifyClickRes.result?.value);

    console.log("Waiting 6s to allow Firebase Auth to complete user creation / profile transition...");
    await wait(6000);

    const postAuthDump = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const allText = document.body.innerText;
        const alertEl = document.querySelector('[role="alert"], [class*="red"]');
        return {
          bodySnippet: allText.slice(0, 500),
          alertText: alertEl ? alertEl.innerText : null,
          hasProfileOrCaseScreen: allText.includes('Profile') || allText.includes('Case') || allText.includes('Welcome') || allText.includes('Portal') || allText.includes('Citizen') || allText.includes('Name'),
          inputs: Array.from(document.querySelectorAll('input')).map(i => ({ placeholder: i.placeholder, name: i.name, type: i.type, value: i.value }))
        };
      })()`,
      returnByValue: true
    });

    console.log("\n================ TEST FINAL OUTCOME ================");
    console.log(JSON.stringify(postAuthDump.result?.value, null, 2));

    cdp.close();
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

run();

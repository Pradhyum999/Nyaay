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

async function runAdvocateTest() {
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

    console.log("Loading app for Advocate test...");
    await wait(2500);

    // Continue language
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const contBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Continue');
        if (contBtn) contBtn.click();
      })()`
    });
    await wait(1000);

    // Select Advocate Card
    console.log("Selecting Advocate role...");
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => 
          d.className.includes('cursor-pointer') && (d.innerText.includes('Advocate') || d.innerText.includes('वकील'))
        );
        if (cards[0]) cards[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      })()`
    });
    await wait(1000);

    // Phone login
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const phoneBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('phone'));
        if (phoneBtn) phoneBtn.click();
      })()`
    });
    await wait(1000);

    // Enter advocate test phone: 9876543210
    console.log("Entering Advocate phone number: 9876543210...");
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('input[type="tel"]') || document.querySelector('input');
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, '9876543210');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()`
    });
    await wait(1000);

    // Send OTP
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submitBtn = btns.find(b => b.innerText.toLowerCase().includes('otp'));
        if (submitBtn) submitBtn.click();
      })()`
    });

    console.log("Awaiting OTP inputs...");
    for (let i = 0; i < 15; i++) {
      await wait(500);
      const inputCountRes = await cdp.send("Runtime.evaluate", {
        expression: "document.querySelectorAll('input').length"
      });
      if (inputCountRes.result?.value === 6) break;
    }

    console.log("Entering OTP 123456...");
    await cdp.send("Runtime.evaluate", {
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
      })()`
    });
    await wait(1000);

    console.log("Submitting verification...");
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const vBtn = btns.find(b => b.innerText.includes('Verify') || b.innerText.includes('Continue'));
        if (vBtn) vBtn.click();
      })()`
    });

    await wait(6000);

    const postAuth = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const allText = document.body.innerText;
        return {
          bodySnippet: allText.slice(0, 500),
          isAdvocateProfileScreen: allText.includes('Advocate') || allText.includes('Bar') || allText.includes('Enrollment') || allText.includes('वकील')
        };
      })()`,
      returnByValue: true
    });

    console.log("\nAdvocate Auth Result:\n", JSON.stringify(postAuth.result?.value, null, 2));

    cdp.close();
  } catch (e) {
    console.error("Advocate test error:", e);
  } finally {
    try { chromeProcess.kill(); } catch {}
  }
}

runAdvocateTest();

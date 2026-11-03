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
    '--user-data-dir=' + process.env.TEMP + '\\chrome_test_profile_' + Date.now()
  ]);

  try {
    const wsUrl = await getDebuggerUrl(port);
    const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?https://nyaay-legal-app-f6e99.web.app`, { method: 'PUT' });
    const tabData = await newTabRes.json();
    const tabWs = tabData.webSocketDebuggerUrl;

    const cdp = new SimpleCDP(tabWs);
    await cdp.ready();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Console.enable");

    cdp.onEvent((method, params) => {
      if (method === "Runtime.consoleAPICalled" || method === "Runtime.exceptionThrown") {
        console.log(`[Browser Console ${method}]`, JSON.stringify(params));
      }
    });

    await wait(3000);

    // Language
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const contBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Continue');
        if (contBtn) contBtn.click();
      })()`
    });
    await wait(1000);

    // Citizen
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => 
          d.className.includes('cursor-pointer') && (d.innerText.includes('Citizen') || d.innerText.includes('Help'))
        );
        if (cards[0]) cards[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      })()`
    });
    await wait(1000);

    // Phone
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const phoneBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('phone'));
        if (phoneBtn) phoneBtn.click();
      })()`
    });
    await wait(1000);

    // Enter phone
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

    // Submit
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('otp'));
        if (submitBtn) submitBtn.click();
      })()`
    });

    console.log("Waiting 8 seconds...");
    await wait(8000);

    const inspect = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const recaptchaEl = document.getElementById('recaptcha-verifier-container');
        const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({
          src: f.src,
          style: f.style.cssText,
          width: f.offsetWidth,
          height: f.offsetHeight
        }));
        return {
          recaptchaHtml: recaptchaEl ? recaptchaEl.innerHTML : null,
          iframes
        };
      })()`,
      returnByValue: true
    });
    console.log("Recaptcha inspection:", JSON.stringify(inspect.result?.value, null, 2));

    cdp.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chromeProcess.kill(); } catch {}
  }
}

run();

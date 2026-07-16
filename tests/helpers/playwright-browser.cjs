const { chromium, firefox, webkit } = require("playwright");

const BROWSER_TYPES = {
  chromium,
  firefox,
  webkit,
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class PlaywrightSession {
  constructor(page) {
    this.page = page;
  }

  async setWindowRect(rect) {
    const width = Number(rect.width) || 1280;
    const height = Number(rect.height) || 900;
    await this.page.setViewportSize({ width, height });
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async addInitScript(script, arg) {
    await this.page.addInitScript(script, arg);
  }

  async execute(script, args = []) {
    const body = String(script);
    if (!args.length) {
      return await this.page.evaluate((src) => {
        const fn = new Function(src);
        return fn();
      }, body);
    }
    return await this.page.evaluate(
      ({ src, vals }) => {
        const keys = vals.map((_, i) => `__p${i}`);
        const fn = new Function(...keys, src);
        return fn(...vals);
      },
      { src: body, vals: args }
    );
  }

  async click(selector, options = {}) {
    await this.page.click(selector, { timeout: 15000, ...options });
  }

  async type(text, options = {}) {
    await this.page.keyboard.type(String(text ?? ""), options);
  }

  async press(key, options = {}) {
    await this.page.keyboard.press(String(key ?? ""), options);
  }

  async waitFor(label, predicate, options = {}) {
    const timeoutMs = Number(options.timeoutMs) || 10000;
    const intervalMs = Number(options.intervalMs) || 100;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const value = await predicate();
      if (value) return value;
      await delay(intervalMs);
    }

    throw new Error(`Timed out waiting for ${label}`);
  }

  async close() {
    // Session owns only the page; context is closed by harness.
  }
}

function normalizeBrowserName(value) {
  const name = String(value || "chromium").trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(BROWSER_TYPES, name)) {
    throw new Error(`Unsupported Playwright browser: ${name}`);
  }
  return name;
}

async function startPlaywrightBrowser(options = {}) {
  const browserName = normalizeBrowserName(options.browserName);
  const browserType = BROWSER_TYPES[browserName];
  const browser = await browserType.launch({
    headless: options.headless !== false,
    args: options.args,
  });

  return {
    skipReason: "",
    logs() {
      return { stderr: "", stdout: "" };
    },
    browserName,
    async newSession(sessionOptions = {}) {
      // Below 981px the Review runs control is `#recentWritingTrigger` (drawer). At min-width 981px
      // the trigger is `display:none` and runs live in `#recentRailList` instead.
      const viewport = sessionOptions.viewport || { width: 960, height: 900 };
      const context = await browser.newContext({
        viewport,
        reducedMotion: sessionOptions.reducedMotion,
      });
      const page = await context.newPage();
      const session = new PlaywrightSession(page);
      return {
        close: async () => {
          await context.close();
        },
        session,
        skipReason: "",
      };
    },
    async close() {
      await browser.close();
    },
  };
}

async function startPlaywrightChromium(options = {}) {
  return await startPlaywrightBrowser({ ...options, browserName: "chromium" });
}

module.exports = {
  PlaywrightSession,
  normalizeBrowserName,
  startPlaywrightBrowser,
  startPlaywrightChromium,
};

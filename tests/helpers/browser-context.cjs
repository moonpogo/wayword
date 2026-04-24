const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("./bundle-require.cjs");

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(...names) {
      names.forEach((name) => values.add(String(name)));
    },
    remove(...names) {
      names.forEach((name) => values.delete(String(name)));
    },
    contains(name) {
      return values.has(String(name));
    },
    toggle(name, force) {
      const key = String(name);
      if (force === true) {
        values.add(key);
        return true;
      }
      if (force === false) {
        values.delete(key);
        return false;
      }
      if (values.has(key)) {
        values.delete(key);
        return false;
      }
      values.add(key);
      return true;
    },
  };
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      const normalized = String(key);
      return store.has(normalized) ? store.get(normalized) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

function silentConsole() {
  return {
    log() {},
    info() {},
    warn() {},
    error() {},
  };
}

function createBrowserContext(overrides = {}) {
  const document = overrides.document || {
    body: {
      classList: createClassList(),
      style: {
        removeProperty() {},
        setProperty() {},
      },
    },
    documentElement: {
      classList: createClassList(),
    },
    activeElement: null,
    getElementById() {
      return null;
    },
    querySelector() {
      return null;
    },
  };

  const context = {
    console: overrides.console || silentConsole(),
    localStorage: overrides.localStorage || createMemoryStorage(),
    document,
    performance: overrides.performance || { now: () => 0 },
    requestAnimationFrame: overrides.requestAnimationFrame || ((cb) => {
      if (typeof cb === "function") cb(0);
      return 0;
    }),
    cancelAnimationFrame: overrides.cancelAnimationFrame || (() => {}),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    TypeError,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    parseInt,
    parseFloat,
    isNaN,
    ...overrides,
  };

  context.window = context;
  context.globalThis = context;
  context.self = context;
  if (!context.window.visualViewport) {
    context.window.visualViewport = { height: 800 };
  }
  if (typeof context.window.innerHeight !== "number") {
    context.window.innerHeight = 800;
  }

  vm.createContext(context);
  return context;
}

function loadBrowserScript(context, scriptRelativePath) {
  const abs = path.join(ROOT, scriptRelativePath);
  const code = fs.readFileSync(abs, "utf8");
  vm.runInContext(code, context, { filename: scriptRelativePath });
  return context;
}

function loadBrowserScripts(scriptRelativePaths, overrides = {}) {
  const context = createBrowserContext(overrides);
  scriptRelativePaths.forEach((scriptRelativePath) => {
    loadBrowserScript(context, scriptRelativePath);
  });
  return context;
}

module.exports = {
  createClassList,
  createMemoryStorage,
  loadBrowserScript,
  loadBrowserScripts,
  silentConsole,
};

const assert = require("node:assert/strict");
const test = require("node:test");
const Module = require("node:module");
const path = require("node:path");

test("static server falls back when 127.0.0.1 bind is denied", async () => {
  const originalLoad = Module._load;
  const helperPath = path.resolve(__dirname, "helpers/static-server.cjs");
  delete require.cache[helperPath];

  let errorHandler = null;
  const listenCalls = [];

  const fakeServer = {
    once(eventName, handler) {
      if (eventName === "error") {
        errorHandler = handler;
      }
    },
    listen(options, callback) {
      listenCalls.push(options);
      if (options && options.host === "127.0.0.1") {
        const error = new Error("operation not permitted");
        error.code = "EPERM";
        const handler = errorHandler;
        errorHandler = null;
        handler(error);
        return;
      }
      callback();
    },
    address() {
      return { port: 4321 };
    },
    close(callback) {
      callback();
    },
  };

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "http") {
      return {
        createServer() {
          return fakeServer;
        },
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const { startStaticServer } = require("./helpers/static-server.cjs");
    const server = await startStaticServer({ rootDir: process.cwd() });

    assert.deepEqual(listenCalls, [{ host: "127.0.0.1", port: 0 }, { host: undefined, port: 0 }]);
    assert.equal(server.host, "127.0.0.1");
    assert.equal(server.origin, "http://127.0.0.1:4321");

    await server.close();
  } finally {
    Module._load = originalLoad;
    delete require.cache[helperPath];
  }
});

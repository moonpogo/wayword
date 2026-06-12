const assert = require("node:assert/strict");
const test = require("node:test");
const { createMemoryStorage, loadBrowserScripts, silentConsole } = require("./helpers/browser-context.cjs");

async function captureEmailRedirectTo(location) {
  let capturedPayload = null;
  const context = loadBrowserScripts(["src/infrastructure/auth/auth-session-runtime.js"], {
    console: silentConsole(),
    URLSearchParams,
    location,
    waywordSupabaseClient: {
      getClient() {
        return {
          auth: {
            signInWithOtp(payload) {
              capturedPayload = payload;
              return Promise.resolve({ data: {}, error: null });
            },
          },
        };
      },
    },
  });

  await context.waywordAuthSessionRuntime.signInWithMagicLink("writer@example.com");
  return capturedPayload?.options?.emailRedirectTo || "";
}

test("auth-session-runtime defaults localhost origin to production-safe redirect", async () => {
  const redirect = await captureEmailRedirectTo({
    origin: "http://127.0.0.1:3001",
    pathname: "/index.html",
    hostname: "127.0.0.1",
    search: "",
  });
  assert.equal(redirect, "https://wayword.me/index.html");
});

test("auth-session-runtime allows explicit localhost redirect opt-in", async () => {
  const redirect = await captureEmailRedirectTo({
    origin: "http://localhost:3001",
    pathname: "/index.html",
    hostname: "localhost",
    search: "?waywordLocalAuthRedirect=1",
  });
  assert.equal(redirect, "http://localhost:3001/index.html");
});

test("auth-session-runtime uses deployed origin and never rewrites to localhost", async () => {
  const redirect = await captureEmailRedirectTo({
    origin: "https://wayword.me",
    pathname: "/index.html",
    hostname: "wayword.me",
  });
  assert.equal(redirect, "https://wayword.me/index.html");
  assert.equal(redirect.includes("localhost"), false);
  assert.equal(redirect.includes("127.0.0.1"), false);
});

test("auth-session-runtime supports Vercel preview origins", async () => {
  const redirect = await captureEmailRedirectTo({
    origin: "https://wayword-git-main-moonpogo.vercel.app",
    pathname: "/index.html",
    hostname: "wayword-git-main-moonpogo.vercel.app",
  });
  assert.equal(redirect, "https://wayword-git-main-moonpogo.vercel.app/index.html");
  assert.equal(redirect.includes("localhost"), false);
  assert.equal(redirect.includes("127.0.0.1"), false);
});

test("auth-session-runtime restores a signed-out draft only for the same user", async () => {
  const localStorage = createMemoryStorage();
  var authStateHandler = null;
  var latestDraft = "draft from user a";

  const context = loadBrowserScripts(["src/infrastructure/auth/auth-session-runtime.js"], {
    console: silentConsole(),
    URLSearchParams,
    localStorage,
    addEventListener() {},
    location: {
      origin: "https://wayword.me",
      pathname: "/index.html",
      hostname: "wayword.me",
      search: "",
      hash: "",
    },
    waywordSupabaseClient: {
      getClient() {
        return {
          auth: {
            getSession() {
              return Promise.resolve({ data: { session: null }, error: null });
            },
            onAuthStateChange(handler) {
              authStateHandler = handler;
            },
          },
        };
      },
    },
  });

  var restoredDraft = "";
  context.waywordAuthSessionRuntime.init({
    getDraftText() {
      return latestDraft;
    },
    setDraftText(value) {
      restoredDraft = value;
    },
  });

  assert.equal(typeof authStateHandler, "function");

  authStateHandler("SIGNED_OUT", { user: { id: "user-a" } });
  assert.equal(localStorage.getItem("wayword-auth-draft-snapshot"), "draft from user a");
  assert.equal(localStorage.getItem("wayword-auth-draft-snapshot-user"), "user-a");

  authStateHandler("SIGNED_IN", { user: { id: "user-b" } });
  assert.equal(restoredDraft, "");
  assert.equal(localStorage.getItem("wayword-auth-draft-snapshot"), null);
  assert.equal(localStorage.getItem("wayword-auth-draft-snapshot-user"), null);

  latestDraft = "draft from user b";
  authStateHandler("SIGNED_OUT", { user: { id: "user-b" } });
  authStateHandler("SIGNED_IN", { user: { id: "user-b" } });
  assert.equal(restoredDraft, "draft from user b");
});

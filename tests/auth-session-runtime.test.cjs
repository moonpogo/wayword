const assert = require("node:assert/strict");
const test = require("node:test");
const { loadBrowserScripts, silentConsole } = require("./helpers/browser-context.cjs");

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

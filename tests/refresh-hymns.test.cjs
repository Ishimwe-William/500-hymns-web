const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const compile = (path) => ts.transpileModule(fs.readFileSync(require.resolve(path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function verification(responses) {
  const calls = [];
  const m = { exports: {} };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    const response = responses.shift();
    if (!response) throw new Error("Unexpected request");
    return { ok: response.ok !== false, json: async () => response.body };
  };
  const env = { env: { NEXT_PUBLIC_FIREBASE_API_KEY: "public-key", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key" } };
  const supabase = { exports: {} };
  new Function("exports", "require", "module", "fetch", "process", compile("../lib/supabase.ts"))(supabase.exports, require, supabase, fetch, env);
  new Function("exports", "require", "module", "fetch", "process", compile("../lib/admin-verification.ts"))(m.exports, name => name === "@/lib/supabase" ? supabase.exports : require(name), m, fetch, env);
  return { verify: m.exports.verifyAdminAccessToken, calls };
}
function action(verify) {
  const events = [];
  const deps = {
    "@/lib/cache-tags": { HYMNS_CACHE_TAG: "hymns" },
    "@/lib/admin-verification": { verifyAdminAccessToken: async (token) => { events.push("verify"); return verify(token); } },
    "next/navigation": { unstable_rethrow: () => {} },
    "next/cache": { updateTag: (tag) => events.push(["expire", tag]), revalidatePath: (...args) => events.push(["refresh", ...args]) },
  };
  const m = { exports: {} };
  new Function("exports", "require", "module", compile("../app/actions/refresh-hymns.ts"))(m.exports, (name) => {
    assert.ok(name in deps, `Unexpected dependency: ${name}`);
    return deps[name];
  }, m);
  return { refresh: m.exports.refreshHymnsAfterSave, events };
}
const account = { body: { id: "verified-admin" } };
const adminRole = { body: [{ role: "admin" }] };

test("verified admins immediately expire the hymn cache and refresh the shared layout", async () => {
  const v = verification([account, adminRole]);
  const a = action(v.verify);
  assert.deepEqual(await a.refresh("valid-token"), { ok: true });
  assert.deepEqual(a.events, ["verify", ["expire", "hymns"], ["refresh", "/", "layout"]]);
  assert.match(v.calls[0].url, /\/auth\/v1\/user$/);
  assert.equal(v.calls[0].options.headers.Authorization, "Bearer valid-token");
  assert.match(v.calls[1].url, /profiles\?.*auth_user_id=eq.verified-admin/);
  assert.equal(v.calls[1].options.headers.get("Authorization"), "Bearer valid-token");
  assert.ok(v.calls.every((call) => call.options.cache === "no-store"));
});
test("missing or invalid tokens never invalidate the public cache", async () => {
  for (const token of ["", null, "x".repeat(20001)]) {
    const v = verification([]); const a = action(v.verify);
    assert.deepEqual(await a.refresh(token), { ok: false });
    assert.deepEqual(a.events, ["verify"]); assert.equal(v.calls.length, 0);
  }
});
test("expired sessions and missing accounts are rejected", async () => {
  for (const response of [{ ok: false }, { body: {} }, { body: { id: "" } }]) {
    const v = verification([response]); const a = action(v.verify);
    assert.deepEqual(await a.refresh("expired"), { ok: false });
    assert.deepEqual(a.events, ["verify"]); assert.equal(v.calls.length, 1);
  }
});
test("readers, missing roles, and denied role reads cannot invalidate the cache", async () => {
  for (const response of [{ ok: false }, { body: [] }, { body: [{ role: "user" }] }, { body: [{ role: "moderator" }] }]) {
    const v = verification([account, response]); const a = action(v.verify);
    assert.deepEqual(await a.refresh("reader-token"), { ok: false });
    assert.deepEqual(a.events, ["verify"]);
  }
});
test("verification network failures do not expose tokens or report a successful refresh", async () => {
  const a = action(async () => { throw new Error("request failed: sensitive-token"); });
  assert.deepEqual(await a.refresh("sensitive-token"), { ok: false });
  assert.deepEqual(a.events, ["verify"]);
});

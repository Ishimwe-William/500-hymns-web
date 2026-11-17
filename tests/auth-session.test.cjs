const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const source = ts.transpileModule(fs.readFileSync(require.resolve("../lib/auth-session.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleUnderTest = { exports: {} };
new Function("exports", "require", "module", source)(moduleUnderTest.exports, require, moduleUnderTest);
const { observeAuthSession, authErrorMessage } = moduleUnderTest.exports;
function harness() {
  let userNext, userError, latest, stoppedUser = false;
  const roles = [];
  const stop = observeAuthSession({
    watchUser(next, error) { userNext = next; userError = error; return () => { stoppedUser = true; }; },
    watchRole(uid, next, error) { const role = { uid, next, error, stopped: false }; roles.push(role); return () => { role.stopped = true; }; },
  }, (state) => { latest = state; });
  return { login: (uid) => userNext(uid ? { uid } : null), fail: () => userError(), roles, stop, get state() { return latest; }, get stoppedUser() { return stoppedUser; } };
}
test("only a server-confirmed admin role grants access", () => {
  const h = harness(); h.login("admin");
  assert.equal(h.state.isAdmin, false); assert.equal(h.state.checkingRole, true);
  h.roles[0].next("admin", true);
  assert.equal(h.state.isAdmin, false);
  h.roles[0].next("admin", false);
  assert.equal(h.state.isAdmin, true); assert.equal(h.state.checkingRole, false);
  h.stop();
});
test("missing roles, regular users, and moderators are not admins", () => {
  for (const role of [undefined, null, "user", "moderator", true, "ADMIN"]) {
    const h = harness(); h.login("reader"); h.roles[0].next(role, false);
    assert.equal(h.state.isAdmin, false); h.stop();
  }
});
test("role revocation and lookup failures immediately remove admin access", () => {
  const h = harness(); h.login("admin"); h.roles[0].next("admin", false);
  h.roles[0].next("user", false); assert.equal(h.state.isAdmin, false);
  h.roles[0].next("admin", false); h.roles[0].error();
  assert.equal(h.state.isAdmin, false); assert.ok(h.state.roleError); h.stop();
});
test("late callbacks cannot restore admin access after sign-out or account switching", () => {
  const h = harness(); h.login("admin"); const oldRole = h.roles[0]; oldRole.next("admin", false);
  h.login("reader"); assert.equal(oldRole.stopped, true); assert.equal(h.state.isAdmin, false);
  oldRole.next("admin", false); assert.equal(h.state.user.uid, "reader"); assert.equal(h.state.isAdmin, false);
  h.roles[1].next("admin", false); h.login(null); h.roles[1].next("admin", false);
  assert.equal(h.state.user, null); assert.equal(h.state.isAdmin, false); h.stop();
});
test("auth failures and cleanup invalidate pending role responses", () => {
  const h = harness(); h.login("admin"); h.fail(); h.roles[0].next("admin", false);
  assert.equal(h.state.user, null); assert.equal(h.state.isAdmin, false);
  h.stop(); const last = h.state; h.login("admin"); h.roles[0].error();
  assert.equal(h.state, last); assert.equal(h.stoppedUser, true);
});
test("sign-in failures have actionable messages without exposing raw errors", () => {
  assert.match(authErrorMessage({ code: "auth/popup-blocked" }), /pop-ups/);
  assert.match(authErrorMessage({ code: "auth/unauthorized-domain" }), /website address/);
  assert.match(authErrorMessage({ code: "auth/popup-closed-by-user" }), /cancelled/);
  assert.doesNotMatch(authErrorMessage(new Error("secret")), /secret/);
});

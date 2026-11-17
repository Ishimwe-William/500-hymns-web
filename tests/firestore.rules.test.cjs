const { before, beforeEach, after, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } = require("firebase/firestore");
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-hymns-web", firestore: { rules: fs.readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8187 } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/admin"), { role: "admin" });
    await setDoc(doc(db, "users/reader"), { role: "user", displayName: "Reader" });
    await setDoc(doc(db, "hymns/one"), { title: "Original", number: 1 });
  });
});
after(async () => { await env?.cleanup(); });
const database = (uid) => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();

test("everyone may read the public hymnbook", async () => {
  await assertSucceeds(getDocs(collection(database(), "hymns")));
});
test("guests, readers, and accounts without roles cannot write hymns", async () => {
  for (const uid of [null, "reader", "unknown"]) {
    const db = database(uid);
    await assertFails(updateDoc(doc(db, "hymns/one"), { title: "Changed" }));
    await assertFails(setDoc(doc(db, "hymns/two"), { title: "New" }));
    await assertFails(deleteDoc(doc(db, "hymns/one")));
  }
});
test("admins can edit hymns with authenticated editor metadata", async () => {
  const db = database("admin");
  await assertSucceeds(updateDoc(doc(db, "hymns/one"), { title: "Changed", updatedAt: serverTimestamp(), updatedBy: { uid: "admin" } }));
  assert.equal((await getDoc(doc(db, "hymns/one"))).data().updatedBy.uid, "admin");
  await assertSucceeds(setDoc(doc(db, "hymns/two"), { title: "New" }));
  await assertSucceeds(deleteDoc(doc(db, "hymns/two")));
});
test("readers may read their own role but not other profiles or the user list", async () => {
  const db = database("reader");
  await assertSucceeds(getDoc(doc(db, "users/reader")));
  await assertFails(getDoc(doc(db, "users/admin")));
  await assertFails(getDocs(collection(db, "users")));
  await assertFails(getDoc(doc(database(), "users/reader")));
});
test("readers cannot promote themselves, remove their role, or delete a role record", async () => {
  const db = database("reader");
  await assertFails(updateDoc(doc(db, "users/reader"), { role: "admin" }));
  await assertFails(setDoc(doc(db, "users/reader"), { displayName: "No role" }));
  await assertFails(deleteDoc(doc(db, "users/reader")));
  await assertFails(setDoc(doc(database("unknown"), "users/unknown"), { role: "admin" }));
  await assertFails(updateDoc(doc(db, "users/reader"), { displayName: "Updated name" }));
});
test("user records can only be provisioned through trusted backend or console access", async () => {
  const db = database("new-reader");
  await assertFails(setDoc(doc(db, "users/new-reader"), { role: "user" }));
  await assertFails(updateDoc(doc(database("admin"), "users/reader"), { role: "admin" }));
  await assertFails(setDoc(doc(db, "users/another-reader"), { role: "user" }));
});
test("admin role changes are enforced on the next write", async () => {
  const db = database("admin");
  await env.withSecurityRulesDisabled((context) => updateDoc(doc(context.firestore(), "users/reader"), { role: "admin" }));
  await assertSucceeds(updateDoc(doc(database("reader"), "hymns/one"), { title: "Approved" }));
  await env.withSecurityRulesDisabled((context) => updateDoc(doc(context.firestore(), "users/admin"), { role: "user" }));
  await assertFails(updateDoc(doc(db, "hymns/one"), { title: "Revoked" }));
});

test("admins can read the user list without being allowed to write user records", async () => {
  await assertSucceeds(getDocs(collection(database("admin"), "users")));
  await assertFails(deleteDoc(doc(database("admin"), "users/reader")));
});
test("favorites, preferences, and recent hymns are private to their owner", async () => {
  for (const name of ["userFavorites", "userPreferences", "userRecent"]) {
    const owner = doc(database("reader"), `${name}/reader`);
    await assertSucceeds(setDoc(owner, { saved: [] }));
    await assertSucceeds(getDoc(owner));
    await assertFails(getDoc(doc(database("admin"), `${name}/reader`)));
    await assertFails(setDoc(doc(database("unknown"), `${name}/reader`), { saved: [] }));
    await assertFails(getDoc(doc(database(), `${name}/reader`)));
  }
});

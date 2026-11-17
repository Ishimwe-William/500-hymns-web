const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function compile(path) {
  return ts.transpileModule(fs.readFileSync(require.resolve(path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
}
const sectionModule = { exports: {} };
new Function("exports", "require", "module", compile("../lib/hymn-sections.ts"))(sectionModule.exports, require, sectionModule);
function loader({ configured = true, docs = [], fail = false } = {}) {
  const lifetimes = [];
  let reads = 0, documentReads = 0;
  const dependencies = {
    "@/lib/cache-tags": { HYMNS_CACHE_TAG: "hymns" },
    "next/cache": { cacheTag: () => {}, cacheLife: (profile) => lifetimes.push(profile) },
    "next/navigation": { unstable_rethrow: (error) => { if (error?.internal) throw error; } },
    "firebase/firestore/lite": { doc: (_db, _collection, id) => id, getDoc: async (id) => {
      documentReads++; if (fail) throw fail === true ? new Error("Backend unavailable") : fail;
      const found = docs.find((document) => document.id === id);
      return found ? { ...found, exists: () => true } : { id, exists: () => false };
    }, getFirestore: () => ({}), collection: () => "hymns", getDocs: async () => { reads++; if (fail) throw fail === true ? new Error("Backend unavailable") : fail; return { docs }; } },
    "@/lib/firebase-app": { firebaseApp: configured ? {} : null, isFirebaseConfigured: configured },
    "@/lib/hymns": { lyricsTextFor: (sections) => sections.flatMap((s) => s.lines).join("\n") },
    "@/lib/hymn-sections": sectionModule.exports,
  };
  const m = { exports: {} };
  new Function("exports", "require", "module", "console", compile("../lib/hymns-server.ts"))(m.exports, (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, m, { error() {} });
  return { ...m.exports, lifetimes, get reads() { return reads; }, get documentReads() { return documentReads; } };
}

test("missing configuration never substitutes dummy hymns", async () => {
  const h = loader({ configured: false });
  assert.deepEqual(await h.getHymns(), []);
  assert.equal(h.reads, 0);
  assert.deepEqual(h.lifetimes, ["seconds"]);
});
test("an empty collection remains empty with a short recovery cache", async () => {
  const h = loader();
  assert.deepEqual(await h.getHymns(), []);
  assert.deepEqual(h.lifetimes, ["seconds"]);
});
test("backend failures never substitute generated titles", async () => {
  const h = loader({ fail: true });
  assert.deepEqual(await h.getHymns(), []);
  await assert.rejects(h.getHymnById("h-1"), /could not be loaded/);
  assert.deepEqual(h.lifetimes, ["seconds", "hours"]);
});
test("only valid backend hymns are returned, in numeric order", async () => {
  const h = loader({ docs: [
    { id: "real-two", data: () => ({ number: 2, title: "Second", stanzas: [{ stanzaNumber: 0, text: "Actual lyrics" }] }) },
    { id: "invalid", data: () => ({ number: 3 }) },
    { id: "real-one", data: () => ({ number: 1, title: "First", origin: "Original title" }) },
  ] });
  const hymns = await h.getHymns();
  assert.deepEqual(hymns.map((hymn) => hymn.id), ["real-one", "real-two"]);
  assert.equal(hymns[1].sections[0].number, 0);
  assert.equal(hymns[1].lyricsText, "Actual lyrics");
  assert.deepEqual(h.lifetimes, ["hours"]);
});

test("Next.js internal prerender signals are rethrown instead of becoming an empty hymnbook", async () => {
  const internal = Object.assign(new Error("Prerender signal"), { internal: true });
  const h = loader({ fail: internal });
  await assert.rejects(h.getHymns(), (error) => error === internal);
  assert.deepEqual(h.lifetimes, []);
});

test("opening one hymn fetches one document without loading the collection", async () => {
  const h = loader({ docs: [{ id: "001", data: () => ({ number: 1, title: "Actual hymn", stanzas: [{ stanzaNumber: 1, text: "Real lyrics" }] }) }] });
  const hymn = await h.getHymnById("001");
  assert.equal(hymn.title, "Actual hymn"); assert.equal(h.documentReads, 1); assert.equal(h.reads, 0);
  assert.equal(await h.getHymnById("missing"), undefined);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const source = ts.transpileModule(fs.readFileSync(require.resolve("../lib/hymn-sections.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const sectionModule = { exports: {} };
new Function("exports", "require", "module", source)(sectionModule.exports, require, sectionModule);
const { sectionsFromBlocks, sectionsToBlocks, orderedSections, presentationSections } = sectionModule.exports;
const ids = (sections) => sections.map((s) => `${s.type}:${s.number}`);
const verse = (n) => ({ stanzaNumber: n, text: `Stanza ${n}` });
const refrain = (n) => ({ refrainNumber: n, text: `Chorus ${n}` });

test("a zero-numbered refrain precedes stanza one and repeats in presentation", () => {
  const sections = sectionsFromBlocks([verse(2), verse(1)], [refrain(0)]);
  assert.deepEqual(ids(sections), ["refrain:0", "verse:1", "verse:2"]);
  assert.deepEqual(ids(presentationSections(sections)), ["refrain:0", "verse:1", "refrain:0", "verse:2", "refrain:0"]);
});

test("stanza wins ties, including zero; reader contains one refrain", () => {
  const sections = sectionsFromBlocks([verse(1), verse(0)], [refrain(0)]);
  assert.deepEqual(ids(sections), ["verse:0", "refrain:0", "verse:1"]);
  assert.deepEqual(ids(presentationSections(sections)), ["verse:0", "refrain:0", "verse:1", "refrain:0"]);
});

test("refrain one appears once after stanza one in the reader", () => {
  const sections = sectionsFromBlocks([verse(3), verse(1), verse(2)], [refrain(1)]);
  assert.deepEqual(ids(sections), ["verse:1", "refrain:1", "verse:2", "verse:3"]);
  assert.deepEqual(ids(presentationSections(sections)), ["verse:1", "refrain:1", "verse:2", "refrain:1", "verse:3", "refrain:1"]);
});

test("multiple refrains follow their numbers, matching stanzas in presentation", () => {
  const sections = sectionsFromBlocks([verse(2), verse(0), verse(1)], [refrain(2), refrain(0), refrain(1)]);
  assert.deepEqual(ids(sections), ["verse:0", "refrain:0", "verse:1", "refrain:1", "verse:2", "refrain:2"]);
  assert.deepEqual(ids(presentationSections(sections)), ids(sections));
});

test("presentation uses the first refrain when no numbered match exists, as in the app", () => {
  const sections = sectionsFromBlocks([verse(1), verse(2), verse(3)], [refrain(1), refrain(2)]);
  assert.deepEqual(ids(presentationSections(sections)), ["verse:1", "refrain:1", "verse:2", "refrain:2", "verse:3", "refrain:1"]);
});

test("keyed collections and numeric strings preserve zero and ignore empty blocks", () => {
  const sections = sectionsFromBlocks({ b: verse("2"), a: verse("0"), empty: { text: " " }, invalid: null }, { a: refrain("0") });
  assert.deepEqual(ids(sections), ["verse:0", "refrain:0", "verse:2"]);
});

test("saving and reloading preserves original numbers, gaps, and refrain positions", () => {
  const original = sectionsFromBlocks([verse(0), verse(4)], [refrain(0), refrain(3)]);
  const saved = sectionsToBlocks(original);
  assert.deepEqual(saved.stanzas.map((s) => s.stanzaNumber), [0, 4]);
  assert.deepEqual(saved.refrains.map((s) => s.refrainNumber), [0, 3]);
  assert.deepEqual(sectionsFromBlocks(saved.stanzas, saved.refrains), original);
});

test("legacy sections use label numbers without mutating their input", () => {
  const input = [{ type: "refrain", label: "Refrain 0", lines: ["Chorus"] }, { type: "verse", label: "Verse 0", lines: ["Stanza"] }];
  assert.deepEqual(ids(orderedSections(input)), ["verse:0", "refrain:0"]);
  assert.equal(input[0].number, undefined);
});

test("presentation handles stanza-only, refrain-only, and empty hymns", () => {
  assert.deepEqual(ids(presentationSections(sectionsFromBlocks([verse(0), verse(2)], []))), ["verse:0", "verse:2"]);
  assert.deepEqual(ids(presentationSections(sectionsFromBlocks([], [refrain(1), refrain(0)]))), ["refrain:0", "refrain:1"]);
  assert.deepEqual(presentationSections([]), []);
  assert.deepEqual(presentationSections([{ type: "verse", number: 0, label: "Verse 0", lines: [" "] }]), []);
});

test("distinct numbered refrains are retained even without a matching stanza", () => {
  const sections = sectionsFromBlocks([verse(1), verse(4)], [refrain(3), refrain(2)]);
  assert.deepEqual(ids(presentationSections(sections)), ["verse:1", "refrain:2", "refrain:3", "verse:4", "refrain:2"]);
});

test("missing, null, empty, or blank refrains add no reader sections or presentation slides", () => {
  for (const refrains of [undefined, null, [], {}, [{ refrainNumber: 0, text: "   " }]]) {
    const sections = sectionsFromBlocks([verse(2), verse(0), verse(1)], refrains);
    assert.deepEqual(ids(sections), ["verse:0", "verse:1", "verse:2"]);
    assert.deepEqual(ids(presentationSections(sections)), ["verse:0", "verse:1", "verse:2"]);
    assert.deepEqual(sectionsToBlocks(sections).refrains, []);
  }
});

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
const { normalizeLyricText, lyricSegments, underlineForSelection } = sectionModule.exports;

test("selecting repeated syllables records their exact occurrence, including overlapping matches", () => {
  assert.deepEqual(underlineForSelection("ha ha ha", 6, 8), { word: "ha", occurrence: 3 });
  assert.deepEqual(underlineForSelection("banana", 3, 6), { word: "ana", occurrence: 2 });
  assert.deepEqual(underlineForSelection("ha\\nha", 4, 6), { word: "ha", occurrence: 2 });
  assert.deepEqual(underlineForSelection("ha\\nha", 0, 6), { word: "ha\nha", occurrence: 1 });
  assert.equal(underlineForSelection("hello", 2, 2), null);
  assert.equal(underlineForSelection("a  b", 1, 3), null);
});

test("lyrics preserve Enter, blank rows, and pasted newline escapes through save and reload", () => {
  const text = "First\\nSecond\r\n\r\nFourth\n";
  const sections = sectionsFromBlocks([{ stanzaNumber: 1, text }], []);
  assert.deepEqual(sections[0].lines, ["First", "Second", "", "Fourth", ""]);
  const saved = sectionsToBlocks(sections);
  assert.equal(saved.stanzas[0].text, "First\nSecond\n\nFourth\n");
  assert.deepEqual(sectionsFromBlocks(saved.stanzas, saved.refrains), sections);
  assert.equal(normalizeLyricText("A\\r\\nB\\rC"), "A\nB\nC");
});

test("mobile underline phrases and occurrence numbers survive editing and presentation", () => {
  const underline = ["Sing", { word: "again", occurrence: 2 }];
  const sections = sectionsFromBlocks([{ stanzaNumber: 1, text: "Sing again\nSing again", underline }], [{ refrainNumber: 1, text: "Again", underline: ["Again"] }]);
  assert.deepEqual(sections[0].underline, underline);
  const saved = sectionsToBlocks(sections);
  assert.deepEqual(saved.stanzas[0].underline, underline);
  assert.deepEqual(sectionsFromBlocks(saved.stanzas, saved.refrains), sections);
  assert.deepEqual(presentationSections(sections)[1].underline, ["Again"]);
  assert.deepEqual(lyricSegments(sections[0].lines.join("\n"), underline), [
    { text: "Sing", underlined: true }, { text: " again\nSing ", underlined: false }, { text: "again", underlined: true },
  ]);
});

test("underline matching handles overlap, missing words and phrases spanning a line break", () => {
  assert.deepEqual(lyricSegments("a\\nb a", ["a\nb", "a", { word: "a", occurrence: 2 }, { word: "missing", occurrence: 1 }]), [
    { text: "a\nb", underlined: true }, { text: " ", underlined: false }, { text: "a", underlined: true },
  ]);
});

test("offline formatting matches the reader and treats markup as literal lyrics", () => {
  const sandbox = { window: {} };
  require("node:vm").runInNewContext(fs.readFileSync(require.resolve("../public/lyric-format.js"), "utf8"), sandbox);
  const doc = {
    createTextNode: text => ({ text, underlined: false }),
    createElement: () => ({ style: {}, set textContent(text) { this.text = text; }, underlined: true }),
  };
  const node = { ownerDocument: doc, style: {}, children: [], replaceChildren() { this.children = []; }, append(child) { this.children.push(child); } };
  const section = { lines: ["<script>again\\nagain"], underline: [{ word: "again", occurrence: 2 }] };
  sandbox.window.renderHymnLyrics(node, section);
  assert.deepEqual(node.children.filter(child => child.text).map(({ text, underlined }) => ({ text, underlined })), lyricSegments(section.lines.join("\n"), section.underline));
  assert.equal(node.style.whiteSpace, "pre-wrap");
});

test("server-rendered lyrics contain underline markup and preserved blank lines without interpreting HTML", () => {
  const compiled = ts.transpileModule(fs.readFileSync(require.resolve("../components/section-lyrics.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const component = { exports: {} };
  new Function("exports", "require", "module", compiled)(component.exports, name => name === "@/lib/hymn-sections" ? sectionModule.exports : require(name), component);
  const html = require("react-dom/server").renderToStaticMarkup(require("react").createElement(component.exports.SectionLyrics, {
    section: { lines: ["Sing\\n\\n<script>"], underline: ["Sing"] },
  }));
  assert.match(html, /white-space:pre-wrap/);
  assert.match(html, /<u[^>]*>Sing<\/u>\n\n&lt;script&gt;/);
});
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

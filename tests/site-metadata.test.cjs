const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const load = (path) => {
  const source = ts.transpileModule(fs.readFileSync(require.resolve(path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} }; new Function("exports", "require", "module", source)(m.exports, require, m); return m.exports;
};
const { publicMetadata, hymnDescription, jsonLd } = load("../lib/site.ts");
const { chooseAudienceScreen } = load("../lib/presentation-display.ts");
test("share metadata has absolute canonical links and large image cards", () => {
  const metadata = publicMetadata("Hymn 1 - Title", "Description", "/hymns/001", "/hymns/001/opengraph-image");
  assert.equal(metadata.alternates.canonical, "https://500-hymns.vercel.app/hymns/001");
  assert.equal(metadata.openGraph.images[0].url, "https://500-hymns.vercel.app/hymns/001/opengraph-image");
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.equal(metadata.openGraph.description, "Description");
});
test("hymn descriptions use real titles, origins, and lyrics within snippet length", () => {
  const description = hymnDescription({ number: 1, title: "Title", origin: "Original", lyricsText: "Line one\n".repeat(30) });
  assert.ok(description.startsWith("Hymn 1: Title. Original title: Original."));
  assert.ok(description.length <= 160); assert.ok(!description.includes("\n"));
});
test("structured data cannot escape its script element", () => {
  const text = jsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(text.includes("<"), false);
  assert.equal(JSON.parse(text).name, "</script><script>alert(1)</script>");
});
test("external display selection prefers another external screen and handles single displays", () => {
  const laptop = { left: 0, top: 0, isInternal: true }, projector = { left: -1920, top: 0, isInternal: false };
  assert.equal(chooseAudienceScreen({ screens: [laptop], currentScreen: laptop }), null);
  assert.equal(chooseAudienceScreen({ screens: [laptop, projector], currentScreen: laptop }), projector);
  assert.equal(chooseAudienceScreen({ screens: [laptop, projector], currentScreen: projector }), laptop);
});

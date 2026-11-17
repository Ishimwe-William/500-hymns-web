const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const m = { exports: {} };
const source = ts.transpileModule(fs.readFileSync(require.resolve("../lib/player-queue.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function("exports", "require", "module", source)(m.exports, require, m);
const { playableQueue, queueNeighbors } = m.exports;
const hymn = (number, audioUrl) => ({ id: `hymn-${number}`, number, title: `Hymn ${number}`, audioUrl });

test("the queue is sorted by number and skips absent or empty recordings", () => {
  const input = [hymn(4, "four.mp3"), hymn(1), hymn(3, " "), hymn(2, "two.mp3")];
  const before = [...input];
  assert.deepEqual(playableQueue(input).map((h) => h.number), [2, 4]);
  assert.deepEqual(input, before);
});
test("previous and next select adjacent available recordings without wrapping", () => {
  const queue = playableQueue([hymn(9, "nine.mp3"), hymn(1, "one.mp3"), hymn(5, "five.mp3")]);
  assert.deepEqual(queueNeighbors(queue, "hymn-5"), { previous: queue[0], next: queue[2] });
  assert.deepEqual(queueNeighbors(queue, "hymn-1"), { previous: null, next: queue[1] });
  assert.deepEqual(queueNeighbors(queue, "hymn-9"), { previous: queue[1], next: null });
});
test("empty queues, missing current tracks, and single recordings disable unavailable directions", () => {
  for (const [queue, current] of [[[], null], [[], "unknown"], [[hymn(1, "one.mp3")], "unknown"], [[hymn(1, "one.mp3")], "hymn-1"]]) {
    assert.deepEqual(queueNeighbors(queue, current), { previous: null, next: null });
  }
});

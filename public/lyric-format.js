/* Plain DOM rendering for the offline reader and projector; never interprets HTML. */
window.renderHymnLyrics = function (node, section) {
  const normalize = text => text.replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\r\n?/g, "\n");
  const text = normalize(section.lines.join("\n"));
  const ranges = [];
  for (const target of section.underline || []) {
    const word = normalize(typeof target === "string" ? target : target.word);
    const occurrence = typeof target === "string" ? 1 : target.occurrence;
    if (!word || !Number.isInteger(occurrence) || occurrence < 1) continue;
    let start = -1;
    for (let i = 0; i < occurrence; i++) {
      start = text.indexOf(word, start + 1);
      if (start < 0) break;
    }
    if (start >= 0) ranges.push({ start, end: start + word.length });
  }
  ranges.sort((a, b) => a.start - b.start);
  node.replaceChildren();
  node.style.whiteSpace = "pre-wrap";
  let end = 0;
  for (const range of ranges) {
    if (range.start < end) continue;
    node.append(node.ownerDocument.createTextNode(text.slice(end, range.start)));
    const marked = node.ownerDocument.createElement("u");
    marked.style.textDecorationSkipInk = "none";
    marked.style.textUnderlineOffset = "0.15em";
    marked.style.textDecorationThickness = "0.06em";
    marked.textContent = text.slice(range.start, range.end);
    node.append(marked);
    end = range.end;
  }
  node.append(node.ownerDocument.createTextNode(text.slice(end)));
};

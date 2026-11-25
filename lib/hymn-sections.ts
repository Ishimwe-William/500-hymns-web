import type { HymnSection, UnderlineTarget } from "./hymns";

/** Accept pasted escape sequences as well as actual textarea line breaks. */
export function normalizeLyricText(text: string): string {
  return text.replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\r\n?/g, "\n");
}

/** Convert a textarea selection to the mobile app's word/occurrence format. */
export function underlineForSelection(text: string, start: number, end: number): { word: string; occurrence: number } | null {
  if (start < 0 || end > text.length || end <= start) return null;
  const word = normalizeLyricText(text.slice(start, end));
  if (!word.trim()) return null;
  const position = normalizeLyricText(text.slice(0, start)).length;
  const normalized = normalizeLyricText(text);
  let match = -1, occurrence = 0;
  do {
    match = normalized.indexOf(word, match + 1);
    if (match < 0 || match > position) return null;
    occurrence++;
  } while (match < position);
  return { word, occurrence };
}

export function lyricSegments(text: string, underline: UnderlineTarget[] = []) {
  text = normalizeLyricText(text);
  const ranges: { start: number; end: number }[] = [];
  for (const target of underline) {
    const word = normalizeLyricText(typeof target === "string" ? target : target.word);
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
  const parts: { text: string; underlined: boolean }[] = [];
  let end = 0;
  for (const range of ranges) {
    if (range.start < end) continue;
    if (range.start > end) parts.push({ text: text.slice(end, range.start), underlined: false });
    parts.push({ text: text.slice(range.start, range.end), underlined: true });
    end = range.end;
  }
  if (end < text.length) parts.push({ text: text.slice(end), underlined: false });
  return parts;
}

function underlineTargets(value: unknown): UnderlineTarget[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((target): UnderlineTarget[] => {
    if (typeof target === "string") return target.trim() ? [target] : [];
    if (target && typeof target.word === "string" && target.word.trim() && Number.isInteger(target.occurrence) && target.occurrence > 0) return [{ word: target.word, occurrence: target.occurrence }];
    return [];
  });
}

/** Display labels are independent of the stored section numbering and labels. */
export function sectionHeading(section: HymnSection): string {
  if (section.type === "refrain") return "Refrain";
  const labelNumber = section.label.match(/(?:verse|stanza)\s+(\d+)/i)?.[1];
  return String(sectionNumber(section.number ?? labelNumber, 1));
}

/** Missing numbers get a fallback; zero is a valid position. */
export function sectionNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" && typeof value !== "string") return fallback;
  if (typeof value === "string" && !value.trim()) return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

export function orderedSections(sections: HymnSection[]): HymnSection[] {
  const counts = { verse: 0, refrain: 0 };
  return sections.map((section) => {
    const fallback = ++counts[section.type];
    const labelNumber = section.label.match(/(?:verse|stanza|refrain)\s+(\d+)/i)?.[1];
    return { ...section, number: sectionNumber(section.number ?? labelNumber, fallback) };
  }).sort((a, b) => a.number - b.number ||
    (a.type === b.type ? 0 : a.type === "verse" ? -1 : 1));
}

function blocks(value: unknown): Record<string, unknown>[] {
  // The app's stored collections can be arrays or keyed objects.
  if (!value || typeof value !== "object") return [];
  return Object.values(value).filter((block): block is Record<string, unknown> =>
    Boolean(block) && typeof block === "object");
}

export function sectionsFromBlocks(stanzas: unknown, refrains: unknown): HymnSection[] {
  const sections: HymnSection[] = [];
  for (const [type, values, field] of [
    ["verse", stanzas, "stanzaNumber"],
    ["refrain", refrains, "refrainNumber"],
  ] as const) {
    blocks(values).forEach((block, index) => {
      if (typeof block.text !== "string" || !block.text.trim()) return;
      const number = sectionNumber(block[field], index + 1);
      sections.push({
        type,
        number,
        label: `${type === "verse" ? "Verse" : "Refrain"} ${number}`,
        lines: normalizeLyricText(block.text).split("\n"),
        ...(Array.isArray(block.underline) ? { underline: underlineTargets(block.underline) } : {}),
      });
    });
  }
  return orderedSections(sections);
}

export function sectionsToBlocks(sections: HymnSection[]) {
  const ordered = orderedSections(sections);
  return {
    stanzas: ordered.filter((s) => s.type === "verse")
      .map((s) => ({ stanzaNumber: s.number!, text: normalizeLyricText(s.lines.join("\n")), ...(s.underline ? { underline: underlineTargets(s.underline) } : {}) })),
    refrains: ordered.filter((s) => s.type === "refrain")
      .map((s) => ({ refrainNumber: s.number!, text: normalizeLyricText(s.lines.join("\n")), ...(s.underline ? { underline: underlineTargets(s.underline) } : {}) })),
  };
}

export function presentationSections(sections: HymnSection[]): HymnSection[] {
  const ordered = orderedSections(sections).filter((s) => s.lines.some((line) => line.trim()));
  const refrains = ordered.filter((s) => s.type === "refrain");
  const slides: HymnSection[] = [];
  for (let index = 0; index < ordered.length; index++) {
    const section = ordered[index];
    // Keep every numbered section, including an opening refrain. Avoid an
    // adjacent duplicate when the previous stanza already added this refrain.
    if (slides[slides.length - 1] !== section) slides.push(section);
    if (section.type !== "verse") continue;
    const refrain = refrains.find((r) => r.number === section.number) ?? refrains[0];
    if (refrain) slides.push(refrain);
  }
  return slides;
}

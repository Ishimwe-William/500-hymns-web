import type { HymnSection } from "./hymns";

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
        lines: block.text.split("\n").map((line) => line.trim()).filter(Boolean),
      });
    });
  }
  return orderedSections(sections);
}

export function sectionsToBlocks(sections: HymnSection[]) {
  const ordered = orderedSections(sections);
  return {
    stanzas: ordered.filter((s) => s.type === "verse")
      .map((s) => ({ stanzaNumber: s.number!, text: s.lines.join("\n") })),
    refrains: ordered.filter((s) => s.type === "refrain")
      .map((s) => ({ refrainNumber: s.number!, text: s.lines.join("\n") })),
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

export type SectionType = "verse" | "refrain";

export interface HymnSection {
  type: SectionType;
  number?: number;
  label: string;
  lines: string[];
}

export interface Hymn {
  id: string;
  number: number;
  title: string;
  category: string;
  origin?: string;
  key?: string;
  hasAudio: boolean;
  audioUrl?: string;
  youtubeUrl?: string;
  sections: HymnSection[];
  /** Plain-text lyrics used for full-text search. */
  lyricsText: string;
}

export interface HymnSummary {
  id: string;
  number: number;
  title: string;
  category: string;
  origin?: string;
  hasAudio: boolean;
  lyricsText: string;
}

export function lyricsTextFor(sections: HymnSection[]): string {
  return sections.flatMap((s) => s.lines).join("\n");
}

/* ---------------- Pure helpers (operate on a provided list) ---------------- */

export function toSummary(h: Hymn): HymnSummary {
  return {
    id: h.id,
    number: h.number,
    title: h.title,
    category: h.category,
    origin: h.origin,
    hasAudio: h.hasAudio,
    lyricsText: h.lyricsText,
  };
}

export function toSummaries(list: Hymn[]): HymnSummary[] {
  return list.map(toSummary);
}

export function getHymn(list: Hymn[], id: string): Hymn | undefined {
  return list.find((h) => h.id === id);
}

export function getHymnByNumber(list: Hymn[], num: number): Hymn | undefined {
  return list.find((h) => h.number === num);
}

export function getCategories(list: { category: string }[]): string[] {
  return [...new Set(list.map((h) => h.category))].sort();
}

function matchesQuery(h: HymnSummary, q: string): boolean {
  const num = Number(q);
  if (Number.isFinite(num) && q !== "" && String(h.number).includes(q)) {
    return true;
  }
  return (
    h.title.toLowerCase().includes(q) ||
    (h.origin ?? "").toLowerCase().includes(q) ||
    h.lyricsText.toLowerCase().includes(q)
  );
}

export function searchHymns(list: HymnSummary[], query: string): HymnSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return list.filter((h) => matchesQuery(h, q));
}

export function filterHymns(
  list: HymnSummary[],
  opts: {
    category?: string;
    query?: string;
    ids?: string[];
    sort?: string;
  }
): HymnSummary[] {
  let items = list;
  if (opts.category && opts.category !== "All categories") {
    items = items.filter((h) => h.category === opts.category);
  }
  if (opts.ids) {
    const set = new Set(opts.ids);
    items = items.filter((h) => set.has(h.id));
  }
  if (opts.query?.trim()) {
    const q = opts.query.trim().toLowerCase();
    items = items.filter((h) => matchesQuery(h, q));
  }
  const sorted = [...items];
  switch (opts.sort) {
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "category":
      sorted.sort(
        (a, b) => a.category.localeCompare(b.category) || a.number - b.number
      );
      break;
    default:
      sorted.sort((a, b) => a.number - b.number);
  }
  return sorted;
}

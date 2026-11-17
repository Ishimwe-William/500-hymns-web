export type SectionType = "verse" | "refrain";

export interface HymnSection {
  type: SectionType;
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
  hasAudio: boolean;
  lyricsText: string;
}

export function lyricsTextFor(sections: HymnSection[]): string {
  return sections.flatMap((s) => s.lines).join("\n");
}

/* ---------------- Mock hymnbook (fallback / demo data) ---------------- */

export const CATEGORIES = [
  "Praise",
  "Adoration",
  "Prayer",
  "Communion",
  "Christmas",
  "Easter",
  "Mission",
] as const;

const TITLES: Record<string, string[]> = {
  Praise: [
    "Turamur Praise",
    "Ejoza Wera",
    "Twigawe Ubutwari",
    "Inkangara za Mwami",
    "Emmeroo yacu",
    "Hallelujah byamo",
    "Turarurimba",
    "Umwami Witeguye",
    "Nta mpamo",
    "Turamuh praises",
  ],
  Adoration: [
    "Kubanza Kuruta",
    "Umwami Ni Wowe",
    "Ntibuze Gusarura",
    "Kera amajwi",
    "Iyermeyeza",
    "Umukara wacu",
    "Gufata Intyo",
    "Umutima Wanjye",
    "Umwenda wanjye",
    "Kubaza Kwacu",
  ],
  Prayer: [
    "Sabasaba Ukuri",
    "Ndagukunda Mwami",
    "Ntabwo Njya Kurwara",
    "Gukira Aba Wowe",
    "Kwigira Kwacu",
    "Umukiza Ukuri",
    "Ndahembwa Kwera",
    "Kwisonga Kwacu",
    "Umwizero Wacu",
    "Gushaka Kurubaka",
  ],
  Communion: [
    "Umukara Wacu",
    "Kwiha Kwacu",
    "Umukono Wega",
    "Hofatiye Umwami",
    "Impfura zacu",
    "Umwana wanjye",
    "Kuri Yezu",
    "Urugo rwa Mwami",
    "Kubabira Kwacu",
    "Uburere bwacu",
  ],
  Christmas: [
    "Noeli izaza",
    "Umwana w'Umunyega",
    "Noeli mwiza",
    "Kuzeza Kwacu",
    "Umutekano wo Noeli",
    "Kwanditse Kuri Noeli",
    "Noeli yiza",
    "Umukiza wose",
    "Ijoro rya Noeli",
    "Twambuke Noeli",
  ],
  Easter: [
    "Yezu Azabuwe",
    "Nohe Yeruzalemu",
    "Kuzoza Yezu",
    "Umukiza Wose",
    "Ijoro rya Pasika",
    "Kureba Yezu",
    "Umunsi Munini",
    "Kwireba Kwa Yezu",
    "Irindi Riruta",
    "Kubashyira Yezu",
  ],
  Mission: [
    "Gufata Inkoko",
    "Inkoko zacu",
    "Guhiga Kwacu",
    "Ubutwari bwacu",
    "Kwigira kwacu",
    "Amarembo yacu",
    "Urugo rwa Yo",
    "Guhanuza Kwacu",
    "Imbaraga zacu",
    "Kubaza Kwacu",
  ],
};

const CATEGORY_KEYS = Object.keys(TITLES);

const VERSE_LINES: string[][] = [
  [
    "Ee Mwami turagukunda, turakubaho kuzuza",
    "Umwami wacu uzubuke mu mpwanyi zacu",
    "Nta mpamo duhora duba muri wowe",
  ],
  [
    "Kera amajwi azaza, azatwikira njyana",
    "Mwami wacu wizeyeza, agira ubugingo",
    "Turahera turamucyiza, turamwizera rwose",
  ],
  [
    "Uri Uwera nyirabubasha, uri Umukiza wacu",
    "Twizera ko uzatwakiza, uzatubaho umunezero",
    "Nta kintu cyabuze, nta kibazo gisigaye",
  ],
  [
    "Umutima wanjye uragusenga, wishyirije mu maboko yawe",
    "Gufata intyo byanjye bigenda, nkure urwanko rwanjye",
    "Kubaho uvuye muri wowe, niyo nziza",
  ],
  [
    "Impfura zacu ziragushize, tukaba turi kumenya neza",
    "Twiyumvamo neza_rwose, turashakisha kuzabona",
    "Turashize turazinduke, turapfana imanza yacu",
  ],
];

const REFRAIN_LINES: string[][] = [
  ["Hallelujah, Hallelujah, Hallelujah Amen", "Mwami wacu uzubuke, Hallelujah Amen"],
  ["Ee Mwami turagukunda, turagukunda rwose", "Kera amajwi azaza, azatwikira njyana"],
  ["Ntabwo njya kurwara, nta kintu cyakubaye", "Mwami wacu uzubuke, Hallelujah Amen"],
];

const ORIGINS = [
  "Traditional Kinyarwanda hymn",
  "Adapted from Swahili",
  "Mission hymn, 1920s",
  "Written by a Rwandan elder",
  "Collected by BunsenPlus",
];

const KEYS = ["C", "G", "D", "F", "A", "Eb", "Bb"];

function buildHymn(category: string, title: string, index: number): Hymn {
  const number = index + 1;
  const seed = number;
  const verseCount = 2 + (seed % 3);
  const hasRefrain = seed % 3 !== 1;

  const sections: HymnSection[] = [];
  for (let v = 0; v < verseCount; v++) {
    sections.push({
      type: "verse",
      label: `Verse ${v + 1}`,
      lines: VERSE_LINES[(seed + v) % VERSE_LINES.length],
    });
    if (hasRefrain && v === 0) {
      sections.push({
        type: "refrain",
        label: "Refrain",
        lines: REFRAIN_LINES[seed % REFRAIN_LINES.length],
      });
    }
  }

  return {
    id: `h-${number}`,
    number,
    title: `${title} ${Math.floor(number / 10) + 1}`,
    category,
    origin: ORIGINS[seed % ORIGINS.length],
    key: KEYS[seed % KEYS.length],
    hasAudio: seed % 4 !== 0,
    youtubeUrl:
      seed % 5 === 0 ? `https://www.youtube.com/watch?v=demo${number}` : undefined,
    sections,
    lyricsText: lyricsTextFor(sections),
  };
}

export const TOTAL_HYMNS = 500;

/** The full 500-hymn mock book — used when Firebase is not configured. */
export const MOCK_HYMNS: Hymn[] = Array.from({ length: TOTAL_HYMNS }, (_, n) => {
  const category = CATEGORY_KEYS[n % CATEGORY_KEYS.length];
  const titles = TITLES[category];
  return buildHymn(category, titles[Math.floor(n / CATEGORY_KEYS.length) % titles.length], n);
});

/* ---------------- Pure helpers (operate on a provided list) ---------------- */

export function toSummary(h: Hymn): HymnSummary {
  return {
    id: h.id,
    number: h.number,
    title: h.title,
    category: h.category,
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
    h.category.toLowerCase().includes(q) ||
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

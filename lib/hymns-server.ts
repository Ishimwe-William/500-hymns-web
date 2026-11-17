import { cacheLife } from "next/cache";
import { collection, getDocs, type DocumentData } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  MOCK_HYMNS,
  lyricsTextFor,
  type Hymn,
  type HymnSection,
} from "@/lib/hymns";

const COLLECTION = "hymns";

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

interface TextBlock {
  text?: unknown;
  stanzaNumber?: unknown;
  refrainNumber?: unknown;
}

function asSections(d: DocumentData): HymnSection[] {
  const sections: HymnSection[] = [];

  const stanzas = Array.isArray(d.stanzas) ? (d.stanzas as TextBlock[]) : [];
  stanzas.forEach((s, i) => {
    if (typeof s?.text !== "string" || !s.text.trim()) return;
    const n = Number(s.stanzaNumber) || i + 1;
    sections.push({
      type: "verse",
      label: `Verse ${n}`,
      lines: s.text.split("\n").map((l) => l.trim()).filter(Boolean),
    });
  });

  const refrains = Array.isArray(d.refrains) ? (d.refrains as TextBlock[]) : [];
  refrains.forEach((r, i) => {
    if (typeof r?.text !== "string" || !r.text.trim()) return;
    const n = Number(r.refrainNumber) || i + 1;
    sections.push({
      type: "refrain",
      label: `Refrain ${n}`,
      lines: r.text.split("\n").map((l) => l.trim()).filter(Boolean),
    });
  });

  return sections;
}

function hymnFromDoc(id: string, d: DocumentData): Hymn | null {
  const number = Number(d.number);
  const title = asString(d.title);
  const category = asString(d.category) ?? "Other";
  if (!Number.isFinite(number) || !title) return null;

  const sections = asSections(d);
  const audioUrl = asString(d.audioUrl);
  const youtubeId = asString(d.youtube);
  const lyricsText = asString(d.lyricsText) ?? lyricsTextFor(sections);

  return {
    id,
    number,
    title,
    category,
    origin: asString(d.origin),
    key: asString(d.doh) ?? asString(d.key),
    hasAudio: Boolean(audioUrl),
    audioUrl,
    youtubeUrl: youtubeId
      ? `https://www.youtube.com/watch?v=${youtubeId}`
      : asString(d.youtubeUrl),
    sections,
    lyricsText,
  };
}

/**
 * Fetches the full hymnbook. Uses the Firestore `hymns` collection when
 * Firebase env vars are configured; otherwise falls back to the bundled
 * mock hymnbook so the app still runs in development.
 */
export async function getHymns(): Promise<Hymn[]> {
  "use cache";
  cacheLife("hours");

  if (!isFirebaseConfigured || !db) return MOCK_HYMNS;

  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const list = snap.docs
      .map((doc) => hymnFromDoc(doc.id, doc.data()))
      .filter((h): h is Hymn => h !== null)
      .sort((a, b) => a.number - b.number);
    return list.length > 0 ? list : MOCK_HYMNS;
  } catch (err) {
    console.error("Failed to fetch hymns from Firestore:", err);
    return MOCK_HYMNS;
  }
}

export async function getHymnById(id: string): Promise<Hymn | undefined> {
  "use cache";
  cacheLife("minutes");
  const hymns = await getHymns();
  return hymns.find((h) => h.id === id);
}

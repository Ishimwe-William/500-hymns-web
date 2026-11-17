import { HYMNS_CACHE_TAG } from "@/lib/cache-tags";
import { sectionsFromBlocks } from "@/lib/hymn-sections";
import { cacheLife, cacheTag } from "next/cache";
import { getFirestore, collection, getDocs, type DocumentData } from "firebase/firestore/lite";
import { firebaseApp, isFirebaseConfigured } from "@/lib/firebase-app";
import { unstable_rethrow } from "next/navigation";
import {
  lyricsTextFor,
  type Hymn,
} from "@/lib/hymns";

const COLLECTION = "hymns";
const publicDb = firebaseApp ? getFirestore(firebaseApp) : null;

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function hymnFromDoc(id: string, d: DocumentData): Hymn | null {
  const number = Number(d.number);
  const title = asString(d.title);
  const category = asString(d.category) ?? "Other";
  if (!Number.isFinite(number) || !title) return null;

  const sections = sectionsFromBlocks(d.stanzas, d.refrains);
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

/** Fetch only real hymns from Firestore; never substitute generated content. */
export async function getHymns(): Promise<Hymn[]> {
  "use cache";
  cacheTag(HYMNS_CACHE_TAG);
  if (!isFirebaseConfigured || !publicDb) {
    cacheLife("seconds");
    return [];
  }

  try {
    const snap = await getDocs(collection(publicDb, COLLECTION));
    const list = snap.docs
      .map((doc) => hymnFromDoc(doc.id, doc.data()))
      .filter((h): h is Hymn => h !== null)
      .sort((a, b) => a.number - b.number);
    if (list.length > 0) cacheLife("hours");
    else cacheLife("seconds");
    return list;
  } catch (err) {
    unstable_rethrow(err);
    console.error("Failed to fetch hymns from Firestore:", err);
    cacheLife("seconds");
    return [];
  }
}

export async function getHymnById(id: string): Promise<Hymn | undefined> {
  const hymns = await getHymns();
  return hymns.find((h) => h.id === id);
}

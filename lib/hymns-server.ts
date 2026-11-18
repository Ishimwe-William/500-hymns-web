import { HYMNS_CACHE_TAG } from "@/lib/cache-tags";
import { sectionsFromBlocks } from "@/lib/hymn-sections";
import { cacheLife, cacheTag } from "next/cache";
import { supabaseRequest } from "@/lib/supabase";
import { unstable_rethrow } from "next/navigation";
import {
  lyricsTextFor,
  type Hymn,
} from "@/lib/hymns";

const publicReadOptions = {
  cache: "force-cache" as const,
  next: { revalidate: 86400, tags: [HYMNS_CACHE_TAG] },
  // Changing this after a bulk import also changes persistent fetch cache keys.
  headers: { "X-Client-Info": `hymnbook-web/${process.env.HYMNS_CACHE_VERSION || "1"}` },
};

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function hymnFromDoc(id: string, d: Record<string, unknown>): Hymn | null {
  const number = Number(d.number);
  const title = asString(d.title);
  const category = asString(d.category) ?? "Other";
  if (!Number.isFinite(number) || !title) return null;

  const sections = sectionsFromBlocks(d.stanzas, d.refrains);
  const audioUrl = asString(d.audio_url);
  const youtubeId = asString(d.youtube);
  const lyricsText = asString(d.lyrics_text) ?? lyricsTextFor(sections);

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
      : asString(d.youtube_url),
    sections,
    lyricsText,
  };
}

/** Downloads check the source directly so reconnects see edits immediately. */
export async function getFreshHymns(): Promise<Hymn[]> {
  const hymns: Hymn[] = [];
  for (let offset = 0; ; offset += 500) {
    const rows = await supabaseRequest<Record<string, unknown>[]>(`hymns?select=*&order=number.asc,id.asc&limit=500&offset=${offset}`, { cache: "no-store" });
    for (const row of rows) {
      const hymn = typeof row.id === "string" ? hymnFromDoc(row.id, row) : null;
      if (!hymn) throw new Error("Invalid hymn download");
      hymns.push(hymn);
    }
    if (rows.length < 500) break;
  }
  if (!hymns.length) throw new Error("The hymnbook is unavailable");
  return hymns;
}

/** Public reads use persistent fetch caching, shared across server instances. */
export async function getHymns(): Promise<Hymn[]> {
  "use cache";
  cacheTag(HYMNS_CACHE_TAG);
  cacheLife("hours");

  try {
    const rows: Record<string, unknown>[] = [];
    // Explicit pagination avoids silently truncating a growing collection.
    for (let offset = 0; ; offset += 500) {
      const batch = await supabaseRequest<Record<string, unknown>[]>(`hymns?select=*&order=number.asc,id.asc&limit=500&offset=${offset}`, publicReadOptions);
      rows.push(...batch);
      if (batch.length < 500) break;
    }
    return rows.map((row) => typeof row.id === "string" ? hymnFromDoc(row.id, row) : null)
      .filter((h): h is Hymn => h !== null);
  } catch (err) {
    unstable_rethrow(err);
    // Failures must not replace a successful cached library with an empty list.
    throw new Error("The hymnbook is temporarily unavailable. Please try again.");
  }
}

/** Detail pages read only their document, not the entire hymn collection. */
export async function getHymnById(id: string): Promise<Hymn | undefined> {
  "use cache";
  cacheTag(HYMNS_CACHE_TAG);
  cacheLife("hours");
  if (!id || id.includes("/") || id.length > 1500) return undefined;
  try {
    const query = new URLSearchParams({ select: "*", id: `eq.${id}`, limit: "1" });
    const rows = await supabaseRequest<Record<string, unknown>[]>(`hymns?${query}`, publicReadOptions);
    return rows[0] ? hymnFromDoc(id, rows[0]) ?? undefined : undefined;
  } catch (error) {
    unstable_rethrow(error);
    throw new Error("The hymn could not be loaded. Please try again.");
  }
}

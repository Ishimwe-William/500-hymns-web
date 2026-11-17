"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/client-store";
import type { HymnSummary } from "@/lib/hymns";
import { IconChevronRight, IconHeart, IconMusic } from "@/components/icons";

export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query?: string;
}) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-accent-soft px-0.5 text-accent-ink dark:bg-accent-soft dark:text-accent-ink">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function lyricExcerpt(lyricsText: string, query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const lines = lyricsText.split("\n");
  const hit = lines.find((l) => l.toLowerCase().includes(q));
  if (!hit) return null;
  const i = hit.toLowerCase().indexOf(q);
  const start = Math.max(0, i - 30);
  const end = Math.min(hit.length, i + q.length + 50);
  return `${start > 0 ? "…" : ""}${hit.slice(start, end)}${end < hit.length ? "…" : ""}`;
}

export function HymnRow({
  hymn,
  highlight,
  showTime,
}: {
  hymn: HymnSummary;
  highlight?: string;
  showTime?: string;
}) {
  const { has, toggle } = useFavorites();
  const fav = has(hymn.id);
  const excerpt = highlight ? lyricExcerpt(hymn.lyricsText, highlight) : null;

  return (
    <div className="group flex h-20 items-center gap-4 border-b border-border px-5 transition-colors last:border-0 hover:bg-accent-soft/50">
      <Link
        href={`/hymns/${hymn.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm font-bold text-accent-ink dark:bg-accent-soft dark:text-accent-ink">
          {hymn.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-foreground">
            <HighlightedText text={hymn.title} query={highlight} />
          </span>
          <span className="mt-0.5 block text-[13px] text-muted">
            {hymn.category}
            {excerpt && (
              <span className="ml-2 inline text-muted/80">
                — <HighlightedText text={excerpt} query={highlight} />
              </span>
            )}
          </span>
        </span>
      </Link>
      <span className="flex shrink-0 items-center gap-1 text-muted">
        {showTime && <span className="mr-2 text-xs">{showTime}</span>}
        {hymn.hasAudio && <IconMusic width={18} height={18} />}
        <button
          type="button"
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.preventDefault();
            toggle(hymn.id);
          }}
          className={`rounded-full p-2 transition-colors hover:bg-accent-soft ${
            fav ? "text-accent" : "text-muted"
          }`}
        >
          <IconHeart filled={fav} width={18} height={18} />
        </button>
        <Link
          href={`/hymns/${hymn.id}`}
          aria-label="Open hymn"
          className="rounded-full p-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent"
        >
          <IconChevronRight width={18} height={18} />
        </Link>
      </span>
    </div>
  );
}

export function HymnList({
  hymns,
  highlight,
  times,
  empty,
}: {
  hymns: HymnSummary[];
  highlight?: string;
  times?: Record<string, string>;
  empty?: React.ReactNode;
}) {
  if (hymns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        {empty ?? (
          <>
            <IconHeart width={40} height={40} className="text-muted" />
            <p className="text-muted">Nothing here yet.</p>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {hymns.map((h) => (
        <HymnRow
          key={h.id}
          hymn={h}
          highlight={highlight}
          showTime={times?.[h.id]}
        />
      ))}
    </div>
  );
}

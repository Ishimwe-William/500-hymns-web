"use client";

import { HymnLink as Link } from "@/components/hymn-link";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { filterHymns, type HymnSummary } from "@/lib/hymns";
import { useFavorites, useRecent } from "@/lib/client-store";
import { OfflineDownload } from "@/components/offline-download";
import { HymnList } from "@/components/hymn-list";
import {
  IconGrid,
  IconHeart,
  IconList,
  IconMusic,
  IconSearch,
} from "@/components/icons";

const PAGE_SIZE = 24;

export function BrowseSidebar({ hymns, letter, onLetter }: { hymns: HymnSummary[]; letter?: string; onLetter?: (letter: string) => void }) {
  const { ids } = useFavorites();
  const { entries } = useRecent();
  const [number, setNumber] = useState("");
  const [indexLetter, setIndexLetter] = useState("");
  const selectedLetter = letter ?? indexLetter;
  const chooseLetter = onLetter ?? setIndexLetter;
  const chosen = hymns.find((hymn) => String(hymn.number) === number.trim());
  const recent = entries.map((entry) => hymns.find((hymn) => hymn.id === entry.id)).filter((hymn): hymn is HymnSummary => Boolean(hymn)).slice(0, 3);
  return <aside aria-label="Hymnbook tools" className="hidden min-w-0 self-stretch xl:block">
    <div tabIndex={0} aria-label="Scrollable hymnbook tools" className="hymn-sidebar-panel sticky top-24 max-h-[calc(100dvh-7rem)] space-y-5 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-5 focus-visible:outline-2 focus-visible:outline-accent-strong">
      <details className="border-b border-border pb-4">
        <summary className="cursor-pointer font-semibold text-foreground">Alphabetical index</summary>
        <p className="mt-3 text-xs text-muted">Browse titles by their first letter.</p>
        <div className="mt-3 grid grid-cols-5 gap-2" aria-label="Title initials">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((initial) => <button key={initial} type="button" aria-pressed={selectedLetter === initial} disabled={!hymns.some((hymn) => hymn.title.toLocaleUpperCase().startsWith(initial))} onClick={() => chooseLetter(initial)} className={`rounded-lg border border-border py-2 text-sm font-medium disabled:opacity-25 ${selectedLetter === initial ? "bg-accent-strong text-white dark:text-black" : "text-foreground hover:bg-accent-soft"}`}>{initial}</button>)}
        </div>
        <button type="button" onClick={() => chooseLetter("")} aria-pressed={!selectedLetter} className="mt-3 text-sm font-medium text-accent-strong hover:underline">All titles</button>
        {!onLetter && selectedLetter && <nav aria-label={`${selectedLetter} hymn titles`} className="mt-3 space-y-2">
          {hymns.filter((hymn) => hymn.title.toLocaleUpperCase().startsWith(selectedLetter)).sort((a, b) => a.title.localeCompare(b.title)).map((hymn) => <Link key={hymn.id} href={`/hymns/${hymn.id}`} className="block text-sm text-muted hover:text-accent-strong">{hymn.number}. {hymn.title}</Link>)}
        </nav>}
      </details>
      <section className="space-y-3">
        <h3 className="font-semibold text-foreground">Open a hymn</h3>
        <label htmlFor="hymn-number" className="block text-sm text-muted">Enter its number, 1–500</label>
        <input id="hymn-number" type="number" min={1} max={500} value={number} onChange={(event) => setNumber(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent-strong" placeholder="e.g. 56" />
        {chosen ? <Link href={`/hymns/${chosen.id}`} className="block rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent-ink">{chosen.number}. {chosen.title} →</Link> : <p className="text-xs text-muted">Choose a number to open the lyrics.</p>}
      </section>
      <nav aria-label="Your hymnbook" className="space-y-2 border-t border-border pt-4 text-sm">
        <Link href="/favorites" className="flex items-center justify-between rounded-lg py-2 text-foreground hover:text-accent-strong"><span>Favorites</span><span className="rounded-full bg-accent-soft px-2 text-accent-ink">{ids.length}</span></Link>
        <Link href="/recent" className="block rounded-lg py-2 text-foreground hover:text-accent-strong">Recently opened →</Link>
        {recent.map((hymn) => <Link key={hymn.id} href={`/hymns/${hymn.id}`} className="block truncate py-1 text-muted hover:text-accent-strong">{hymn.number}. {hymn.title}</Link>)}
      </nav>
      <section className="space-y-3 border-t border-border pt-4 text-sm text-muted">
        <h3 className="font-semibold text-foreground">Take your hymns offline</h3>
        <OfflineDownload />
      </section>
    </div>
  </aside>;
}

function subscribeConnection(update: () => void) {
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  return () => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
  };
}

const CARD_PHOTOS = [
  "photo-1470770841072-f978cf4d019e",
  "photo-1464822759023-fed622ff2c3b",
  "photo-1441974231531-c6227db76b6e",
];

function CardBackground({ number }: { number: number }) {
  const online = useSyncExternalStore(subscribeConnection, () => navigator.onLine, () => false);
  const [failed, setFailed] = useState(false);
  if (!online || failed) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
    {/* Decorative remote photos are never part of the offline lyrics download. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`https://images.unsplash.com/${CARD_PHOTOS[number % CARD_PHOTOS.length]}?auto=format&fit=crop&w=640&q=65`}
      alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)}
      className="h-full w-full object-cover opacity-25 dark:opacity-30" />
    <div className="absolute inset-0 bg-linear-to-r from-card via-card/85 to-card/30" />
  </div>;
}

function HymnCard({ hymn }: { hymn: HymnSummary }) {
  const { has, toggle } = useFavorites();
  const fav = has(hymn.id);
  return (
    <div className="relative isolate flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <CardBackground number={hymn.number} />
      <div className="relative flex items-start justify-between gap-3">
        <Link href={`/hymns/${hymn.id}`} className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Hymn {hymn.number}
          </span>
          <h3 className="mt-1 truncate text-[15px] font-semibold text-foreground">
            {hymn.title}
          </h3>
          {hymn.origin && (
            <p className="mt-0.5 text-[13px] text-muted">{hymn.origin}</p>
          )}
        </Link>
        <button
          type="button"
          aria-label="Toggle favorite"
          onClick={() => toggle(hymn.id)}
          className={`rounded-full p-1.5 ${fav ? "text-accent" : "text-muted"}`}
        >
          <IconHeart filled={fav} width={18} height={18} />
        </button>
      </div>
      <div className="relative mt-auto flex items-center justify-between pt-4">
        {hymn.hasAudio ? (
          <IconMusic width={18} height={18} className="text-muted" />
        ) : (
          <span />
        )}
        <Link
          href={`/hymns/${hymn.id}`}
          className="text-sm font-medium text-accent-strong hover:underline dark:text-accent"
        >
          Read →
        </Link>
      </div>
    </div>
  );
}

export function HymnBrowser({
  hymns,
  initialQuery = "",
  intro,
}: {
  hymns: HymnSummary[];
  initialQuery?: string;
  intro?: ReactNode;
}) {
  const [sort, setSort] = useState("number");
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [letter, setLetter] = useState("");

  const filtered = useMemo(
    () => filterHymns(hymns, { sort, query }).filter((hymn) => !letter || hymn.title.toLocaleUpperCase().startsWith(letter)),
    [hymns, sort, query, letter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const reset = () => setPage(1);

  if (hymns.length === 0) return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <p className="font-medium text-foreground">No hymns are available right now</p>
      <p className="mt-2 text-sm text-muted">Please try again shortly.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full bg-accent-strong px-5 py-2 text-sm font-medium text-white dark:text-black">Try again</button>
    </div>
  );


  return (
    <div className="grid items-start gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <BrowseSidebar hymns={hymns} letter={letter} onLetter={(initial) => { setLetter(initial); setSort("title"); reset(); }} />
      <div className="min-w-0 space-y-5">
      {intro}
      {/* Browse controls */}
      <div className="flex flex-wrap items-center gap-3">
        {letter && <button type="button" onClick={() => { setLetter(""); reset(); }} className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-ink">Titles: {letter} · Clear ×</button>}
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            reset();
          }}
          aria-label="Sort"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="number">Hymn number</option>
          <option value="title">Title A–Z</option>
        </select>
        <div className="ml-auto flex rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="List view"
            className={`rounded-lg p-2 ${view === "list" ? "bg-accent-soft text-accent-ink dark:text-accent-ink" : "text-muted"}`}
          >
            <IconList width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={`rounded-lg p-2 ${view === "grid" ? "bg-accent-soft text-accent-ink dark:text-accent-ink" : "text-muted"}`}
          >
            <IconGrid width={18} height={18} />
          </button>
        </div>
      </div>

      {/* Results */}
      {view === "list" ? (
        <HymnList
          hymns={pageItems}
          highlight={query}
          empty={
            <div className="text-center">
              <IconSearch width={40} height={40} className="mx-auto text-muted" />
              <p className="mt-3 font-medium text-foreground">No hymns found</p>
              <p className="text-sm text-muted">
                Try another title, number, or phrase
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setLetter("");
                  reset();
                }}
                className="mt-3 rounded-full bg-accent-strong px-4 py-2 text-sm font-medium text-white dark:text-black"
              >
                Clear search
              </button>
            </div>
          }
        />
      ) : (
        <div className="hymn-card-grid grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {pageItems.map((h) => (
            <HymnCard key={h.id} hymn={h} />
          ))}
          {pageItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted">
              No hymns found. Try another title, number, or phrase.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            Showing {from}–{to} of {filtered.length} hymns
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-lg px-3 py-1.5 ${
                      p === safePage
                        ? "bg-accent-strong font-semibold text-white dark:text-black"
                        : "border border-border bg-card hover:bg-accent-soft"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

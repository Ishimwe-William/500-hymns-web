"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchHymns, type HymnSummary } from "@/lib/hymns";
import { IconSearch } from "@/components/icons";

const MAX_RESULTS = 8;

export function SearchModal({
  hymns,
  query,
  onQueryChange,
  onClose,
}: {
  hymns: HymnSummary[];
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const matches = useMemo(() => query.trim() ? searchHymns(hymns, query) : [], [hymns, query]);
  const expanded = expandedQuery === query.trim();
  const results = expanded ? matches : matches.slice(0, MAX_RESULTS);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Selection is tracked by hymn id so it survives query changes.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    results.find((r) => r.id === selectedId) ?? results[0] ?? null;

  useEffect(() => {
    if (selected) router.prefetch(`/hymns/${encodeURIComponent(selected.id)}`);
  }, [router, selected]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const openHymn = (id: string) => {
    onClose();
    router.push(`/hymns/${id}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (results.length === 0) return;
        const idx = results.findIndex((r) => r.id === selected?.id);
        const next =
          e.key === "ArrowDown"
            ? results[(idx + 1) % results.length]
            : results[(idx - 1 + results.length) % results.length];
        setSelectedId(next.id);
        return;
      }
      if (e.key === "Enter") {
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        if (selected) openHymn(selected.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, selected, query, onClose, router]);

  useEffect(() => {
    resultsRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selected?.id]);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Search hymns">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <IconSearch width={20} height={20} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by hymn number, title, origin, or lyrics…"
            className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted sm:block">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No hymns found for “{query}”
            </p>
          )}
          {!query.trim() && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Type to search 500 Kinyarwanda hymns
            </p>
          )}
          {results.map((h) => {
            const isSelected = selected?.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => openHymn(h.id)}
                onMouseEnter={() => setSelectedId(h.id)}
                data-selected={isSelected}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "bg-accent-soft" : "hover:bg-accent-soft/60"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent-ink dark:text-accent-ink">
                  {h.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {h.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {h.origin}
                    {h.hasAudio ? " · Audio" : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Expanding results keeps search on the current page. */}
        {matches.length > results.length ? (
          <button type="button" onClick={() => setExpandedQuery(query.trim())} className="flex w-full items-center justify-between border-t border-border px-5 py-3 text-xs text-muted hover:bg-accent-soft/50">
            <span>View all {matches.length} results</span>
            <span>{results.length} shown</span>
          </button>
        ) : query.trim() ? (
          <p className="border-t border-border px-5 py-3 text-xs text-muted">{matches.length} hymn{matches.length === 1 ? "" : "s"} found</p>
        ) : null}

      </div>
    </div>
  );
}

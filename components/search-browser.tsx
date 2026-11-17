"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { searchHymns, type HymnSummary } from "@/lib/hymns";
import { HymnList } from "@/components/hymn-list";
import { IconSearch } from "@/components/icons";

export function SearchBrowser({
  hymns,
  initialQuery = "",
}: {
  hymns: HymnSummary[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  // Live filtering — results update as the user types, no Enter needed.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery(input), 200);
    return () => window.clearTimeout(t);
  }, [input]);

  const results = useMemo(
    () => (query.trim() ? searchHymns(hymns, query) : []),
    [hymns, query]
  );
  const searched = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-foreground">Search hymns</h2>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = input.trim();
          router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
        }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4"
      >
        <IconSearch width={20} height={20} className="shrink-0 text-muted" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by hymn number, title, or lyrics…"
          className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted"
        />
      </form>

      {!searched && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-ink dark:text-accent-ink">
            <IconSearch width={26} height={26} />
          </span>
          <p className="text-lg font-semibold text-foreground">
            Find your next hymn
          </p>
          <p className="max-w-sm text-sm text-muted">
            Search by hymn number, title, category, or a phrase from the
            lyrics — in Kinyarwanda or English.
          </p>
        </div>
      )}

      {searched && (
        <>
          <p className="text-sm text-muted">
            {results.length} hymn{results.length === 1 ? "" : "s"} found for{" "}
            <span className="font-medium text-foreground">“{query}”</span>
          </p>
          <HymnList
            hymns={results.slice(0, 50)}
            highlight={query}
            empty={
              <div className="py-10 text-center">
                <p className="font-medium text-foreground">No hymns found</p>
                <p className="mt-1 text-sm text-muted">
                  Try another title, number, or phrase
                </p>
                <Link
                  href="/search"
                  className="mt-4 inline-block rounded-full bg-accent-strong px-4 py-2 text-sm font-medium text-white dark:text-black"
                >
                  Clear search
                </Link>
              </div>
            }
          />
        </>
      )}
    </div>
  );
}

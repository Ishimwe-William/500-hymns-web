"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterHymns, type HymnSummary } from "@/lib/hymns";
import { useFavorites } from "@/lib/client-store";
import { HymnList } from "@/components/hymn-list";
import { IconHeart, IconSearch } from "@/components/icons";

export default function FavoritesPage({ hymns }: { hymns: HymnSummary[] }) {
  const { ids } = useFavorites();
  const [query, setQuery] = useState("");

  const favSet = useMemo(() => new Set(ids), [ids]);
  const favHymns = useMemo(
    () => hymns.filter((h) => favSet.has(h.id)),
    [hymns, favSet]
  );

  const filtered = useMemo(
    () => filterHymns(favHymns, { query }),
    [favHymns, query]
  );

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground">Your favorites</h2>
        <p className="text-muted">The hymns you keep close.</p>
      </header>

      <p className="text-sm text-muted">Favorites are saved on this device. No sign-in is required.</p>

      {favHymns.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {favHymns.length} saved hymn{favHymns.length === 1 ? "" : "s"}
          </p>
          <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
            <IconSearch width={16} height={16} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search within favorites…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
          </div>
        </div>
      )}

      {favHymns.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent-ink dark:text-accent-ink">
            <IconHeart width={30} height={30} />
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">
              Your favorites start here
            </p>
            <p className="mt-1 text-sm text-muted">
              Tap the heart on any hymn to keep it close.
            </p>
          </div>
          <Link
            href="/hymns"
            className="rounded-full bg-accent-strong px-5 py-2.5 text-sm font-medium text-white dark:text-black"
          >
            Browse hymns
          </Link>
        </div>
      ) : (
        <HymnList
          hymns={filtered}
          highlight={query}
          empty={
            <div className="py-10 text-center text-muted">
              No favorites match “{query}”.
            </div>
          }
        />
      )}
    </div>
  );
}

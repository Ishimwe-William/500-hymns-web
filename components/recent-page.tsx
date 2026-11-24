"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { HymnSummary } from "@/lib/hymns";
import { useRecent } from "@/lib/client-store";
import { HymnRow } from "@/components/hymn-list";
import { IconClock } from "@/components/icons";

function groupLabel(openedAt: number): string {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (openedAt >= startOfToday.getTime()) return "Today";
  if (openedAt >= startOfYesterday.getTime()) return "Yesterday";
  return "Earlier";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RecentPage({ hymns }: { hymns: HymnSummary[] }) {
  const { entries } = useRecent();

  const groups = useMemo(() => {
    const byId = new Map(hymns.map((h) => [h.id, h]));
    const result: { label: string; items: { hymn: HymnSummary; time: string }[] }[] = [];
    const order = ["Today", "Yesterday", "Earlier"];
    for (const label of order) {
      const items = entries
        .filter((e) => groupLabel(e.openedAt) === label)
        .map((e) => {
          const hymn = byId.get(e.id);
          return hymn ? { hymn, time: formatTime(e.openedAt) } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (items.length) result.push({ label, items });
    }
    return result;
  }, [entries, hymns]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="w-full space-y-6">
      <header className="hymn-library-hero flex flex-col justify-center space-y-2 rounded-2xl border border-border">
        <h2 className="text-3xl font-bold text-foreground">Recently opened</h2>
        <p className="text-muted">Pick up where you left off.</p>
      </header>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent-ink dark:text-accent-ink">
            <IconClock width={30} height={30} />
          </span>
          <p className="text-muted">
            Your recently opened hymns will appear here.
          </p>
          <Link
            href="/hymns"
            className="rounded-full bg-accent-strong px-5 py-2.5 text-sm font-medium text-white dark:text-black"
          >
            Browse hymns
          </Link>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.label} className="space-y-2">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {g.label}
            </h3>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {g.items.map(({ hymn, time }) => (
                <HymnRow
                  key={hymn.id}
                  hymn={hymn}
                  showTime={time}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

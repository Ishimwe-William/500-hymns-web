"use client";

import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { useMemo, useState } from "react";
import type { HymnSummary } from "@/lib/hymns";
import { IconEdit, IconMusic, IconSearch } from "@/components/icons";

const PAGE_SIZE = 15;

export default function AdminDashboard({
  hymns,
  audioCount,
}: {
  hymns: HymnSummary[];
  audioCount: number;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hymns.filter((h) => {
      if (!q) return true;
      return String(h.number).includes(q) || h.title.toLowerCase().includes(q) || (h.origin ?? "").toLowerCase().includes(q);
    });
  }, [hymns, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <SectionPage title="Hymn management" description="Find and edit hymns in the collection." sections={[
      { id: "overview", title: "Overview", content: <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: "Total hymns", value: hymns.length },
          { label: "With audio", value: audioCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      </> },
      { id: "hymns", title: "Hymn collection", content: <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
          <IconSearch width={16} height={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search number or title…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Number</th>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Origin</th>
              <th className="px-5 py-3 font-semibold">Audio</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr
                key={h.id}
                className="border-b border-border/60 last:border-0 hover:bg-accent-soft/40"
              >
                <td className="px-5 py-3 font-medium text-foreground">
                  {h.number}
                </td>
                <td className="max-w-56 truncate px-5 py-3 text-foreground">
                  {h.title}
                </td>
                <td className="px-5 py-3 text-muted">{h.origin}</td>
                <td className="px-5 py-3">
                  {h.hasAudio ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink dark:text-accent-ink">
                      <IconMusic width={14} height={14} /> Available
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/hymns/${h.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent-soft"
                  >
                    <IconEdit width={13} height={13} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  No hymns match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          {filtered.length === 0
            ? "No results"
            : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                safePage * PAGE_SIZE,
                filtered.length
              )} of ${filtered.length} hymns`}
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
      </div> },
    ]} />
  );
}

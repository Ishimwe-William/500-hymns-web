"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HymnSummary } from "@/lib/hymns";
import { getCategories } from "@/lib/hymns";
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
  const [category, setCategory] = useState("All categories");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => ["All categories", ...getCategories(hymns)],
    [hymns]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hymns.filter((h) => {
      if (category !== "All categories" && h.category !== category) return false;
      if (!q) return true;
      return (
        String(h.number).includes(q) ||
        h.title.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
      );
    });
  }, [hymns, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground">Hymn management</h2>
        <p className="text-muted">
          Find and edit hymns in the collection.
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total hymns", value: hymns.length },
          { label: "With audio", value: audioCount },
          { label: "Categories", value: categories.length - 1 },
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
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Number</th>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Audio</th>
              <th className="px-5 py-3 font-semibold">Last updated</th>
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
                <td className="px-5 py-3 text-muted">{h.category}</td>
                <td className="px-5 py-3">
                  {h.hasAudio ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink dark:text-accent-ink">
                      <IconMusic width={14} height={14} /> Available
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-muted">2026-11-01</td>
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
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  No hymns match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted">
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
    </div>
  );
}

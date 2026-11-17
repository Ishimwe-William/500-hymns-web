import { Suspense } from "react";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries, type HymnSummary } from "@/lib/hymns";
import { SearchBrowser } from "@/components/search-browser";

async function SearchContent({
  searchParams,
  hymns,
}: {
  searchParams: Promise<{ q?: string }>;
  hymns: HymnSummary[];
}) {
  const { q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";
  // key forces a remount when the navbar search changes the query.
  return <SearchBrowser key={initialQuery} hymns={hymns} initialQuery={initialQuery} />;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const hymns = toSummaries(await getHymns());
  return (
    <Suspense>
      <SearchContent searchParams={searchParams} hymns={hymns} />
    </Suspense>
  );
}

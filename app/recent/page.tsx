import type { Metadata } from "next";
import RecentPage from "@/components/recent-page";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import { HymnPageLayout } from "@/components/hymn-page-layout";

export const metadata: Metadata = { title: "Recent hymns", robots: { index: false, follow: false } };

export default async function Page() {
  const hymns = toSummaries(await getHymns());
  return <HymnPageLayout hymns={hymns}><RecentPage hymns={hymns} /></HymnPageLayout>;
}

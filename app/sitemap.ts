import type { MetadataRoute } from "next";
import { getHymns } from "@/lib/hymns-server";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hymns = await getHymns();
  return [
    ...["/hymns", "/about", "/privacy", "/download"].map((path) => ({ url: absoluteUrl(path), changeFrequency: "monthly" as const, priority: path === "/hymns" ? 1 : 0.5 })),
    ...hymns.map((hymn) => ({ url: absoluteUrl(`/hymns/${encodeURIComponent(hymn.id)}`), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}

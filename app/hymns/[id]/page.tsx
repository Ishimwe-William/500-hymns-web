import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHymnById, getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import { HymnPageLayout } from "@/components/hymn-page-layout";
import { HymnReader } from "@/components/hymn-reader";
import { absoluteUrl, hymnDescription, jsonLd, publicMetadata } from "@/lib/site";

// Resolve the URL and cached lyrics on the server before sending the page.
// A streaming fallback would hide the hymn from readers without JavaScript.
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const hymn = await getHymnById(id);
  if (!hymn) return { title: "Hymn not found", robots: { index: false, follow: true } };
  return publicMetadata(`Hymn ${hymn.number} - ${hymn.title}`, hymnDescription(hymn), `/hymns/${encodeURIComponent(id)}`, `/hymns/${encodeURIComponent(id)}/opengraph-image`);
}

async function HymnContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hymn = await getHymnById(id);
  if (!hymn) notFound();
  const url = absoluteUrl(`/hymns/${encodeURIComponent(id)}`);
  const data = { "@context": "https://schema.org", "@graph": [
    { "@type": "MusicComposition", "@id": `${url}#hymn`, name: hymn.title, alternateName: hymn.origin, identifier: String(hymn.number), url, inLanguage: "rw", isPartOf: { "@id": `${absoluteUrl("/")}#website` }, lyrics: { "@type": "CreativeWork", text: hymn.lyricsText, inLanguage: "rw" }, ...(hymn.audioUrl ? { audio: { "@type": "AudioObject", contentUrl: hymn.audioUrl } } : {}) },
    { "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Hymns", item: absoluteUrl("/hymns") }, { "@type": "ListItem", position: 2, name: `Hymn ${hymn.number} - ${hymn.title}`, item: url } ] },
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /><HymnPageLayout hymns={toSummaries(await getHymns())}><HymnReader hymn={hymn} /></HymnPageLayout></>;
}
export default async function HymnPage({ params }: { params: Promise<{ id: string }> }) {
  return await HymnContent({ params });
}

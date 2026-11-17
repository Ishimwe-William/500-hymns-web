import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getHymnById } from "@/lib/hymns-server";
import { HymnReader } from "@/components/hymn-reader";
import { absoluteUrl, hymnDescription, jsonLd, publicMetadata } from "@/lib/site";

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
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /><HymnReader hymn={hymn} /></>;
}
export default function HymnPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div role="status" className="rounded-2xl border border-border bg-card p-8 text-center text-muted">Opening hymn...</div>}><HymnContent params={params} /></Suspense>;
}

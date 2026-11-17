import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getHymnById, getHymns } from "@/lib/hymns-server";
import { HymnReader } from "@/components/hymn-reader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hymn = await getHymnById(id);
  return { title: hymn ? `Hymn ${hymn.number} — ${hymn.title}` : "Hymn" };
}

async function HymnContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [hymn, all] = await Promise.all([getHymnById(id), getHymns()]);
  if (!hymn) notFound();

  const index = all.findIndex((h) => h.id === id);
  const toNav = (h: (typeof all)[number] | undefined) =>
    h ? { id: h.id, number: h.number, title: h.title } : null;
  const prev = index > 0 ? toNav(all[index - 1]) : null;
  const next =
    index >= 0 && index < all.length - 1 ? toNav(all[index + 1]) : null;

  return <HymnReader hymn={hymn} prev={prev} next={next} />;
}

export default function HymnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Loading hymn…</div>}>
      <HymnContent params={params} />
    </Suspense>
  );
}

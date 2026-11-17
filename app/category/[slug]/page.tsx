import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getHymns } from "@/lib/hymns-server";
import { getCategories, toSummaries } from "@/lib/hymns";
import { HymnBrowser } from "@/components/hymn-browser";

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function unslugify(slug: string) {
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = unslugify(slug);
  return { title: `${name} hymns` };
}

async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getHymns();
  const categories = getCategories(all);
  const name = categories.find((c) => slugify(c) === slug);
  if (!name) notFound();

  const summaries = toSummaries(all);
  const count = summaries.filter((h) => h.category === name).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link href="/hymns" className="hover:text-foreground">
          Hymns
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{name}</span>
      </nav>

      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground">{name}</h2>
        <p className="text-muted">
          {count} hymn{count === 1 ? "" : "s"} in this category
        </p>
      </header>

      <HymnBrowser hymns={summaries} initialCategory={name} />
    </div>
  );
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Loading category…</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getHymnById } from "@/lib/hymns-server";
import { HymnEditor } from "@/components/hymn-editor";

export const metadata: Metadata = { title: "Edit hymn" };

async function EditHymnContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hymn = await getHymnById(id);
  if (!hymn) notFound();
  return <HymnEditor hymn={hymn} />;
}

export default function EditHymnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Loading hymn…</div>}>
      <EditHymnContent params={params} />
    </Suspense>
  );
}

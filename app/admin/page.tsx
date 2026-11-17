import type { Metadata } from "next";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import AdminDashboard from "@/components/admin-dashboard";

export const metadata: Metadata = { title: "Admin — Hymn management" };

export default async function AdminPage() {
  const all = await getHymns();
  const summaries = toSummaries(all);
  const audioCount = all.filter((h) => h.hasAudio).length;
  return <AdminDashboard hymns={summaries} audioCount={audioCount} />;
}

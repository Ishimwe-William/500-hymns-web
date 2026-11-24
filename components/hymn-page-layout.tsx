import type { ReactNode } from "react";
import type { HymnSummary } from "@/lib/hymns";
import { BrowseSidebar } from "@/components/hymn-browser";

export function HymnPageLayout({ hymns, children }: { hymns: HymnSummary[]; children: ReactNode }) {
  return <div className="hymn-with-sidebar grid items-start gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
    <BrowseSidebar hymns={hymns} />
    <div className="min-w-0">{children}</div>
  </div>;
}

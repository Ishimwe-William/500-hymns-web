import { APP_NAME, SITE_DESCRIPTION, publicMetadata } from "@/lib/site";
import { Suspense } from "react";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import { HymnBrowser } from "@/components/hymn-browser";

export const metadata = publicMetadata(APP_NAME, SITE_DESCRIPTION, "/hymns");

async function HymnResults() {
  const hymns = toSummaries(await getHymns());
  return <HymnBrowser hymns={hymns} />;
}

export default function HymnsPage() {
  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Your hymnbook
        </p>
        <h2 className="text-3xl font-bold text-foreground">
          Find a hymn. Lift your voice.
        </h2>
        <p className="max-w-xl text-muted">
          Browse Kinyarwanda hymns by number, title, origin,
          or lyrics.
        </p>
      </header>
      <Suspense fallback={<p role="status" className="rounded-2xl border border-border bg-card p-8 text-center text-muted">Loading hymns...</p>}>
        <HymnResults />
      </Suspense>
    </div>
  );
}

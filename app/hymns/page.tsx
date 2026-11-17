import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import { HymnBrowser } from "@/components/hymn-browser";

export default async function HymnsPage() {
  const hymns = toSummaries(await getHymns());
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Your hymnbook
        </p>
        <h2 className="text-3xl font-bold text-foreground">
          Find a hymn. Lift your voice.
        </h2>
        <p className="max-w-xl text-muted">
          Browse {hymns.length} Kinyarwanda hymns by number, title, category,
          or lyrics.
        </p>
      </header>
      <HymnBrowser hymns={hymns} />
    </div>
  );
}

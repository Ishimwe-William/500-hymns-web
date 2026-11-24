import { APP_NAME, SITE_DESCRIPTION, publicMetadata } from "@/lib/site";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import { HymnBrowser } from "@/components/hymn-browser";

export const metadata = publicMetadata(APP_NAME, SITE_DESCRIPTION, "/hymns");

export default async function HymnsPage() {
  const hymns = toSummaries(await getHymns());
  return (
    <div className="hymn-library-page w-full space-y-8">
      <HymnBrowser hymns={hymns} intro={<header className="hymn-library-hero flex flex-col justify-center space-y-2 rounded-2xl border border-border">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Your hymnbook
        </p>
        <h2 className="text-3xl font-bold text-foreground">
          Find a hymn. Lift your voice.
        </h2>
        <p className="max-w-xl text-muted">
          Browse 500 Kinyarwanda hymns used by the Seventh-day Adventist Church in Rwanda.
          Search by number, title, origin, or lyrics.
        </p>
      </header>} />
    </div>
  );
}

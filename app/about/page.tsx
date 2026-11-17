import Link from "next/link";
import { IconDownload, IconLogo } from "@/components/icons";

const MOBILE_APP_URL = process.env.NEXT_PUBLIC_MOBILE_APP_URL ?? "#";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-col items-center gap-4 pt-6 text-center">
        <IconLogo width={64} height={64} />
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            500 Kinyarwanda Hymns
          </h2>
          <p className="mt-2 max-w-md text-muted">
            A digital hymnbook carrying five hundred Kinyarwanda hymns — for
            worship at home, in church, and everywhere in between.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          About the hymnbook
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground">
          This collection gathers beloved Kinyarwanda hymns into one calm,
          readable digital hymnbook. Sing along with lyric text sized for
          worship, chords when you want them, and audio when a recording is
          available.
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent-soft/50 p-6 dark:bg-accent-soft/20">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Take it with you
          </h3>
          <p className="mt-1 text-sm text-muted">
            Download the mobile app for offline singing anywhere.
          </p>
        </div>
        <a
          href={MOBILE_APP_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] dark:text-black"
        >
          <IconDownload width={17} height={17} />
          Download mobile app
        </a>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Main features
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-foreground">
          <li>Browse all 500 hymns by number or category</li>
          <li>Search titles, numbers, and lyrics</li>
          <li>Reading settings: text size, chords, verse numbers, dark mode</li>
          <li>Favorites and recently opened hymns</li>
          <li>Audio playback where recordings exist</li>
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Developer
          </h3>
          <p className="mt-3 text-[15px] text-foreground">BunsenPlus</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Contact
          </h3>
          <p className="mt-3 text-[15px] text-foreground">
            <a
              href="mailto:hello@bunsenplus.dev"
              className="text-accent-strong hover:underline dark:text-accent"
            >
              hello@bunsenplus.dev
            </a>
          </p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Privacy policy
          </h3>
          <p className="mt-3 text-[15px] text-foreground">
            Your favorites and preferences stay on your device unless you sign
            in to sync them.{" "}
            <Link
              href="/profile"
              className="text-accent-strong hover:underline dark:text-accent"
            >
              Learn more
            </Link>
          </p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Version
          </h3>
          <p className="mt-3 text-[15px] text-foreground">Web 0.1.0</p>
        </section>
      </div>
    </div>
  );
}

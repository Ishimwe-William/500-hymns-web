"use client";

import { openAudienceWindow, type AudienceWindow } from "@/lib/presentation-display";
import { useHymnNeighbors } from "@/lib/hymn-library";
import { orderedSections, sectionHeading } from "@/lib/hymn-sections";

import Link from "next/link";
import { HymnLink } from "@/components/hymn-link";
import { useAuth } from "@/lib/auth-store";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PresentationView } from "@/components/presentation-view";
import type { Hymn } from "@/lib/hymns";
import {
  useFavorites,
  usePlayer,
  useReadingSettings,
  useRecent,
  useTheme,
} from "@/lib/client-store";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternal,
  IconHeart,
  IconMusic,
  IconPause,
  IconPlay,
  IconPresent,
  IconShare,
} from "@/components/icons";

/* Record the hymn as recently opened. */
export function RecentRecorder({ hymnId }: { hymnId: string }) {
  const { recordOpen } = useRecent();
  useEffect(() => {
    recordOpen(hymnId);
  }, [hymnId, recordOpen]);
  return null;
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Link copied" : "Share"}
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
        } catch {
          /* user cancelled */
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="reader-icon-control flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft"
    >
      <IconShare width={16} height={16} />
      <span className="hidden sm:inline">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}

function AudioButton({ hymn }: { hymn: Hymn }) {
  const player = usePlayer();
  const active = player.hymn?.id === hymn.id;
  const playing = active && player.status === "playing";
  const loading = active && player.status === "loading";

  if (!hymn.hasAudio) {
    return (
      <span role="img" aria-label="Audio unavailable" title="Audio unavailable" className="reader-icon-control relative flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted">
        <span aria-hidden="true" className="relative sm:hidden"><IconMusic width={18} height={18} /><span className="absolute left-0 top-2 h-px w-5 -rotate-45 bg-current" /></span>
        <span className="hidden sm:inline">Audio unavailable</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={loading ? "Loading audio" : playing ? "Pause" : "Play audio"}
      aria-busy={loading}
      onClick={() =>
        playing || loading ? player.pause() : player.play(hymn)
      }
      className="reader-icon-control flex items-center gap-2 rounded-full bg-accent-strong px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] dark:text-black"
    >
      {loading ? <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} className="animate-spin"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity=".25" /><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="3" /></svg> : playing ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
      <span className="hidden sm:inline">{loading ? "Loading…" : playing ? "Pause" : "Play audio"}</span>
    </button>
  );
}

function ReadingSettings() {
  const { settings, update } = useReadingSettings();
  const { theme, set } = useTheme();
  const sizes = [18, 22, 26];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Reading settings
      </h3>
      <div className="mt-4 space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Text size</p>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <button
              type="button"
              aria-label="Decrease text size"
              onClick={() => {
                const i = sizes.indexOf(settings.fontSize);
                if (i > 0) update({ fontSize: sizes[i - 1] });
              }}
              className="rounded-lg px-3 py-1 text-lg font-bold text-muted hover:bg-accent-soft"
            >
              A−
            </button>
            <span className="text-sm font-medium text-foreground">
              {settings.fontSize}px
            </span>
            <button
              type="button"
              aria-label="Increase text size"
              onClick={() => {
                const i = sizes.indexOf(settings.fontSize);
                if (i < sizes.length - 1) update({ fontSize: sizes[i + 1] });
              }}
              className="rounded-lg px-3 py-1 text-lg font-bold text-muted hover:bg-accent-soft"
            >
              A+
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between">
          <span>
            <span className="block text-sm font-medium text-foreground">
              Show verse numbers
            </span>
            <span className="block text-xs text-muted">
              Label each verse and refrain
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.showVerseNumbers}
            onChange={(e) => update({ showVerseNumbers: e.target.checked })}
            className="h-5 w-5 accent-accent-strong"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Appearance</p>
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set(t)}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? "border-accent bg-accent-soft text-accent-ink dark:text-accent-ink"
                    : "border-border text-muted hover:border-accent/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HymnInfoCard({ hymn }: { hymn: Hymn }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
        About this hymn
      </h3>
      <dl className="mt-3 space-y-2 text-sm">
        {hymn.origin && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Origin</dt>
            <dd className="text-right font-medium text-foreground">
              {hymn.origin}
            </dd>
          </div>
        )}
        {hymn.key && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Key</dt>
            <dd className="font-medium text-foreground">{hymn.key}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Audio</dt>
          <dd className="font-medium text-foreground">
            {hymn.hasAudio ? "Available" : "Unavailable"}
          </dd>
        </div>
      </dl>
      {hymn.youtubeUrl && (
        <a
          href={hymn.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline dark:text-accent"
        >
          Watch on YouTube <IconExternal width={14} height={14} />
        </a>
      )}
    </div>
  );
}

const desktopInputQuery = "(hover: hover) and (pointer: fine)";
function subscribeDesktopInput(callback: () => void) {
  const media = window.matchMedia(desktopInputQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function canPresentOnDevice() {
  const mobile = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
  const desktopModeIPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return !mobile && !desktopModeIPad && window.matchMedia(desktopInputQuery).matches;
}

export function HymnReader({ hymn }: { hymn: Hymn }) {
  const canPresent = useSyncExternalStore(subscribeDesktopInput, canPresentOnDevice, () => false);
  const { prev, next, upcoming } = useHymnNeighbors(hymn.id);
  const { isAdmin } = useAuth();
  const { has, toggle } = useFavorites();
  const fav = has(hymn.id);
  const { settings } = useReadingSettings();
  const [presentation, setPresentation] = useState<{ output: AudienceWindow | null } | null>(null);

  const startPresentation = () => {
    if (!canPresentOnDevice()) return;
    // Open synchronously from the click so pop-up blockers do not reject it.
    setPresentation({ output: openAudienceWindow() });
  };

  const closePresentation = () => setPresentation(null);



  return (
    <div className="w-full space-y-6">
      <RecentRecorder hymnId={hymn.id} />

      {/* Reader toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="reader-breadcrumb flex shrink-0 items-center gap-2 text-sm text-muted">
          <Link href="/hymns" className="hover:text-foreground">Hymns</Link>
          <span>/</span>
          <span className="text-foreground">Hymn {hymn.number}</span>
          <Link href="/hymns" aria-label="Back to library" title="Back to library" className="rounded-full border border-border bg-card p-2 hover:bg-accent-soft">
            <IconChevronLeft width={14} height={14} />
          </Link>
        </div>

        <nav aria-label="Hymn navigation" className="flex min-w-0 max-w-full flex-wrap items-center gap-2 lg:ml-auto">
          {prev && (
            <HymnLink href={`/hymns/${prev.id}`} prefetch={true} title={`${prev.number}. ${prev.title}`} aria-label={`Previous hymn: ${prev.number}. ${prev.title}`} className="reader-icon-control flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent-soft">
              <IconChevronLeft width={16} height={16} />
              <span className="hidden sm:inline">Previous {prev.number}</span>
            </HymnLink>
          )}
          <AudioButton hymn={hymn} />
          {next && (
            <HymnLink href={`/hymns/${next.id}`} prefetch={true} title={`${next.number}. ${next.title}`} aria-label={`Next hymn: ${next.number}. ${next.title}`} className="reader-icon-control flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent-soft">
              <span className="hidden sm:inline">Next {next.number}</span>
              <IconChevronRight width={16} height={16} />
            </HymnLink>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {canPresent && <button
            type="button"
            onClick={startPresentation}
            className="flex items-center gap-2 rounded-full bg-accent-strong px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] dark:text-black"
          >
            <IconPresent width={16} height={16} />
            Present
          </button>}
          <ShareButton title={hymn.title} />
          {isAdmin && <Link href={`/admin/hymns/${hymn.id}/edit`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft">Edit</Link>}
          <button
            type="button"
            aria-label={fav ? "Favorited" : "Favorite"}
            aria-pressed={fav}
            onClick={() => toggle(hymn.id)}
            className={`reader-icon-control flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              fav
                ? "border-accent bg-accent-soft text-accent-ink dark:text-accent-ink"
                : "border-border bg-card text-foreground hover:bg-accent-soft"
            }`}
          >
            <IconHeart filled={fav} width={16} height={16} />
            <span className="hidden sm:inline">{fav ? "Favorited" : "Favorite"}</span>
          </button>
        </div>
      </div>

      {upcoming.length > 0 && <nav aria-label="Upcoming hymns" className="flex flex-wrap items-center gap-2 text-sm">
        <span className="shrink-0 text-muted">Up next</span>
        {upcoming.map((item) => <HymnLink key={item.id} href={`/hymns/${encodeURIComponent(item.id)}`} prefetch={true}
          aria-label={`Hymn ${item.number}: ${item.title}`} title={`${item.number}. ${item.title}`}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 font-medium hover:bg-accent-soft sm:px-3">{item.number}</HymnLink>)}
      </nav>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Reader card */}
        <article
          className="rounded-2xl border border-border bg-card p-6 sm:p-12"
          style={{ ["--lyric-size" as string]: `${settings.fontSize}px` }}
        >
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Hymn {hymn.number}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              {hymn.title}
            </h1>
            {hymn.origin && (
              <p className="mt-2 text-sm text-muted">{hymn.origin}</p>
            )}
            {hymn.key && (
              <span className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink dark:text-accent-ink">
                Key: {hymn.key}
              </span>
            )}
          </header>

          <hr className="my-8 border-border" />

          <div className="lyrics-body space-y-8 text-center text-foreground">
            {orderedSections(hymn.sections).map((section, si) => (
              <section
                key={si}
                className={
                  section.type === "refrain"
                    ? "rounded-xl bg-accent-soft/60 px-6 py-5 dark:bg-accent-soft/30"
                    : ""
                }
              >
                {settings.showVerseNumbers && (
                  <p
                    className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      section.type === "refrain"
                        ? "text-accent-ink dark:text-accent-ink"
                        : "text-muted"
                    }`}
                  >
                    {sectionHeading(section)}
                  </p>
                )}
                {section.lines.map((line, li) => (
                  <p key={li} className="relative">
                    {line}
                  </p>
                ))}
              </section>
            ))}
          </div>

        </article>

        {/* Right panel */}
        <aside className="space-y-4">
          <ReadingSettings />
          <HymnInfoCard hymn={hymn} />
        </aside>
      </div>


      {presentation && (
        <PresentationView hymn={hymn} initialOutput={presentation.output} onClose={closePresentation} />
      )}
    </div>
  );
}

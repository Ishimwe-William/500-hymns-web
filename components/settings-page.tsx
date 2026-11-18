"use client";

import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { DOWNLOAD_APP_URL } from "@/lib/links";
import { useAuth } from "@/lib/auth-store";
import { useReadingSettings, useTheme } from "@/lib/client-store";
import { IconDownload } from "@/components/icons";
import { OfflineDownload } from "@/components/offline-download";

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div>
        <p className="text-[15px] font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-accent-strong" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { theme, set } = useTheme();
  const { settings, update } = useReadingSettings();

  return (
    <SectionPage title="Settings" description="Choose how the hymnbook looks and reads." sections={[
      { id: "appearance", title: "Appearance", content: <div className="divide-y divide-border">
        <Row label="Theme" description="Light or dark interface">
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set(t)}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? "border-accent bg-accent-soft text-accent-ink dark:text-accent-ink"
                    : "border-border text-muted hover:border-accent/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Reading font size" description="Lyrics text size in the reader">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease font size"
              onClick={() =>
                update({ fontSize: Math.max(16, settings.fontSize - 2) })
              }
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-muted hover:bg-accent-soft"
            >
              A−
            </button>
            <span className="w-12 text-center text-sm font-medium text-foreground">
              {settings.fontSize}
            </span>
            <button
              type="button"
              aria-label="Increase font size"
              onClick={() =>
                update({ fontSize: Math.min(30, settings.fontSize + 2) })
              }
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-muted hover:bg-accent-soft"
            >
              A+
            </button>
          </div>
        </Row>
      </div> },
      { id: "reading", title: "Reading", content: <div className="divide-y divide-border">
        <Row label="Show verse numbers" description="Label verses and refrains">
          <Toggle
            label="Show verse numbers"
            checked={settings.showVerseNumbers}
            onChange={(v) => update({ showVerseNumbers: v })}
          />
        </Row>
      </div> },
      { id: "saved-data", title: "Saved data", content: <div className="divide-y divide-border">
        <Row label="Favorites" description="Your saved hymns on this device">
          <Link href="/favorites" className="text-sm font-medium text-accent-strong hover:underline dark:text-accent">View favorites</Link>
        </Row>
        <Row label="Recent hymns" description="Hymns recently opened on this device">
          <Link href="/recent" className="text-sm font-medium text-accent-strong hover:underline dark:text-accent">View recent hymns</Link>
        </Row>
      </div> },
      { id: "offline-storage", title: "Offline access", content: <>
        <OfflineDownload />
        <p>Your favorites, recent hymns, and reading preferences are saved on this device when browser storage is available.</p>
        <Link href={DOWNLOAD_APP_URL} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft">
          <IconDownload width={15} height={15} /> Get the mobile app for offline access
        </Link>
      </> },
      { id: "account", title: "Account", content: <div className="divide-y divide-border">
        <Row label="Status" description={loading ? "Loading account..." : user?.email ?? "You are browsing as a guest"}>
          <Link
            href="/profile"
            className="rounded-full bg-accent-strong px-4 py-1.5 text-sm font-medium text-white dark:text-black"
          >
            {user ? "View profile" : "Sign in"}
          </Link>
        </Row>
      </div> },
    ]} />
  );
}

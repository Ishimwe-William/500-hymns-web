"use client";

import Link from "next/link";
import { useReadingSettings, useTheme } from "@/lib/client-store";
import { IconDownload } from "@/components/icons";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="mt-4 divide-y divide-border">{children}</div>
    </section>
  );
}

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
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
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
  const { theme, set } = useTheme();
  const { settings, update } = useReadingSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted">Tune the hymnbook to your liking.</p>
      </header>

      <Card title="Appearance">
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
      </Card>

      <Card title="Reading">
        <Row label="Show chords" description="Display chord symbols above lyrics">
          <Toggle
            label="Show chords"
            checked={settings.showChords}
            onChange={(v) => update({ showChords: v })}
          />
        </Row>
        <Row label="Show verse numbers" description="Label verses and refrains">
          <Toggle
            label="Show verse numbers"
            checked={settings.showVerseNumbers}
            onChange={(v) => update({ showVerseNumbers: v })}
          />
        </Row>
      </Card>

      <Card title="Notifications">
        <Row label="Daily verse" description="Receive a hymn each morning">
          <Toggle label="Daily verse" checked={false} onChange={() => {}} />
        </Row>
        <Row label="New hymns" description="Notify when new hymns are added">
          <Toggle label="New hymns" checked={false} onChange={() => {}} />
        </Row>
      </Card>

      <Card title="Data and sync">
        <Row label="Sync status" description="Last synced just now">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink dark:text-accent-ink">
            Up to date
          </span>
        </Row>
        <Row label="Sync now" description="Manually sync favorites and recents">
          <button
            type="button"
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-accent-soft"
          >
            Sync
          </button>
        </Row>
      </Card>

      <Card title="Offline storage">
        <Row
          label="Downloaded audio"
          description="Audio files saved on this device"
        >
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <IconDownload width={15} height={15} /> 0 files
          </span>
        </Row>
        <Row label="Storage used" description="Of available offline space">
          <span className="text-sm text-muted">12 MB / 500 MB</span>
        </Row>
        <p className="pt-3 text-xs text-muted">
          Note: offline downloads require browser storage support, which will
          be confirmed during implementation.
        </p>
      </Card>

      <Card title="Account">
        <Row label="Status" description="You are browsing as a guest">
          <Link
            href="/profile"
            className="rounded-full bg-accent-strong px-4 py-1.5 text-sm font-medium text-white dark:text-black"
          >
            Sign in
          </Link>
        </Row>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshHymnsAfterSave } from "@/app/actions/refresh-hymns";
import { useState } from "react";
import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabase";
import { orderedSections, sectionHeading, sectionsToBlocks } from "@/lib/hymn-sections";
import { lyricsTextFor, type Hymn, type HymnSection } from "@/lib/hymns";
import { useAuth } from "@/lib/auth-store";
import { IconChevronRight, IconPlus, IconTrash } from "@/components/icons";
import { SectionLyrics } from "@/components/section-lyrics";
import { LyricSectionEditor } from "@/components/lyric-section-editor";

type SaveState = "idle" | "saving" | "saved" | "saved-stale" | "error";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent";

export function HymnEditor({
  hymn,
}: {
  hymn: Hymn;
}) {
  const router = useRouter();
  const { user, isAdmin, checkingRole, getAccessToken } = useAuth();
  const [number, setNumber] = useState(String(hymn.number));
  const [title, setTitle] = useState(hymn.title);
  const [origin, setOrigin] = useState(hymn.origin ?? "");
  const [keySig, setKeySig] = useState(hymn.key ?? "");
  const [audioUrl, setAudioUrl] = useState(hymn.audioUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(hymn.youtubeUrl ?? "");
  const [sections, setSections] = useState<HymnSection[]>(
    orderedSections(hymn.sections).map((s) => ({ ...s, lines: [...s.lines] }))
  );
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<string[]>([]);

  const markDirty = () => {
    setErrors([]);
    setDirty(true);
    setSaveState("idle");
  };

  const updateSection = (i: number, patch: Partial<HymnSection>) => {
    setSections((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    markDirty();
  };

  const addSection = (type: HymnSection["type"]) => {
    setSections((prev) => {
      const number = Math.max(0, ...prev.filter((s) => s.type === type).map((s) => s.number ?? 0)) + 1;
      return [...prev, { type, number, label: `${type === "verse" ? "Verse" : "Refrain"} ${number}`, lines: [""] }];
    });
    markDirty();
  };

  const removeSection = (i: number) => {
    setSections((prev) => prev.filter((_, j) => j !== i));
    markDirty();
  };

  const refreshSavedHymn = async () => {
    setSaveState("saving");
    try {
      if (!user) throw new Error("Signed out");
      const result = await refreshHymnsAfterSave(await getAccessToken(user.uid));
      if (!result.ok) throw new Error("Refresh failed");
      setErrors([]);
      setSaveState("saved");
      router.refresh();
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("saved-stale");
      setErrors(["Your changes were saved to the database, but the displayed hymn could not be refreshed. Use Retry refresh to update it without saving again."]);
    }
  };

  const save = async () => {
    if (!user || !isAdmin || checkingRole || !isSupabaseConfigured) {
      setErrors(["You must be signed in as an administrator to save changes."]);
      setSaveState("error");
      return;
    }
    const errs: string[] = [];
    if (!title.trim()) errs.push("Title is required");
    if (!Number(number) || Number(number) < 1) errs.push("Number must be a positive integer");
    if (sections.length === 0) errs.push("At least one section is required");
    if (sections.some((s) => s.lines.every((l) => !l.trim())))
      errs.push("Each section needs at least one line of text");
    if (errs.length) {
      setErrors(errs);
      setSaveState("error");
      return;
    }
    setErrors([]);
    setSaveState("saving");

    const videoLink = youtubeUrl.trim();
    const videoId = videoLink.match(/(?:[?&]v=|youtu\.be\/|youtube\.com\/(?:shorts|embed|live)\/)([\w-]{11})(?:[^\w-]|$)/)?.[1]
      ?? (/^[\w-]{11}$/.test(videoLink) ? videoLink : null);
    const { stanzas, refrains } = sectionsToBlocks(sections);

    const payload: Record<string, unknown> = {
      number: Number(number),
      title: title.trim(),
      origin: origin.trim() || null,
      doh: keySig.trim() || null,
      stanzas,
      refrains,
      lyrics_text: lyricsTextFor(orderedSections(sections)),
      audio_url: audioUrl.trim() || null,
      youtube: videoId,
      youtube_url: videoLink || null,
    };

    try {
      const query = new URLSearchParams({ id: `eq.${hymn.id}`, select: "id" });
      const saved = await supabaseRequest<{ id: string }[]>(`hymns?${query}`, {
        method: "PATCH", token: await getAccessToken(user.uid), cache: "no-store",
        headers: { Prefer: "return=representation" }, body: JSON.stringify(payload),
      });
      if (saved.length !== 1 || saved[0].id !== hymn.id) throw new Error("The hymn was not updated.");
      setDirty(false);
    } catch (error) {
      const denied = error && typeof error === "object" && "code" in error && error.code === "permission-denied";
      setErrors([denied ? "Your account does not have permission to save this hymn." : "Changes could not be saved. Check your connection and try again."]);
      setSaveState("error");
      return;
    }
    await refreshSavedHymn();
  };

  const previewSections = orderedSections(sections).filter((s) =>
    s.lines.some((l) => l.trim())
  );

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link href="/admin" className="hover:text-foreground">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin" className="hover:text-foreground">
          Hymns
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Edit hymn</span>
      </nav>

      {/* Action bar */}
      <div className="sticky top-20 z-20 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3 text-sm">
          {dirty && <span className="text-muted">Unsaved changes</span>}
          {saveState === "saving" && (
            <span className="text-muted">Saving…</span>
          )}
          {saveState === "saved" && (
            <span className="font-medium text-accent-ink dark:text-accent-ink">
              Saved ✓
            </span>
          )}
          {saveState === "saved-stale" && <span className="font-medium text-muted">Saved; refresh needed</span>}
          {saveState === "error" && (
            <span className="font-medium text-red-500">Changes not saved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft"
          >
            Cancel
          </Link>
          {saveState === "saved-stale" && <button type="button" onClick={refreshSavedHymn} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft">Retry refresh</button>}
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving" || !isAdmin || checkingRole}
            className="rounded-full bg-accent-strong px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-black"
          >
            Save changes
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <ul className="list-inside list-disc">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Number
              </span>
              <input
                className={inputCls}
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  markDirty();
                }}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Key
              </span>
              <input
                className={inputCls}
                value={keySig}
                onChange={(e) => {
                  setKeySig(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. C"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </span>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Origin
              </span>
              <input
                className={inputCls}
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Traditional hymn"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Audio URL
            </span>
            <input
              className={inputCls}
              value={audioUrl}
              onChange={(e) => {
                setAudioUrl(e.target.value);
                markDirty();
              }}
              placeholder="https://…"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">YouTube URL</span>
            <input className={inputCls} value={youtubeUrl} onChange={event => { setYoutubeUrl(event.target.value); markDirty(); }} placeholder="https://www.youtube.com/watch?v=…" />
            <p className="mt-1.5 text-xs text-muted">The recording and YouTube video are saved separately. Clear a field to remove its link.</p>
          </label>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Lyrics
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addSection("verse")}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent-soft"
                >
                  <IconPlus width={13} height={13} /> Verse
                </button>
                <button
                  type="button"
                  onClick={() => addSection("refrain")}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent-soft"
                >
                  <IconPlus width={13} height={13} /> Refrain
                </button>
              </div>
            </div>

            {sections.map((section, si) => (
              <div
                key={si}
                className={`rounded-xl border p-4 ${
                  section.type === "refrain"
                    ? "border-accent/40 bg-accent-soft/40 dark:bg-accent-soft/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${
                        section.type === "refrain"
                          ? "bg-accent-soft text-accent-ink dark:text-accent-ink"
                          : "bg-border/60 text-muted"
                      }`}
                    >
                      {section.type}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
                      value={section.number ?? 0}
                      onChange={(e) => {
                        const number = Number(e.target.value);
                        if (!Number.isInteger(number) || number < 0) return;
                        updateSection(si, { number, label: `${section.type === "verse" ? "Verse" : "Refrain"} ${number}` });
                      }}
                      aria-label="Section number"
                    />
                    <input
                      className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
                      value={section.label}
                      onChange={(e) =>
                        updateSection(si, { label: e.target.value })
                      }
                      aria-label="Section label"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSection(si)}
                    aria-label="Remove section"
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
                <LyricSectionEditor section={section} onChange={patch => updateSection(si, patch)} />
              </div>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div className="sticky top-36 rounded-2xl border border-border bg-card p-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Hymn {number || "—"}
            </p>
            <h3 className="mt-2 text-center text-2xl font-bold text-foreground">
              {title || "Untitled hymn"}
            </h3>
            {origin && (
              <p className="mt-1 text-center text-sm text-muted">{origin}</p>
            )}
            {keySig && (
              <p className="mt-2 text-center">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink dark:text-accent-ink">
                  Key: {keySig}
                </span>
              </p>
            )}
            <hr className="my-6 border-border" />
            <div className="space-y-6 text-center text-[17px] leading-loose text-foreground">
              {previewSections.length === 0 && (
                <p className="text-sm text-muted">
                  Start typing lyrics to see a preview.
                </p>
              )}
              {previewSections.map((section, si) => (
                <section
                  key={si}
                  className={
                    section.type === "refrain"
                      ? "rounded-xl bg-accent-soft/60 px-4 py-4 dark:bg-accent-soft/30"
                      : ""
                  }
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {sectionHeading(section)}
                  </p>
                  <p><SectionLyrics section={section} /></p>
                </section>
              ))}
            </div>
            {audioUrl && (
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
                <IconChevronRight width={12} height={12} />
                Audio recording linked
              </p>
            )}
            {youtubeUrl && <p className="mt-2 text-center text-xs text-muted">YouTube video linked</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

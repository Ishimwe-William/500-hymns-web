"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { presentationSections } from "@/lib/hymn-sections";
import { chooseAudienceScreen, fullscreenAudience, getPresentationScreens, openAudienceWindow, screenKey, screenLabel, type AudienceWindow, type PresentationScreen, type PresentationScreens } from "@/lib/presentation-display";
import { PresentationSlide } from "@/components/presentation-slide";
import "./presentation-view.css";
import type { Hymn } from "@/lib/hymns";

const SIZES = [32, 40, 48, 56, 64, 72];
const button = "rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft disabled:opacity-40";

function AudienceOutput({ output, hymn, section, fontSize, blank }: {
  output: AudienceWindow; hymn: Hymn; section?: Hymn["sections"][number]; fontSize: number; blank: boolean;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const update = () => setFullscreen(Boolean(output.window.document.fullscreenElement));
    output.window.document.addEventListener("fullscreenchange", update);
    update();
    return () => output.window.document.removeEventListener("fullscreenchange", update);
  }, [output]);
  return <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>
    <PresentationSlide section={section} number={hymn.number} title={hymn.title} fontSize={fontSize} blank={blank} />
    {!fullscreen && <button type="button" onClick={() => void fullscreenAudience(output)} style={{ position: "absolute", bottom: 12, right: 12, padding: "10px 16px", border: "1px solid #555", borderRadius: 10, background: "#222", color: "#fff", fontSize: 14, cursor: "pointer" }}>Enter fullscreen</button>}
  </div>;
}

export function PresentationView({ hymn, initialOutput, onClose }: { hymn: Hymn; initialOutput: AudienceWindow | null; onClose: () => void }) {
  const sections = useMemo(() => presentationSections(hymn.sections), [hymn.sections]);
  const [index, setIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(3);
  const [blank, setBlank] = useState(false);
  const [output, setOutput] = useState(initialOutput);
  const [screens, setScreens] = useState<PresentationScreen[]>([]);
  const [target, setTarget] = useState<PresentationScreen | null>(null);
  const [status, setStatus] = useState(initialOutput ? "Checking connected displays..." : "Allow pop-ups, then open the audience window.");
  const alive = useRef(true);
  const detailsRef = useRef<PresentationScreens | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safeIndex = Math.min(index, Math.max(0, sections.length - 1));
  const section = sections[safeIndex];
  const fontSize = SIZES[sizeIndex];

  const place = useCallback(async (audience: AudienceWindow, display: PresentationScreen | null) => {
    if (!display) {
      if (alive.current) setStatus("Move the audience window to your projector, then choose Enter fullscreen there.");
      return;
    }
    const full = await fullscreenAudience(audience, display);
    if (alive.current) setStatus(full ? `Projecting on ${screenLabel(display)}.` : `Audience placed on ${screenLabel(display)}. Choose Enter fullscreen in that window if needed.`);
    window.focus();
  }, []);

  const detect = useCallback(async (audience: AudienceWindow | null) => {
    try {
      const details = await getPresentationScreens();
      if (!alive.current) return;
      if (!details) { setStatus("Automatic display detection is unavailable. Move the audience window to your projector and choose Enter fullscreen there."); return; }
      detailsRef.current = details;
      setScreens([...details.screens]);
      const external = chooseAudienceScreen(details);
      setTarget(external);
      if (audience && !audience.window.closed) await place(audience, external);
      else setStatus(external ? `Ready to project on ${screenLabel(external)}. Open the audience window.` : "No second display detected. You can still open an audience window and move it manually.");
    } catch {
      if (alive.current) setStatus("Display access was not granted. Move the audience window manually, or select Detect displays to try again.");
    }
  }, [place]);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void detect(initialOutput); });
    return () => { cancelled = true; alive.current = false; };
  }, [detect, initialOutput]);

  useEffect(() => {
    if (closing.current) clearTimeout(closing.current);
    if (!output) return;
    const check = window.setInterval(() => {
      if (output.window.closed) { setOutput(null); setStatus("Audience window closed. Your preview is still available."); }
    }, 700);
    const end = () => { if (!output.window.closed) output.window.close(); };
    window.addEventListener("beforeunload", end);
    return () => {
      clearInterval(check);
      window.removeEventListener("beforeunload", end);
      // React's development effect replay must not close a newly opened window.
      closing.current = setTimeout(end, 0);
    };
  }, [output]);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const update = () => {
      setScreens([...details.screens]);
      if (target && !details.screens.some((screen) => screenKey(screen) === screenKey(target))) {
        setTarget(null); setStatus("Audience display disconnected. Choose another display or move the audience window manually.");
      }
    };
    details.addEventListener("screenschange", update);
    return () => details.removeEventListener("screenschange", update);
  }, [screens.length, target]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName ?? "";
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag) && event.key !== "Escape") return;
      if (tag === "BUTTON" && event.key === " ") return;
      if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); setIndex((i) => Math.max(0, Math.min(i + 1, sections.length - 1))); }
      if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
      if (event.key.toLowerCase() === "b") setBlank((value) => !value);
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    output?.window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey); output?.window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sections.length, output, onClose]);

  const open = () => {
    if (output && !output.window.closed) { output.window.focus(); return; }
    const audience = openAudienceWindow(); setOutput(audience);
    if (!audience) { setStatus("The audience window was blocked. Allow pop-ups for this site and try again."); return; }
    if (target) void place(audience, target); else void detect(audience);
  };

  return <div role="dialog" aria-modal="true" aria-label="Presenter view" className="presenter-viewport fixed inset-0 z-[100] overflow-hidden bg-background text-foreground">
    <div className="presenter-layout mx-auto max-w-[1600px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-accent-strong dark:text-accent">Presenter view</p><h2 className="mt-1 text-xl font-bold">{hymn.number}. {hymn.title}</h2></div>
        <button type="button" onClick={onClose} className={button}>End presentation</button>
      </header>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <p role="status" className="min-w-0 flex-1 text-sm text-muted">{status}</p>
        <button type="button" onClick={open} className={button}>{output ? "Focus audience" : "Open audience window"}</button>
        <button type="button" onClick={() => void detect(output)} className={button}>Detect displays</button>
        {screens.length > 1 && <select aria-label="Audience display" value={target ? screenKey(target) : ""} onChange={(event) => {
          const display = screens.find((screen) => screenKey(screen) === event.target.value) ?? null; setTarget(display); if (output) void place(output, display);
        }} className="rounded-xl border border-border bg-background px-3 py-2 text-sm"><option value="">Choose display</option>{screens.map((screen) => <option key={screenKey(screen)} value={screenKey(screen)}>{screenLabel(screen)}</option>)}</select>}
        {output && <button type="button" onClick={() => void fullscreenAudience(output, target)} className={button}>Fullscreen audience</button>}
      </div>
      <div className="presenter-previews">
        <section className="presenter-current" aria-label="Current preview">
          <div className="flex justify-between text-sm"><h3 className="font-semibold">Live audience preview</h3><span className="text-muted">{sections.length ? safeIndex + 1 : 0} / {sections.length}{blank ? " · Screen blanked" : ""}</span></div>
          <div className="presenter-live-slide overflow-hidden rounded-2xl border border-border"><PresentationSlide section={section} number={hymn.number} title={hymn.title} fontSize={fontSize} blank={blank} /></div>
        </section>
        <section className="presenter-next" aria-label="Next preview">
          <h3 className="text-sm font-semibold">Up next</h3>
          <div className="presenter-next-slide overflow-hidden rounded-2xl border border-border"><PresentationSlide section={sections[safeIndex + 1]} number={hymn.number} title={hymn.title} fontSize={fontSize} /></div>
          <p className="text-xs leading-5 text-muted">Arrow keys or Space: next / previous. B: blank the audience screen. Escape: end presentation.</p>
          <nav aria-label="Presentation slides" className="presenter-slide-list grid grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-border bg-card p-3">{sections.map((slide, i) => <button key={i} type="button" aria-current={i === safeIndex ? "step" : undefined} onClick={() => setIndex(i)} className={`${button} text-left ${i === safeIndex ? "border-accent-strong bg-accent-soft" : ""}`}>{i + 1}. {slide.label}</button>)}</nav>
        </section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2"><button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={safeIndex === 0} className={button}>Previous slide</button><button type="button" onClick={() => setIndex((i) => Math.min(sections.length - 1, i + 1))} disabled={safeIndex >= sections.length - 1} className={button}>Next slide</button></div>
        <button type="button" aria-pressed={blank} onClick={() => setBlank((value) => !value)} className={button}>{blank ? "Show audience slide" : "Blank audience screen"}</button>
        <div className="flex items-center gap-2"><span className="text-sm text-muted">Text size</span><button type="button" aria-label="Smaller text" disabled={sizeIndex === 0} onClick={() => setSizeIndex((i) => i - 1)} className={button}>A-</button><button type="button" aria-label="Larger text" disabled={sizeIndex === SIZES.length - 1} onClick={() => setSizeIndex((i) => i + 1)} className={button}>A+</button></div>
      </div>
    </div>
    {output && !output.window.closed && createPortal(<AudienceOutput output={output} hymn={hymn} section={section} fontSize={fontSize} blank={blank} />, output.root)}
  </div>;
}

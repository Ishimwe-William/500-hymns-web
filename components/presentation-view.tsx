"use client";

import { useEffect, useState } from "react";
import { presentationSections } from "@/lib/hymn-sections";
import type { Hymn } from "@/lib/hymns";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
} from "@/components/icons";

const SIZES = [32, 40, 48, 56, 64];

export function PresentationView({
  hymn,
  onClose,
}: {
  hymn: Hymn;
  onClose: () => void;
}) {
  const sections = presentationSections(hymn.sections);
  const [index, setIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(2);
  const fontSize = SIZES[sizeIndex];

  const section = sections[Math.min(index, sections.length - 1)];

  const go = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min(i + delta, sections.length - 1)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Escape and the browser's own fullscreen controls also end presentation.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onClose]);

  // Prevent background scroll while presenting.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!section) return null;

  const isRefrain = section.type === "refrain";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Hymn {hymn.number}
          </p>
          <p className="truncate text-sm font-medium text-white/80">
            {hymn.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit presentation"
          className="rounded-full p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconClose width={22} height={22} />
        </button>
      </div>

      {/* Section content */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 pb-28 sm:px-16">
        <div className="w-full max-w-4xl text-center">
          <p
            className={`mb-6 text-sm font-semibold uppercase tracking-[0.3em] ${
              isRefrain ? "text-amber-400" : "text-white/50"
            }`}
          >
            {section.label}
          </p>
          <div
            className="space-y-4 font-medium leading-[1.7] text-white"
            style={{ fontSize: `clamp(1.5rem, ${fontSize}px, 4rem)` }}
          >
            {section.lines
              .filter((l) => l.trim())
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-10">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous section"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          <IconChevronLeft width={22} height={22} />
        </button>

        <span className="min-w-28 text-center text-sm text-white/60">
          {index + 1} / {sections.length}
        </span>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={index >= sections.length - 1}
          aria-label="Next section"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          <IconChevronRight width={22} height={22} />
        </button>

        <div className="mx-4 hidden h-6 w-px bg-white/15 sm:block" />

        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
            disabled={sizeIndex === 0}
            aria-label="Smaller text"
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-white/70 hover:bg-white/10 disabled:opacity-30"
          >
            A−
          </button>
          <button
            type="button"
            onClick={() => setSizeIndex((i) => Math.min(SIZES.length - 1, i + 1))}
            disabled={sizeIndex === SIZES.length - 1}
            aria-label="Larger text"
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-white/70 hover:bg-white/10 disabled:opacity-30"
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}

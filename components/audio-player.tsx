"use client";

import Link from "next/link";
import Image from "next/image";
import { usePlayer } from "@/lib/client-store";
import {
  IconClose,
  IconPause,
  IconPlay,
  IconSkipBack,
  IconSkipForward,
} from "@/components/icons";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer() {
  const {
    hymn,
    status,
    position,
    duration,
    play,
    pause,
    resume,
    stop,
    seek,
    previous,
    next,
    playPrevious,
    playNext,
  } = usePlayer();

  if (!hymn || status === "idle") return null;
  const title = `${hymn.number}. ${hymn.title}`;

  const toggle = () => {
    if (status === "playing") pause();
    else if (status === "paused" || status === "loading") resume();
    else play(hymn, duration || 240);
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div role="region" aria-label="Audio player" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-player">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-10">
        {/* Left: track info */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <Image src="/brand/artwork-light.png" alt="" width={40} height={40} className="dark:hidden" />
            <Image src="/brand/artwork-dark.png" alt="" width={40} height={40} className="hidden dark:block" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {title}
            </p>
            <p className="text-xs text-muted">
              {status === "loading" && "Loading audio…"}
              {status === "playing" && "Playing"}
              {status === "paused" && "Paused"}
              {status === "unavailable" && "Audio unavailable"}
            </p>
          </div>
        </div>

        {/* Middle: controls */}
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Previous hymn"
              onClick={playPrevious}
              disabled={!previous}
              title={previous ? `Play hymn ${previous.number}: ${previous.title}` : "No previous recording"}
              className="text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <IconSkipBack width={20} height={20} />
            </button>
            <button
              type="button"
              aria-label={status === "playing" ? "Pause" : "Play"}
              onClick={toggle}
              disabled={status === "loading"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-strong text-white transition-transform hover:scale-105 disabled:opacity-60 dark:text-black"
            >
              {status === "playing" ? (
                <IconPause width={20} height={20} />
              ) : (
                <IconPlay width={20} height={20} className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Next hymn"
              onClick={playNext}
              disabled={!next}
              title={next ? `Play hymn ${next.number}: ${next.title}` : "No next recording"}
              className="text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <IconSkipForward width={20} height={20} />
            </button>
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="w-10 text-right text-[11px] tabular-nums text-muted">
              {formatTime(position)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={position}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-accent-strong"
              style={{
                background: `linear-gradient(to right, var(--accent-strong) ${progress}%, var(--border) ${progress}%)`,
              }}
            />
            <span className="w-10 text-[11px] tabular-nums text-muted">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: close */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/hymns/${hymn.id}`}
            className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-accent-soft hover:text-foreground sm:block"
          >
            Open hymn
          </Link>
          <button
            type="button"
            onClick={stop}
            aria-label="Close player"
            className="rounded-full p-2 text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

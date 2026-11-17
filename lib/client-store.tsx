"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/* ---------------- localStorage-backed store ---------------- */

const CHANGE_EVENT = "hymns:storage-change";

const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function readSnapshot<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  if (value === null || value === undefined) value = fallback;
  snapshotCache.set(key, { raw, value });
  return value;
}

function subscribe(key: string, onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) onChange();
  };
  const onLocal = () => onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}

function notify(key: string) {
  snapshotCache.delete(key);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const subscribeKey = useCallback((cb: () => void) => subscribe(key, cb), [key]);
  const getSnapshot = useCallback(
    () => readSnapshot(key, fallback),
    [key, fallback]
  );
  const value = useSyncExternalStore(subscribeKey, getSnapshot, () => fallback);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readSnapshot(key, fallback);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* storage unavailable */
      }
      notify(key);
    },
    [key, fallback]
  );

  return [value, set] as const;
}

/* ---------------- Favorites ---------------- */

const FAV_KEY = "hymns:favorites";
const EMPTY_IDS: string[] = [];

const FavoritesContext = createContext<{
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
} | null>(null);

function useFavoritesState() {
  const [ids, setIds] = useLocalStorage<string[]>(FAV_KEY, EMPTY_IDS);
  const toggle = useCallback(
    (id: string) => {
      setIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    },
    [setIds]
  );
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has };
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const value = useFavoritesState();
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  const fallback = useFavoritesState();
  return ctx ?? fallback;
}

/* ---------------- Recent ---------------- */

const RECENT_KEY = "hymns:recent";
const EMPTY_RECENT: RecentEntry[] = [];

export interface RecentEntry {
  id: string;
  openedAt: number;
}

export function useRecent() {
  const [entries, setEntries] = useLocalStorage<RecentEntry[]>(
    RECENT_KEY,
    EMPTY_RECENT
  );
  const recordOpen = useCallback(
    (id: string) => {
      setEntries((prev) =>
        [
          { id, openedAt: Date.now() },
          ...prev.filter((e) => e.id !== id),
        ].slice(0, 50)
      );
    },
    [setEntries]
  );
  return { entries, recordOpen };
}

/* ---------------- Reading settings ---------------- */

const SETTINGS_KEY = "hymns:settings";
const EMPTY_SETTINGS: Record<string, never> = {};

export interface ReadingSettings {
  fontSize: number; // 18 | 22 | 26
  showChords: boolean;
  showVerseNumbers: boolean;
}

export const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 22,
  showChords: false,
  showVerseNumbers: true,
};

export function useReadingSettings() {
  const [stored, setStored] = useLocalStorage<Partial<ReadingSettings>>(
    SETTINGS_KEY,
    EMPTY_SETTINGS
  );
  const settings: ReadingSettings = { ...DEFAULT_SETTINGS, ...stored };

  const update = useCallback(
    (patch: Partial<ReadingSettings>) => {
      setStored((prev) => ({ ...prev, ...patch }));
    },
    [setStored]
  );

  return { settings, update };
}

/* ---------------- Theme ---------------- */

export type Theme = "light" | "dark";

const THEME_KEY = "hymns:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === '"dark"' || raw === '"light"') return JSON.parse(raw);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY || e.key === null) onChange();
  };
  const onLocal = () => onChange();
  const mq = window.matchMedia?.(DARK_QUERY);
  mq?.addEventListener?.("change", onChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    mq?.removeEventListener?.("change", onChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme>(
    subscribeTheme,
    readTheme,
    () => "light"
  );

  // Keep the .dark class on <html> in sync (DOM only — no state update).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const set = useCallback((t: Theme) => {
    try {
      window.localStorage.setItem(THEME_KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
    notify(THEME_KEY);
  }, []);

  const toggle = useCallback(() => {
    set(readTheme() === "dark" ? "light" : "dark");
  }, [set]);

  return { theme, toggle, set };
}

/* ---------------- Audio player ---------------- */

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "unavailable";

export interface PlayerHymn {
  id: string;
  number: number;
  title: string;
  audioUrl?: string;
}

export interface PlayerState {
  hymn: PlayerHymn | null;
  status: PlayerStatus;
  position: number; // seconds
  duration: number; // seconds
}

interface PlayerContextValue extends PlayerState {
  play: (hymn: PlayerHymn, duration?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    hymn: null,
    status: "idle",
    position: 0,
    duration: 0,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const teardownAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      audioRef.current = null;
    }
  }, []);

  const play = useCallback(
    (hymn: PlayerHymn, fallbackDuration = 240) => {
      setState((prev) => {
        if (prev.hymn?.id === hymn.id && prev.status !== "idle") {
          return { ...prev, status: "playing" };
        }
        return { hymn, status: "loading", position: 0, duration: fallbackDuration };
      });

      teardownAudio();

      if (hymn.audioUrl) {
        const el = new Audio(hymn.audioUrl);
        audioRef.current = el;
        el.addEventListener("loadedmetadata", () => {
          setState((prev) =>
            prev.hymn?.id === hymn.id && prev.duration !== el.duration
              ? { ...prev, duration: el.duration || prev.duration }
              : prev
          );
        });
        el.addEventListener("timeupdate", () => {
          setState((prev) =>
            prev.hymn?.id === hymn.id ? { ...prev, position: el.currentTime } : prev
          );
        });
        el.addEventListener("ended", () => {
          setState((prev) =>
            prev.hymn?.id === hymn.id
              ? { ...prev, status: "paused", position: 0 }
              : prev
          );
        });
        el.addEventListener("error", () => {
          setState((prev) =>
            prev.hymn?.id === hymn.id ? { ...prev, status: "unavailable" } : prev
          );
        });
        el.play()
          .then(() =>
            setState((prev) =>
              prev.hymn?.id === hymn.id ? { ...prev, status: "playing" } : prev
            )
          )
          .catch(() =>
            setState((prev) =>
              prev.hymn?.id === hymn.id ? { ...prev, status: "unavailable" } : prev
            )
          );
        return;
      }

      // No audio source — simulate playback so the UI flow still works.
      window.setTimeout(() => {
        setState((prev) =>
          prev.hymn?.id === hymn.id ? { ...prev, status: "playing" } : prev
        );
      }, 900);
    },
    [teardownAudio]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((prev) =>
      prev.status === "playing" ? { ...prev, status: "paused" } : prev
    );
  }, []);

  const resume = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.play().catch(() => {});
      setState((prev) =>
        prev.status === "paused" || prev.status === "loading"
          ? { ...prev, status: "playing" }
          : prev
      );
      return;
    }
    setState((prev) =>
      prev.status === "paused" ? { ...prev, status: "playing" } : prev
    );
  }, []);

  const stop = useCallback(() => {
    teardownAudio();
    setState({ hymn: null, status: "idle", position: 0, duration: 0 });
  }, [teardownAudio]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    setState((prev) => {
      const position = Math.max(0, Math.min(seconds, prev.duration));
      if (el) el.currentTime = position;
      return { ...prev, position };
    });
  }, []);

  // Simulated playback position for hymns without an audio source.
  useEffect(() => {
    if (state.status !== "playing" || state.hymn?.audioUrl) return;
    const t = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        const next = prev.position + 1;
        if (next >= prev.duration) {
          return { ...prev, position: prev.duration, status: "paused" };
        }
        return { ...prev, position: next };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [state.status, state.hymn?.audioUrl]);

  // Clean up audio element on unmount.
  useEffect(() => teardownAudio, [teardownAudio]);

  return (
    <PlayerContext.Provider
      value={{ ...state, play, pause, resume, stop, seek }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

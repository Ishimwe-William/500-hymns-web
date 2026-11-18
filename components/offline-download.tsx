"use client";

import { useEffect, useState } from "react";
import { offlineCommand, type OfflineStatus } from "@/lib/offline-client";

export function OfflineDownload() {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void offlineCommand("STATUS").then(setStatus).catch(() => {});
    const changed = () => void offlineCommand("STATUS").then(setStatus).catch(() => {});
    navigator.serviceWorker?.addEventListener("message", changed);
    return () => navigator.serviceWorker?.removeEventListener("message", changed);
  }, []);
  async function run(command: string) {
    setBusy(true); setMessage("");
    try {
      if (command === "DOWNLOAD") await navigator.storage?.persist?.();
      const next = await offlineCommand(command);
      setStatus(next);
      setMessage(command === "REMOVE" ? "Offline download removed." : "Your offline hymnbook is up to date.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <p>{status ? `${status.count} hymns saved for offline reading and search.` : "Download the hymnbook to read and search lyrics without an internet connection."}</p>
    <p className="text-sm text-muted">Downloaded lyrics check for updates automatically when you reconnect. Audio requires an internet connection. Clearing browser data removes the download.</p>
    {status && <p className="text-sm text-muted">Last checked: {new Date(status.checkedAt).toLocaleString()}</p>}
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => void run(status ? "CHECK" : "DOWNLOAD")} className="rounded-full bg-accent-strong px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:text-black">{busy ? "Please wait…" : status ? "Check for updates" : "Download hymns"}</button>
      {status && <button disabled={busy} onClick={() => void run("REMOVE")} className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-50">Remove download</button>}
    </div>
    <p role="status" className="text-sm">{message}</p>
  </div>;
}

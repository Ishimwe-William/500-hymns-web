"use client";

import Link from "next/link";
import { usePlayer } from "@/lib/client-store";
import { DEVELOPER_URL, DOWNLOAD_APP_URL } from "@/lib/links";

export function SiteFooter() {
  const { hymn, status } = usePlayer();
  const playerVisible = Boolean(hymn) && status !== "idle";
  return (
    <footer className={`border-t border-border bg-card px-4 text-xs text-muted sm:px-6 lg:px-10 ${playerVisible ? "mb-20" : ""}`}>
      <div className="overflow-x-auto">
        <div className="mx-auto flex w-max min-w-full items-center justify-center gap-3 whitespace-nowrap py-4 sm:gap-5">
          <span>&copy; {new Date().getFullYear()} BunsenPlus</span>
          <a href={DEVELOPER_URL} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">Developer</a>
          <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
          <Link href={DOWNLOAD_APP_URL} className="hover:text-foreground hover:underline">Download app</Link>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

export function HymnSpinner() {
  return <svg aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>;
}

function PendingHymn() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <span role="status" aria-label="Opening hymn" className="inline-flex shrink-0 items-center justify-center">
    <HymnSpinner />
    <span className="sr-only">Opening hymn…</span>
  </span>;
}

export function HymnLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<PendingHymn /></Link>;
}

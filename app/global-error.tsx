"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";
import "./globals.css";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error("Hymnbook failed to load", error); }, [error]);
  return (
    <html lang="en">
      <head><title>Unable to load | Indirimbo Zo Guhimbaza Imana</title></head>
      <body className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Arial, sans-serif" }}>
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-10">
          <ErrorState title="The hymnbook couldn't load" description="Please try again. You can also return to the hymnbook to start fresh." onRetry={retry} reloadHome />
        </main>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error("Page failed to load", error); }, [error]);
  return <ErrorState title="We couldn't open this page" description="Please try again, or return to the hymnbook to keep browsing." onRetry={retry} />;
}

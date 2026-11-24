"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HymnSummary } from "@/lib/hymns";

const HymnLibrary = createContext<HymnSummary[]>([]);
export function HymnLibraryProvider({ hymns, children }: { hymns: HymnSummary[]; children: ReactNode }) {
  return <HymnLibrary.Provider value={hymns}>{children}</HymnLibrary.Provider>;
}
export function useHymnNeighbors(id: string) {
  const hymns = useContext(HymnLibrary);
  const index = hymns.findIndex((hymn) => hymn.id === id);
  return { prev: index > 0 ? hymns[index - 1] : null, next: index >= 0 && index < hymns.length - 1 ? hymns[index + 1] : null, upcoming: index >= 0 ? hymns.slice(index + 1, index + 6) : [] };
}

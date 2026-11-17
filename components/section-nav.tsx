"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash.slice(1);
const getServerHash = () => "";

export function SectionNav({ title, sections }: { title: string; sections: { id: string; title: string }[] }) {
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash);
  const sectionIds = sections.map((section) => section.id).join(",");
  useEffect(() => {
    // Account sections may mount after authentication restores the session.
    const id = getHash();
    if (id && sectionIds.split(",").includes(id)) document.getElementById(id)?.scrollIntoView();
  }, [sectionIds]);
  const active = hash || sections[0]?.id;
  return (
    <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-28">
      <h3 className="mb-3 text-sm font-semibold text-foreground">On this page</h3>
      <nav aria-label={`${title} sections`} className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
        {sections.map((section, index) => (
          <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined} className={`flex gap-3 rounded-lg px-2 py-2 text-[13px] leading-5 transition-colors ${active === section.id ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-accent-soft hover:text-accent-ink"}`}>
            <span className="font-medium text-accent-strong dark:text-accent">{String(index + 1).padStart(2, "0")}</span>
            {section.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}

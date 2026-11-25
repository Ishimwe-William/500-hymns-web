"use client";

import { useRef, useState } from "react";
import { sectionHeading, underlineForSelection } from "@/lib/hymn-sections";
import type { HymnSection, UnderlineTarget } from "@/lib/hymns";

const targetValue = (target: UnderlineTarget) => typeof target === "string" ? { word: target, occurrence: 1 } : target;

export function LyricSectionEditor({ section, onChange }: { section: HymnSection; onChange: (patch: Partial<HymnSection>) => void }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const text = section.lines.join("\n");
  const selected = underlineForSelection(text, selection.start, selection.end);
  const targets = section.underline ?? [];
  const matching = (target: UnderlineTarget) => {
    const value = targetValue(target);
    return selected && value.word === selected.word && value.occurrence === selected.occurrence;
  };
  const active = targets.some(matching);
  function toggleUnderline() {
    if (!selected) return;
    onChange({ underline: active ? targets.filter(target => !matching(target)) : [...targets, selected] });
    textarea.current?.focus({ preventScroll: true });
    textarea.current?.setSelectionRange(selection.start, selection.end);
  }
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={!selected} aria-pressed={active} onMouseDown={event => event.preventDefault()} onClick={toggleUnderline}
        className={`rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-40 ${active ? "bg-accent-soft text-accent-ink" : "text-foreground hover:bg-accent-soft"}`}>
        <u aria-hidden="true">U</u> <span>{active ? "Remove underline" : "Underline selection"}</span>
      </button>
      <span className="text-xs text-muted">Select lyrics, then underline. Ctrl+U / ⌘U also works.</span>
    </div>
    <textarea ref={textarea} aria-label={`${sectionHeading(section)} lyrics`} value={text}
      className="min-h-28 w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-[13px] leading-relaxed text-foreground outline-none focus:border-accent"
      onSelect={event => setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })}
      onChange={event => { setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }); onChange({ lines: event.target.value.split("\n") }); }}
      onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u" && selected) { event.preventDefault(); toggleUnderline(); } }}
      placeholder="One lyric line per row…" />
    <p className="text-xs text-muted">Press Enter for a new line. Typed \n sequences also become line breaks when saved. Formatting appears in the live preview.</p>
    {targets.length > 0 && <details className="text-sm">
      <summary className="cursor-pointer text-muted">Underlined text ({targets.length})</summary>
      <div className="mt-2 flex flex-wrap gap-2">{targets.map((target, index) => {
        const value = targetValue(target);
        return <button key={index} type="button" aria-label={`Remove underline: ${value.word}, occurrence ${value.occurrence}`}
          onClick={() => onChange({ underline: targets.filter((_, i) => i !== index) })}
          className="max-w-full whitespace-pre-wrap rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-accent-soft">
          <u>{value.word}</u>{value.occurrence > 1 ? ` (${value.occurrence})` : ""} ×
        </button>;
      })}</div>
    </details>}
  </div>;
}

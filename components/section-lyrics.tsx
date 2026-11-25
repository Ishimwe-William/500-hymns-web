import { lyricSegments } from "@/lib/hymn-sections";
import type { HymnSection } from "@/lib/hymns";

export function SectionLyrics({ section }: { section: HymnSection }) {
  return <span style={{ whiteSpace: "pre-wrap" }}>{lyricSegments(section.lines.join("\n"), section.underline).map((part, index) => part.underlined
    ? <u key={index} style={{ textDecorationSkipInk: "none", textUnderlineOffset: "0.15em", textDecorationThickness: "0.06em" }}>{part.text}</u>
    : part.text)}</span>;
}

"use client";

import { useEffect, useRef } from "react";
import type { HymnSection } from "@/lib/hymns";
import { sectionHeading } from "@/lib/hymn-sections";
import { SectionLyrics } from "@/components/section-lyrics";

export function PresentationSlide({ section, number, title, fontSize, blank = false }: {
  section?: HymnSection;
  number: number;
  title: string;
  fontSize: number;
  blank?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = boxRef.current, text = textRef.current;
    if (!box || !text) return;
    let active = true;
    const fit = () => {
      if (!active || !box.clientWidth || !box.clientHeight) return;
      let low = 8, high = Math.min(160, fontSize * box.clientWidth / 1100);
      // Measure actual wrapped text so long sections stay inside the projection.
      for (let attempt = 0; attempt < 9; attempt++) {
        const size = (low + high) / 2;
        text.style.fontSize = `${size}px`;
        if (text.scrollHeight <= box.clientHeight && text.scrollWidth <= box.clientWidth) low = size;
        else high = size;
      }
      text.style.fontSize = `${low}px`;
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(box);
    void box.ownerDocument.fonts?.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, [section, fontSize, blank]);

  return (
    <div role="img" aria-label={blank ? "Blank audience screen" : section ? `${sectionHeading(section)}: ${section.lines.join(" ")}` : "End of presentation"} style={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", background: "#000", color: "#fff", overflow: "hidden", padding: "3% 4%", boxSizing: "border-box" }}>
      {!blank && <>
        <p style={{ margin: "0 0 2%", textAlign: "center", color: "#aaa", fontSize: "clamp(9px, 1.2vw, 20px)", lineHeight: 1.3 }}>Hymn {number} &middot; {title}</p>
        <div ref={boxRef} style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div ref={textRef} style={{ width: "100%", textAlign: "center", fontWeight: 500, lineHeight: 1.45, overflowWrap: "anywhere" }}>
            {section ? <>
              <p style={{ margin: "0 0 0.8em", fontSize: "0.38em", textTransform: "uppercase", letterSpacing: "0.15em", color: section.type === "refrain" ? "#ffb74d" : "#aaa" }}>{sectionHeading(section)}</p>
              <p style={{ margin: "0.18em 0" }}><SectionLyrics section={section} /></p>
            </> : <p style={{ margin: 0, color: "#aaa" }}>End of hymn</p>}
          </div>
        </div>
      </>}
    </div>
  );
}

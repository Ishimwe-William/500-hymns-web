/* eslint-disable @next/next/no-img-element -- next/og renders native image elements. */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { APP_NAME, SITE_URL } from "@/lib/site";
import type { Hymn } from "@/lib/hymns";

export async function createShareImage(hymn?: Hymn) {
  const logo = await readFile(join(process.cwd(), "public/brand/logo.png"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "54px 64px", background: "#101c19", color: "#fff", borderTop: "12px solid #00ad95" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <img src={`data:image/png;base64,${logo.toString("base64")}`} width={90} height={90} style={{ width: 90, height: 90, flexShrink: 0, borderRadius: "50%" }} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 28, color: "#8de4d4" }}>{APP_NAME}</div>
          <div style={{ fontSize: 22, color: "#a6bdb7" }}>500 Kinyarwanda Hymns</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", color: "#ffbf69", fontSize: 28 }}>{hymn ? `HYMN ${hymn.number}` : "WORSHIP. DEVOTION. COMMUNITY."}</div>
        <div style={{ display: "flex", fontSize: hymn && hymn.title.length > 45 ? 48 : 62, fontWeight: 700, lineHeight: 1.18 }}>{hymn ? hymn.title : "Find a hymn. Lift your voice."}</div>
        <div style={{ display: "flex", fontSize: 27, lineHeight: 1.4, color: "#c5d7d2" }}>{hymn?.origin || "Kinyarwanda lyrics for worship, personal devotion, and community singing."}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 24, borderTop: "1px solid #355149", fontSize: 22, color: "#a6bdb7" }}>
        <div>{new URL(SITE_URL).hostname}</div><div>BunsenPlus</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

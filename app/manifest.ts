import type { MetadataRoute } from "next";
import { APP_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: "Hymns",
    description: SITE_DESCRIPTION,
    start_url: "/hymns",
    scope: "/",
    display: "standalone",
    background_color: "#eff7fd",
    theme_color: "#00ad95",
    lang: "en",
    categories: ["music", "books", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

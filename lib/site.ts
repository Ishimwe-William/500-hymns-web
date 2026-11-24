import type { Metadata } from "next";
import type { Hymn } from "@/lib/hymns";

export const SITE_URL = "https://500-hymns.vercel.app";
export const APP_NAME = "Indirimbo Zo Guhimbaza Imana";
export const HYMNBOOK_CONTEXT = "Seventh-day Adventist Church hymns in Rwanda";
export const SITE_DESCRIPTION = "Explore 500 Kinyarwanda hymns used by the Seventh-day Adventist Church in Rwanda. Read lyrics, search, save favorites, and present songs for worship.";
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export function publicMetadata(title: string, description: string, path: string, imagePath = "/opengraph-image"): Metadata {
  const pageTitle = title === APP_NAME ? `${APP_NAME} | SDA Hymns Rwanda` : `${title} | ${APP_NAME}`;
  const image = { url: absoluteUrl(imagePath), width: 1200, height: 630, alt: pageTitle };
  return {
    title: { absolute: pageTitle }, description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { type: "website", siteName: APP_NAME, title: pageTitle, description, url: absoluteUrl(path), locale: "en_US", alternateLocale: ["rw_RW"], images: [image] },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [image] },
  };
}
export function hymnDescription(hymn: Pick<Hymn, "number" | "title" | "origin" | "lyricsText">) {
  const prefix = `Hymn ${hymn.number}: ${hymn.title}. Seventh-day Adventist hymn in Rwanda.${hymn.origin ? ` Original title: ${hymn.origin}.` : ""}`;
  return `${prefix} ${hymn.lyricsText.replace(/\s+/g, " ").trim() || "Read the Kinyarwanda lyrics and sing along."}`.slice(0, 160).trim();
}
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }

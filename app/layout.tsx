import { APP_NAME, SITE_URL, SITE_DESCRIPTION, HYMNBOOK_CONTEXT, absoluteUrl, jsonLd, publicMetadata } from "@/lib/site";
import { DEVELOPER_URL } from "@/lib/links";
import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa-registration";
import { Nunito_Sans } from "next/font/google";
import { matura } from "@/lib/fonts";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";
import { getCopyrightYear } from "@/lib/copyright-year";

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata: Metadata = {
  ...publicMetadata(APP_NAME, SITE_DESCRIPTION, "/hymns"),
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: "Hymns", statusBarStyle: "default" },
  authors: [{ name: "BunsenPlus", url: DEVELOPER_URL }], creator: "BunsenPlus", publisher: "BunsenPlus", category: "Music",
  keywords: [APP_NAME, HYMNBOOK_CONTEXT, "Seventh-day Adventist Church Rwanda", "SDA hymns Rwanda", "Adventist hymnbook Rwanda", "500 Kinyarwanda Hymns", "Kinyarwanda hymn lyrics", "Indirimbo 500", "Rwandan Christian hymns", "Guhimbaza Imana", "hymnbook", "worship lyrics", "BunsenPlus"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = { themeColor: "#00ad95" };

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem("hymns:theme"));if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolve cached public content before rendering: the initial document must
  // contain the hymnbook, not a page-wide fallback requiring JavaScript.
  const [all, copyrightYear] = await Promise.all([getHymns(), getCopyrightYear()]);
  const hymns = toSummaries(all);
  const audioTracks = all.filter((hymn) => Boolean(hymn.audioUrl?.trim())).map(({ id, number, title, audioUrl }) => ({ id, number, title, audioUrl }));
  return (
    <html lang="en" className={`${nunitoSans.variable} ${matura.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "BunsenPlus", url: DEVELOPER_URL, logo: absoluteUrl("/brand/logo.png"), email: "bunsenplus.org@gmail.com" },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: APP_NAME, alternateName: ["500 Kinyarwanda Hymns", HYMNBOOK_CONTEXT], url: SITE_URL, description: SITE_DESCRIPTION, about: { "@type": "Thing", name: HYMNBOOK_CONTEXT }, spatialCoverage: { "@type": "Country", name: "Rwanda" }, inLanguage: ["rw", "en"], publisher: { "@id": `${SITE_URL}/#organization` } },
        ] }) }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <PwaRegistration />
        <AppShell hymns={hymns} audioTracks={audioTracks} copyrightYear={copyrightYear}>{children}</AppShell>
      </body>
    </html>
  );
}

import { APP_NAME, SITE_URL, SITE_DESCRIPTION, absoluteUrl, jsonLd, publicMetadata } from "@/lib/site";
import { DEVELOPER_URL } from "@/lib/links";
import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa-registration";
import { Suspense, type ReactNode } from "react";
import { Roboto } from "next/font/google";
import { matura } from "@/lib/fonts";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  ...publicMetadata(APP_NAME, SITE_DESCRIPTION, "/hymns"),
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: "Hymns", statusBarStyle: "default" },
  authors: [{ name: "BunsenPlus", url: DEVELOPER_URL }], creator: "BunsenPlus", publisher: "BunsenPlus", category: "Music",
  keywords: [APP_NAME, "500 Kinyarwanda Hymns", "Kinyarwanda hymn lyrics", "Indirimbo 500", "Rwandan Christian hymns", "Guhimbaza Imana", "hymnbook", "worship lyrics", "BunsenPlus"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = { themeColor: "#00ad95" };

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem("hymns:theme"));if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

async function HymnApp({ children }: { children: ReactNode }) {
  const all = await getHymns();
  const hymns = toSummaries(all);
  const audioTracks = all.filter((hymn) => Boolean(hymn.audioUrl?.trim())).map(({ id, number, title, audioUrl }) => ({ id, number, title, audioUrl }));
  return <AppShell hymns={hymns} audioTracks={audioTracks}>{children}</AppShell>;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${roboto.variable} ${matura.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "BunsenPlus", url: DEVELOPER_URL, logo: absoluteUrl("/brand/logo.png"), email: "bunsenplus.org@gmail.com" },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: APP_NAME, alternateName: "500 Kinyarwanda Hymns", url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: ["rw", "en"], publisher: { "@id": `${SITE_URL}/#organization` } },
        ] }) }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <PwaRegistration />
        <Suspense fallback={<div role="status" className="p-8 text-center text-muted">Loading hymnbook...</div>}>
          <HymnApp>{children}</HymnApp>
        </Suspense>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Roboto } from "next/font/google";
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
  title: "500 Kinyarwanda Hymns",
  description: "A digital hymnbook of 500 Kinyarwanda hymns.",
};

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem("hymns:theme"));if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const hymns = toSummaries(await getHymns());
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppShell hymns={hymns}>{children}</AppShell>
      </body>
    </html>
  );
}

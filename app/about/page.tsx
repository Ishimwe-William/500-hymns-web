import { SITE_DESCRIPTION, publicMetadata } from "@/lib/site";
import { DOWNLOAD_APP_URL } from "@/lib/links";
import { matura } from "@/lib/fonts";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { IconBook, IconDownload, IconHeart, IconLogo, IconSearch } from "@/components/icons";
import { version } from "@/package.json";

export const metadata: Metadata = publicMetadata("About", SITE_DESCRIPTION, "/about");
const features = [
  { title: "A collection to treasure", description: "Browse 500 Kinyarwanda hymns used by the Seventh-day Adventist Church in Rwanda, brought together in one digital hymnbook.", icon: IconBook },
  { title: "Find the words you know", description: "Search by hymn number, title, original title, or a phrase from the lyrics.", icon: IconSearch },
  { title: "Keep your favorites close", description: "Save hymns for quick access, revisit recent readings, and choose the text size and theme that suit you.", icon: IconHeart },
];

export default function AboutPage() {
  return (
    <SectionPage title="About" header={
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <IconLogo width={72} height={72} />
          <h2 className={`${matura.className} text-center text-2xl leading-snug text-foreground sm:text-3xl`}>Indirimbo Zo<br />Guhimbaza Imana</h2>
        </div>
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-md lg:text-left">
          <p className="text-sm font-medium text-accent-strong dark:text-accent">Worship. Devotion. Community.</p>
          <p className="mt-2 text-[15px] leading-7 text-muted">A digital collection of 500 Kinyarwanda hymns used by the Seventh-day Adventist Church in Rwanda, ready to read, sing, and share.</p>
        </div>
      </div>
    } sections={[
      { id: "mission", title: "Our purpose", content: <>
        <p>Indirimbo Zo Guhimbaza Imana brings together 500 Kinyarwanda hymns used by the Seventh-day Adventist Church in Rwanda. Our mission is to make these hymns easy to access for church worship, personal devotion, and community singing.</p>
        <p>By making these hymns available in digital format, the project aims to preserve and promote Rwandan spiritual music heritage for everyday use.</p>
      </> },
      { id: "features", title: "Features", content: <div className="divide-y divide-border">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><feature.icon width={21} height={21} /></span>
            <div>
              <h4 className="text-[15px] font-semibold text-foreground">{feature.title}</h4>
              <p className="mt-1">{feature.description}</p>
            </div>
          </div>
        ))}
      </div> },
      { id: "background", title: "Project background", content: <p>This application began as a hobby project to practice React Native development. It has grown into an accessible hymnbook for worship and devotion, including this experience in your browser.</p> },
      { id: "mobile-app", title: "Take the hymnbook with you", content: <>
        <p>The mobile app offers offline access, so the words stay close even without an internet connection.</p>
        {DOWNLOAD_APP_URL && <Link href={DOWNLOAD_APP_URL} className="inline-flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white dark:text-black"><IconDownload width={17} height={17} />Download the app</Link>}
      </> },
      { id: "contact", title: "Connect with BunsenPlus", content: <>
        <p>Share feedback, follow the project, or get in touch.</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "GitHub", href: "https://github.com/Ishimwe-William" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/ishimwe-william-086776192/" },
            { label: "Email", href: "mailto:bunsenplus.org@gmail.com" },
          ].map((link) => <a key={link.label} href={link.href} target={link.href.startsWith("https:") ? "_blank" : undefined} rel="noreferrer" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft">{link.label}</a>)}
        </div>
      </> },
      { id: "privacy", title: "Privacy", content: <>
        <p>Learn how the app handles your information and how to manage your data.</p>
        <Link href="/privacy" className="inline-block font-medium text-accent-strong hover:underline dark:text-accent">Read the privacy policy</Link>
      </> },
      { id: "version", title: "App version", content: <p>BunsenPlus <span className="mx-2" aria-hidden="true">/</span> Version {version}</p> },
    ]} />
  );
}

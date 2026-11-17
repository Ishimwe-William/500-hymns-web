"use client";

import Link from "next/link";
import { IconLogo } from "@/components/icons";
import { matura } from "@/lib/fonts";

export function ErrorState({ title, description, code, onRetry, reloadHome = false }: {
  title: string;
  description: string;
  code?: string;
  onRetry?: () => void;
  reloadHome?: boolean;
}) {
  const homeClass = "inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent-soft";
  return (
    <section aria-labelledby="error-title" className="mx-auto w-full rounded-2xl border border-border bg-card px-6 py-10 text-center sm:px-10 sm:py-14">
      <div className="mb-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <IconLogo width={64} height={64} />
        <p className={`${matura.className} text-center text-xl leading-snug text-foreground`}>Indirimbo Zo<br />Guhimbaza Imana</p>
      </div>
      {code && <p className="mb-2 text-sm font-semibold text-accent-strong dark:text-accent">{code}</p>}
      <h2 id="error-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-muted">{description}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {onRetry && <button type="button" onClick={onRetry} className="rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white dark:text-black">Try again</button>}
        {reloadHome ? <form action="/hymns" method="get"><button type="submit" className={homeClass}>Back to hymns</button></form> : <Link href="/hymns" className={homeClass}>Back to hymns</Link>}
      </div>
      <p className="mt-6 text-xs text-muted">Need help? <a href="mailto:bunsenplus.org@gmail.com" className="font-medium text-accent-strong hover:underline dark:text-accent">Contact BunsenPlus</a></p>
    </section>
  );
}

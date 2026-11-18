"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function AuthCallback() {
  const router = useRouter();
  const exchange = useRef<Promise<void> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    exchange.current ??= (async () => {
      const url = new URL(window.location.href);
      const client = getSupabaseBrowser();
      const code = url.searchParams.get("code");
      if (!client || !code || url.searchParams.has("error")) throw new Error("Sign-in failed");
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw new Error("Sign-in failed");
    })();
    void exchange.current.then(() => { if (active) router.replace("/hymns"); }).catch(() => {
      if (!active) return;
      window.history.replaceState(null, "", "/auth/callback");
      setFailed(true);
    });
    return () => { active = false; };
  }, [router]);
  return <section className="rounded-2xl border border-border bg-card p-8 text-center">
    <h1 className="text-2xl font-bold">{failed ? "Sign-in could not be completed" : "Completing Google sign-in"}</h1>
    <p role={failed ? "alert" : "status"} className="mt-3 text-muted">{failed ? "Please try again in the same browser where you started signing in." : "Please wait while we open your hymnbook."}</p>
    {failed && <Link href="/profile" className="mt-6 inline-block rounded-full bg-accent-strong px-5 py-2 font-medium text-white dark:text-black">Return to sign-in</Link>}
  </section>;
}

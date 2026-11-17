"use client";

import Link from "next/link";
import { useFavorites, useLocalStorage, useRecent } from "@/lib/client-store";
import { IconLogo } from "@/components/icons";

const AUTH_KEY = "hymns:signedIn";

export default function ProfilePage() {
  const [signedInRaw, setSignedIn] = useLocalStorage<boolean>(AUTH_KEY, false);
  const signedIn = Boolean(signedInRaw);
  const { ids } = useFavorites();
  const { entries } = useRecent();

  const signIn = () => setSignedIn(true);
  const signOut = () => setSignedIn(false);

  if (!signedIn) {
    return (
      <div className="flex justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center">
          <div className="flex justify-center">
            <IconLogo width={56} height={56} />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-foreground">
            Take your hymnbook with you
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sign in to sync your favorites, reading preferences, and recently
            opened hymns across all your devices.
          </p>
          <button
            type="button"
            onClick={signIn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-strong px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] dark:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>
          <Link
            href="/hymns"
            className="mt-4 block text-sm font-medium text-accent-strong hover:underline dark:text-accent"
          >
            Continue browsing
          </Link>
          <Link
            href="/about"
            className="mt-6 block text-xs text-muted hover:text-foreground"
          >
            Privacy policy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground">Profile</h2>
        <p className="text-muted">Your account and synced data.</p>
      </header>

      {/* Account card */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-xl font-bold text-accent-ink dark:text-accent-ink">
          G
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            Guest User
          </p>
          <p className="truncate text-sm text-muted">user@gmail.com</p>
          <span className="mt-1 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-ink dark:text-accent-ink">
            Signed in
          </span>
        </div>
      </div>

      {/* Sync info */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Sync information
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Favorites</dt>
            <dd className="font-medium text-foreground">{ids.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Recently opened</dt>
            <dd className="font-medium text-foreground">{entries.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Last sync</dt>
            <dd className="font-medium text-foreground">Just now</dd>
          </div>
        </dl>
        <button
          type="button"
          className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft"
        >
          Sync now
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <Link
          href="/settings"
          className="block text-sm font-medium text-accent-strong hover:underline dark:text-accent"
        >
          Manage settings
        </Link>
        <p className="text-xs leading-relaxed text-muted">
          To delete your account and data, email{" "}
          <span className="font-medium text-foreground">
            privacy@bunsenplus.dev
          </span>{" "}
          from your signed-in address. We will remove your favorites, recents,
          and preferences.
        </p>
        <Link
          href="/about"
          className="inline-block text-sm font-medium text-muted hover:text-foreground"
        >
          Request data deletion →
        </Link>
        <div className="pt-2">
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent-soft"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

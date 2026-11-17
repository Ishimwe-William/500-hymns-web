"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { SectionPage } from "@/components/section-page";

export default function ProfilePage() {
  const { user, loading, checkingRole, isAdmin, busy, error, roleError, configured, signIn, signOut } = useAuth();
  const router = useRouter();
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const handleSignIn = async () => {
    if (await signIn()) router.replace("/hymns");
  };
  const handleSignOut = async () => {
    if (await signOut()) router.replace("/hymns");
  };

  const privacySection = {
    id: "privacy",
    title: "Privacy and data",
    content: <>
      <p>Favorites and reading preferences are saved on this device. For questions about your account or to request data deletion, contact BunsenPlus.</p>
      <a href="mailto:bunsenplus.org@gmail.com" className="inline-block break-all font-medium text-accent-strong hover:underline dark:text-accent">bunsenplus.org@gmail.com</a>
      <div><Link href="/privacy#deletion" className="font-medium text-accent-strong hover:underline dark:text-accent">Privacy and deletion information</Link></div>
    </>,
  };

  if (loading) return <SectionPage title="Profile" description="Your Google account and permissions." sections={[
    { id: "account", title: "Your account", content: <p role="status">Loading your account...</p> },
  ]} />;

  if (!user) return <SectionPage title="Profile" description="Sign in when you need access to your account." sections={[
    { id: "sign-in", title: "Sign in with Google", content: <>
      <p>Everyone can browse and read hymns without signing in. Google sign-in gives approved administrators access to hymn editing.</p>
      <button type="button" onClick={handleSignIn} disabled={busy || !configured} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:text-black">
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
        {busy ? "Signing in..." : "Continue with Google"}
      </button>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!configured && <p role="status" className="text-sm">Sign-in is not available yet. Please try again later.</p>}
      <div><Link href="/hymns" className="font-medium text-accent-strong hover:underline dark:text-accent">Continue browsing hymns</Link></div>
    </> },
    privacySection,
  ]} />;

  return <SectionPage title="Profile" header={
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">Your Google account and permissions.</p>
      </div>
      <div className="flex min-w-0 items-center gap-4 border-t border-border pt-6 md:max-w-[60%] md:border-l md:border-t-0 md:pl-6 md:pt-0">
        {user.photoURL && failedPhotoUrl !== user.photoURL ? (
          <Image src={user.photoURL} alt="Google profile photo" width={64} height={64} unoptimized referrerPolicy="no-referrer" onError={() => setFailedPhotoUrl(user.photoURL)} className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-2xl font-bold text-accent-ink">{(user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="break-words text-base font-semibold text-foreground">{user.displayName ?? "Hymnbook reader"}</p>
          <p className="mt-1 break-all text-sm text-muted">{user.email ?? "No email available"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">{checkingRole ? "Checking permissions..." : roleError ? "Permissions unavailable" : isAdmin ? "Administrator" : "Reader"}</span>
            {isAdmin && <Link href="/admin" className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent-soft">Manage hymns</Link>}
          </div>
        </div>
      </div>
    </div>
  } sections={[
    { id: "account", title: "Your account", content: <>
      <p>You are signed in with Google. Your account ID identifies your account across the hymnbook.</p>
      <dl className="pt-3 text-sm">
        <dt className="font-medium text-foreground">Account ID</dt>
        <dd className="mt-1 break-all font-mono text-xs">{user.uid}</dd>
      </dl>
    </> },
    { id: "permissions", title: "Account permissions", content: <>
      <p>{isAdmin ? "Your account can manage and edit hymns." : "You can browse, search, read, and save hymns. Editing is reserved for approved administrators."}</p>
      {roleError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{roleError}</p>}
    </> },
    privacySection,
    { id: "session", title: "Settings and sign-out", content: <>
      <p>Choose your reading preferences or sign out of your Google account. You can continue browsing hymns after signing out.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/settings" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft">Manage settings</Link>
        <button type="button" onClick={handleSignOut} disabled={busy} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft disabled:opacity-60">{busy ? "Signing out..." : "Sign out"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </> },
  ]} />;
}

"use client";

import { HymnLibraryProvider } from "@/lib/hymn-library";
import { SiteFooter } from "@/components/site-footer";
import { DOWNLOAD_APP_URL } from "@/lib/links";
import { matura } from "@/lib/fonts";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { FavoritesProvider, PlayerProvider, useTheme } from "@/lib/client-store";
import { AudioPlayer } from "@/components/audio-player";
import { SearchModal } from "@/components/search-modal";
import "./site-header.css";
import type { PlayerHymn } from "@/lib/player-queue";
import type { HymnSummary } from "@/lib/hymns";
import {
  IconBook,
  IconClock,
  IconDownload,
  IconHeart,
  IconInfo,
  IconLogo,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSettings,
  IconShield,
  IconSun,
  IconUser,
  IconClose,
  IconLogIn,
  IconLogOut,
} from "@/components/icons";


const NAV = [
  { href: "/hymns", label: "Hymns", icon: IconBook },
  { href: "/favorites", label: "Favorites", icon: IconHeart },
  { href: "/recent", label: "Recent", icon: IconClock },
  { href: "/about", label: "About", icon: IconInfo },
];

const SECONDARY_NAV = [
  { href: "/settings", label: "Settings", icon: IconSettings },
  { href: "/profile", label: "Profile", icon: IconUser },
];

function isActive(pathname: string, href: string) {
  if (href === "/hymns") {
    return pathname === "/hymns" || pathname.startsWith("/hymns/");
  }
  return pathname.startsWith(href);
}

function navLinkClass(pathname: string, href: string) {
  return `header-nav-link flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive(pathname, href)
      ? "bg-accent-soft text-accent-ink dark:text-accent-ink"
      : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
  }`;
}

function DrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, busy, configured, signIn, signOut, error } = useAuth();
  const { theme, toggle } = useTheme();
  const allLinks = [
    ...NAV,
    ...SECONDARY_NAV,
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: IconShield }] : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/hymns"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 pb-6 pt-6"
      >
        <IconLogo />
        <p className={`${matura.className} text-[17px] leading-snug text-center text-foreground`}>
          Indirimbo Zo<br />Guhimbaza Imana
        </p>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {allLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
              isActive(pathname, item.href)
                ? "bg-accent-soft text-accent-ink dark:text-accent-ink"
                : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
            }`}
          >
            <item.icon width={20} height={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-4">
        <button type="button" onClick={toggle} aria-label="Toggle theme" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-muted hover:bg-accent-soft/60 hover:text-foreground">
          {theme === "dark" ? <IconSun width={20} height={20} /> : <IconMoon width={20} height={20} />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button type="button" disabled={loading || busy || !configured} onClick={async () => {
          const succeeded = user ? await signOut() : await signIn();
          if (succeeded) { onNavigate?.(); router.replace("/hymns"); }
        }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-foreground hover:bg-accent-soft/60 disabled:opacity-50">
          {user ? <IconLogOut width={20} height={20} /> : <IconLogIn width={20} height={20} />}
          {busy ? (user ? "Signing out..." : "Signing in...") : user ? "Sign out" : "Sign in with Google"}
        </button>
        {error && <p role="alert" className="px-4 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <Link
          href={DOWNLOAD_APP_URL}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
        >
          <IconDownload width={20} height={20} />
          Download mobile app
        </Link>
      </div>
    </div>
  );
}

function Navbar({
  onMenu,
  hymns,
}: {
  onMenu: () => void;
  hymns: HymnSummary[];
}) {
  const { user, isAdmin, loading, busy, configured, error, signIn, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens the search modal from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onQueryChange = (value: string) => {
    setQ(value);
    setSearchOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchOpen(true);
  };

  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-topbar">
      <div className="header-layout">
        {/* Hamburger (mobile/tablet) */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="header-menu rounded-lg p-2 text-muted hover:bg-accent-soft"
        >
          <IconMenu width={22} height={22} />
        </button>

        {/* Brand */}
        <Link href="/hymns" aria-label="Indirimbo Zo Guhimbaza Imana" className="header-brand">
          <IconLogo width={60} height={60} />
          <span className={`${matura.className} header-brand-name text-center text-foreground`}>
            Indirimbo Zo<br />Guhimbaza Imana
          </span>
        </Link>

        <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search hymns" className="header-search-trigger rounded-lg p-2 text-muted hover:bg-accent-soft hover:text-foreground">
          <IconSearch width={25} height={25} />
        </button>

        {/* Primary nav */}
        <nav aria-label="Main navigation" className="header-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={navLinkClass(pathname, item.href)}
            >
              <item.icon width={17} height={17} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form
          className="header-search"
          onSubmit={submit}
        >
          <div className="header-search-field flex items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-accent-strong focus-within:ring-2 focus-within:ring-accent-soft">
            <IconSearch width={21} height={21} className="shrink-0 text-muted" />
            <input
              value={q}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search hymns…"
              aria-label="Search hymns"
              className="min-w-0 w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted"
            />
          </div>
        </form>

        {/* Theme + profile menu */}
        <div className="header-actions relative">
          <Link
            href={DOWNLOAD_APP_URL}
            aria-label="Download mobile app"
            title="Download mobile app"
            className="header-action header-download rounded-xl text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            <IconDownload width={22} height={22} />
            <span className="header-action-label">App</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="header-action rounded-xl text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            {theme === "dark" ? (
              <IconSun width={22} height={22} />
            ) : (
              <IconMoon width={22} height={22} />
            )}
            <span className="header-action-label">Theme</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="header-action rounded-xl text-foreground transition-colors hover:bg-accent-soft"
            >
              <span className="header-avatar flex items-center justify-center rounded-full bg-accent-soft text-accent-ink">{user?.displayName || user?.email ? <span className="text-sm font-semibold">{(user.displayName ?? user.email ?? "").slice(0, 1).toUpperCase()}</span> : <IconUser width={21} height={21} />}</span>
              <span className="header-action-label">{user ? "Account" : "Login"}</span>
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-3 z-50 w-52 overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-lg">
                  {[
                    { href: "/profile", label: "Profile", icon: IconUser },
                    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: IconShield }] : []),
                    { href: "/settings", label: "Settings", icon: IconSettings },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive(pathname, item.href)
                          ? "bg-accent-soft text-accent-ink dark:text-accent-ink"
                          : "text-foreground hover:bg-accent-soft/60"
                      }`}
                    >
                      <item.icon width={16} height={16} className="text-muted" />
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href={DOWNLOAD_APP_URL}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft/60"
                  >
                    <IconDownload width={16} height={16} className="text-muted" />
                    Download mobile app
                  </Link>
                  <button
                    type="button"
                    disabled={loading || busy || !configured}
                    onClick={async () => {
                      const succeeded = user ? await signOut() : await signIn();
                      if (succeeded) {
                        setMenuOpen(false);
                        router.replace("/hymns");
                      }
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent-soft/60 disabled:cursor-wait disabled:opacity-50"
                  >
                    {user ? <IconLogOut width={16} height={16} className="text-muted" /> : <IconLogIn width={16} height={16} className="text-muted" />}
                    {busy ? (user ? "Signing out..." : "Signing in...") : user ? "Sign out" : "Sign in with Google"}
                  </button>
                  {error && <p role="alert" className="px-4 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <SearchModal
          hymns={hymns}
          query={q}
          onQueryChange={onQueryChange}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </header>
  );
}

export function AppShell({
  children,
  hymns,
  audioTracks,
  copyrightYear,
}: {
  children: ReactNode;
  hymns: HymnSummary[];
  audioTracks: PlayerHymn[];
  copyrightYear: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthProvider>
    <HymnLibraryProvider hymns={hymns}>
    <PlayerProvider tracks={audioTracks}>
      <FavoritesProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Suspense
            fallback={
              <div className="header-placeholder border-b border-border bg-topbar" />
            }
          >
            <Navbar onMenu={() => setMobileOpen(true)} hymns={hymns} />
          </Suspense>

          {/* Mobile/tablet drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar shadow-xl">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="absolute right-3 top-5 z-10 rounded-lg p-2 text-muted hover:bg-accent-soft"
                >
                  <IconClose width={20} height={20} />
                </button>
                <DrawerContent onNavigate={() => setMobileOpen(false)} />
              </aside>
            </div>
          )}

          <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-10">
            <div className="app-content mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <SiteFooter year={copyrightYear} />
          <AudioPlayer />
        </div>
      </FavoritesProvider>
    </PlayerProvider>
    </HymnLibraryProvider>
    </AuthProvider>
  );
}

"use client";

import { SiteFooter } from "@/components/site-footer";
import { DOWNLOAD_APP_URL } from "@/lib/links";
import { matura } from "@/lib/fonts";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { FavoritesProvider, PlayerProvider, useTheme } from "@/lib/client-store";
import { AudioPlayer } from "@/components/audio-player";
import { SearchModal } from "@/components/search-modal";
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
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive(pathname, href)
      ? "bg-accent-soft text-accent-ink dark:text-accent-ink"
      : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
  }`;
}

function DrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
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
  const { user, isAdmin } = useAuth();
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
    <header className="sticky top-0 z-40 border-b border-border bg-topbar">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:h-[72px] lg:px-10">
        {/* Hamburger (mobile/tablet) */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="rounded-lg p-2 text-muted hover:bg-accent-soft md:hidden"
        >
          <IconMenu width={22} height={22} />
        </button>

        {/* Brand */}
        <Link href="/hymns" className="flex shrink-0 items-center gap-2.5">
          <IconLogo />
          <span className={`${matura.className} hidden  text-[15px] leading-snug text-center text-foreground sm:block`}>
            Indirimbo Zo<br />Guhimbaza Imana
          </span>
        </Link>

        {/* Primary nav */}
        <div className="hidden items-center gap-1 md:flex lg:ml-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={navLinkClass(pathname, item.href)}
            >
              <item.icon width={17} height={17} />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Search */}
        <form
          className="ml-auto hidden w-full max-w-xs md:block lg:max-w-sm"
          onSubmit={submit}
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <IconSearch width={16} height={16} className="shrink-0 text-muted" />
            <input
              value={q}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search hymns…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
          </div>
        </form>

        {/* Theme + profile menu */}
        <div className="relative ml-auto flex items-center gap-1.5 md:ml-0">
          <Link
            href={DOWNLOAD_APP_URL}
            aria-label="Download mobile app"
            title="Download mobile app"
            className="hidden rounded-full p-2.5 text-muted transition-colors hover:bg-accent-soft hover:text-foreground lg:block"
          >
            <IconDownload width={19} height={19} />
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full p-2.5 text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            {theme === "dark" ? (
              <IconSun width={19} height={19} />
            ) : (
              <IconMoon width={19} height={19} />
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent-ink transition-transform hover:scale-105 dark:text-accent-ink"
            >
              {user?.displayName || user?.email ? <span className="text-sm font-semibold">{(user.displayName ?? user.email ?? "").slice(0, 1).toUpperCase()}</span> : <IconUser width={17} height={17} />}
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-lg">
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      <form
        className="border-t border-border/60 px-4 py-2 md:hidden"
        onSubmit={submit}
      >
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <IconSearch width={16} height={16} className="shrink-0 text-muted" />
          <input
            value={q}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search hymns…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
      </form>

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
}: {
  children: ReactNode;
  hymns: HymnSummary[];
  audioTracks: PlayerHymn[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthProvider>
    <PlayerProvider tracks={audioTracks}>
      <FavoritesProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Suspense
            fallback={
              <div className="h-16 border-b border-border bg-topbar lg:h-[72px]" />
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
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <SiteFooter />
          <AudioPlayer />
        </div>
      </FavoritesProvider>
    </PlayerProvider>
    </AuthProvider>
  );
}

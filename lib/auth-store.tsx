"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { isSupabaseConfigured, readProfileRole } from "@/lib/supabase";
import { authErrorMessage, INITIAL_SESSION, observeAuthSession, type AuthSession, type AccountUser } from "@/lib/auth-session";

interface AuthContextValue extends AuthSession {
  busy: boolean;
  error: string | null;
  configured: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
  getAccessToken: (expectedUid?: string) => Promise<string>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
const metadataText = (value: unknown) => typeof value === "string" && value.trim() ? value : null;
function accountUser(user?: User | null): AccountUser | null {
  if (!user) return null;
  return { uid: user.id, email: user.email ?? null,
    displayName: metadataText(user.user_metadata.full_name) ?? metadataText(user.user_metadata.name),
    photoURL: metadataText(user.user_metadata.avatar_url) ?? metadataText(user.user_metadata.picture) };
}

export async function currentAccessToken(expectedUid?: string) {
  const client = getSupabaseBrowser();
  if (!client) throw new Error("Sign-in is unavailable.");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session || (expectedUid && data.session.user.id !== expectedUid)) throw new Error("Please sign in again.");
  return data.session.access_token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(INITIAL_SESSION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => observeAuthSession({
    watchUser: (next, failed) => {
      const client = getSupabaseBrowser();
      if (!client) { next(null); return () => {}; }
      let stopped = false, eventSeen = false;
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        eventSeen = true;
        if (!stopped) next(accountUser(session?.user));
      });
      void client.auth.getSession().then(({ data, error }) => {
        if (stopped || eventSeen) return;
        if (error) failed(); else next(accountUser(data.session?.user));
      }).catch(() => { if (!stopped && !eventSeen) failed(); });
      return () => { stopped = true; data.subscription.unsubscribe(); };
    },
    watchRole: (uid, next, failed) => {
      let stopped = false, pending = false;
      const check = async () => {
        if (stopped || pending) return;
        pending = true;
        try {
          const role = await readProfileRole(uid, await currentAccessToken(uid));
          if (!stopped) next(role, false);
        } catch (error) { if (!stopped) failed(error); }
        finally { pending = false; }
      };
      // Auth callbacks must return before calling other SDK auth methods.
      const initial = window.setTimeout(() => void check(), 0);
      const timer = window.setInterval(() => void check(), 30000);
      const focus = () => { void check(); };
      window.addEventListener("focus", focus);
      return () => { stopped = true; window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("focus", focus); };
    },
  }, setSession), []);

  const signIn = async () => {
    const client = getSupabaseBrowser();
    if (!client || busy) return false;
    setBusy(true); setError(null);
    try {
      const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: {
        redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      } });
      if (error || !data.url) throw error ?? new Error("Sign-in unavailable");
      window.location.assign(data.url);
      // The OAuth callback completes sign-in; callers must not redirect early.
      return false;
    } catch (error) { setError(authErrorMessage(error)); return false; }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    const client = getSupabaseBrowser();
    if (!client || busy) return false;
    setBusy(true); setError(null);
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      setSession({ ...INITIAL_SESSION, loading: false });
      return true;
    } catch (error) { setError(authErrorMessage(error)); return false; }
    finally { setBusy(false); }
  };
  return <AuthContext.Provider value={{ ...session, busy, error, configured: isSupabaseConfigured, signIn, signOut, getAccessToken: currentAccessToken }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

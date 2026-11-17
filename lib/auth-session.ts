import type { User } from "firebase/auth";

export interface AuthSession {
  user: User | null;
  loading: boolean;
  checkingRole: boolean;
  isAdmin: boolean;
  roleError: string | null;
}

interface SessionSources {
  watchUser: (next: (user: User | null) => void, error: () => void) => () => void;
  watchRole: (uid: string, next: (role: unknown, fromCache: boolean) => void, error: () => void) => () => void;
}

export const INITIAL_SESSION: AuthSession = {
  user: null, loading: true, checkingRole: false, isAdmin: false, roleError: null,
};

/** Ignore role responses from previous accounts and revoke access on errors. */
export function observeAuthSession(sources: SessionSources, publish: (session: AuthSession) => void) {
  let generation = 0;
  let closed = false;
  let stopRole: (() => void) | undefined;
  const stopUser = sources.watchUser((user) => {
    if (closed) return;
    const current = ++generation;
    stopRole?.();
    stopRole = undefined;
    const session = { user, loading: false, checkingRole: Boolean(user), isAdmin: false, roleError: null };
    publish(session);
    if (!user) return;
    stopRole = sources.watchRole(user.uid, (role, fromCache) => {
      if (closed || current !== generation) return;
      publish({ ...session, checkingRole: fromCache, isAdmin: !fromCache && role === "admin" });
    }, () => {
      if (closed || current !== generation) return;
      publish({ ...session, checkingRole: false, roleError: "Your account permissions could not be verified. Check your connection and try again." });
    });
  }, () => {
    if (closed) return;
    generation++;
    stopRole?.();
    publish({ ...INITIAL_SESSION, loading: false, roleError: "Your sign-in session could not be loaded. Please try again." });
  });
  return () => { closed = true; generation++; stopRole?.(); stopUser(); };
}

export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  switch (code) {
    case "auth/popup-closed-by-user": return "Sign-in was cancelled. You can try again.";
    case "auth/cancelled-popup-request": return "Another sign-in window is already open.";
    case "auth/popup-blocked": return "Allow pop-ups for this site, then try signing in again.";
    case "auth/unauthorized-domain": return "Sign-in is not enabled for this website address yet.";
    case "auth/operation-not-allowed": return "Google sign-in has not been enabled for this app yet.";
    case "auth/network-request-failed": return "Unable to connect. Check your internet connection and try again.";
    default: return "We could not complete your request. Please try again.";
  }
}

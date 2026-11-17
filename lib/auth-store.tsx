"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db, getFirebaseAuth } from "@/lib/firebase";
import { authErrorMessage, INITIAL_SESSION, observeAuthSession, type AuthSession } from "@/lib/auth-session";

interface AuthContextValue extends AuthSession {
  busy: boolean;
  error: string | null;
  configured: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(INITIAL_SESSION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => observeAuthSession({
    watchUser: (next, failed) => {
      const auth = getFirebaseAuth();
      if (!auth) { next(null); return () => {}; }
      return onAuthStateChanged(auth, next, failed);
    },
    watchRole: (uid, next, failed) => {
      if (!db) { failed(); return () => {}; }
      return onSnapshot(doc(db, "users", uid), { includeMetadataChanges: true }, (snapshot) => {
        next(snapshot.exists() ? snapshot.data().role : undefined, snapshot.metadata.fromCache);
      }, failed);
    },
  }, setSession), []);

  const signIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth || busy) return false;
    setBusy(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      return true;
    } catch (error) { setError(authErrorMessage(error)); return false; }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth || busy) return false;
    setBusy(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setSession({ ...INITIAL_SESSION, loading: false });
      return true;
    } catch (error) { setError(authErrorMessage(error)); return false; }
    finally { setBusy(false); }
  };

  return <AuthContext.Provider value={{ ...session, busy, error, configured: Boolean(db), signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import type { ReactNode } from "react";

export function AdminAccess({ children }: { children: ReactNode }) {
  const { user, loading, checkingRole, isAdmin, roleError } = useAuth();
  if (loading || checkingRole) return <p role="status" className="py-12 text-center text-muted">Checking access...</p>;
  if (isAdmin) return children;
  return (
    <section className="rounded-2xl border border-border bg-card p-8">
      <h2 className="text-2xl font-bold text-foreground">{user ? "Admin access required" : "Sign in to continue"}</h2>
      <p className="mt-3 text-sm text-muted">{roleError ?? (user ? "Your account does not have permission to manage hymns." : "Sign in with an approved administrator account to manage hymns.")}</p>
      <Link href={user ? "/hymns" : "/profile"} className="mt-5 inline-block rounded-full bg-accent-strong px-5 py-2.5 text-sm font-medium text-white dark:text-black">{user ? "Back to hymns" : "Continue to sign in"}</Link>
    </section>
  );
}

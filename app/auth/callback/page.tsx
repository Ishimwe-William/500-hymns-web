import type { Metadata } from "next";
import { AuthCallback } from "@/components/auth-callback";

export const metadata: Metadata = { title: "Google sign-in", robots: { index: false, follow: false } };
export default function AuthCallbackPage() { return <AuthCallback />; }

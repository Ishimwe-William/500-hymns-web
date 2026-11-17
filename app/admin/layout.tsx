import type { Metadata } from "next";
import { AdminAccess } from "@/components/admin-access";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAccess>{children}</AdminAccess>;
}

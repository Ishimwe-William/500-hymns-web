import { AdminAccess } from "@/components/admin-access";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAccess>{children}</AdminAccess>;
}

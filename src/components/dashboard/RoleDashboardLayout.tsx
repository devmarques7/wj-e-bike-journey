import { ReactNode } from "react";
import UnifiedDashboardLayout from "./UnifiedDashboardLayout";

/**
 * Single entry point for any "in-dashboard" page.
 * Always renders the UnifiedDashboardLayout; nav/branding/role badge are
 * resolved dynamically via the useDashboardNav() hook based on the user role.
 */
export default function RoleDashboardLayout({ children }: { children: ReactNode }) {
  return <UnifiedDashboardLayout>{children}</UnifiedDashboardLayout>;
}
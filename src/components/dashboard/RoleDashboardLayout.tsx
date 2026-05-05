import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboardLayout from "./AdminDashboardLayout";
import StaffDashboardLayout from "./StaffDashboardLayout";
import DashboardLayout from "./DashboardLayout";

/**
 * Single entry point for any "in-dashboard" page.
 * Picks the correct shell (header + footer + bg) based on the user's role.
 */
export default function RoleDashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role ?? "member";

  if (role === "admin") return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
  if (role === "staff") return <StaffDashboardLayout>{children}</StaffDashboardLayout>;
  return <DashboardLayout>{children}</DashboardLayout>;
}
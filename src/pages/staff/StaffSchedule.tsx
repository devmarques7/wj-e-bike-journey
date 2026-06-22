import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import RoleDashboardLayout from "@/components/dashboard/RoleDashboardLayout";
import StaffCalendarHeatmap from "@/components/dashboard/StaffCalendarHeatmap";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function StaffSchedule() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "staff") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <RoleDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6 h-full">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-wj-green" />
            <h1 className="text-xl sm:text-2xl font-light text-foreground">
              Schedule
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly workload overview and task distribution
          </p>
        </motion.div>

        {/* Calendar Heatmap */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full min-h-[500px]">
          <div className="col-span-12 h-full">
            <StaffCalendarHeatmap />
          </div>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}

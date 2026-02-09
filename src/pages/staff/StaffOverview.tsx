import { motion } from "framer-motion";
import { Wrench, Calendar, Star, Clock } from "lucide-react";
import StaffDashboardLayout from "@/components/dashboard/StaffDashboardLayout";
import StaffKPICard from "@/components/dashboard/StaffKPICard";
import StaffTasksTable from "@/components/dashboard/StaffTasksTable";
import ShiftTracker from "@/components/dashboard/ShiftTracker";
import StaffCalendarHeatmap from "@/components/dashboard/StaffCalendarHeatmap";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const kpiData = [
  {
    label: "Tasks Completed",
    value: "12",
    change: "+3 today",
    trend: "up" as const,
    icon: Wrench,
  },
  {
    label: "Appointments Today",
    value: "5",
    change: "2 remaining",
    trend: "neutral" as const,
    icon: Calendar,
  },
  {
    label: "Avg. Rating",
    value: "4.8",
    change: "+0.2 this week",
    trend: "up" as const,
    icon: Star,
  },
  {
    label: "Avg. Service Time",
    value: "52m",
    change: "-8m vs target",
    trend: "up" as const,
    icon: Clock,
  },
];

export default function StaffOverview() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "staff") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <StaffDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <h1 className="text-xl sm:text-2xl font-light text-foreground">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's your workshop overview for today
          </p>
        </motion.div>

        {/* KPI Cards - 12 Column Grid (3 each) */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {kpiData.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <StaffKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Main Content Grid - 12 Columns */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Today's Tasks Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <StaffTasksTable />
          </div>

          {/* Right Sidebar - 4 columns (stacked) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            {/* Shift Tracker */}
            <div className="min-h-[200px]">
              <ShiftTracker />
            </div>

            {/* Calendar Heatmap */}
            <div className="flex-1 min-h-[280px]">
              <StaffCalendarHeatmap />
            </div>
          </div>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}
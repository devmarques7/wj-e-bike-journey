import { motion } from "framer-motion";
import { Wrench, Calendar, Star, Clock } from "lucide-react";
import StaffDashboardLayout from "@/components/dashboard/StaffDashboardLayout";
import StaffKPICard from "@/components/dashboard/StaffKPICard";
import StaffTodayTasks from "@/components/dashboard/StaffTodayTasks";
import StaffClientFeedback from "@/components/dashboard/StaffClientFeedback";
import StaffSchedulePreview from "@/components/dashboard/StaffSchedulePreview";
import StaffWorkloadMeter from "@/components/dashboard/StaffWorkloadMeter";
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
          {/* Today's Tasks - 5 columns */}
          <div className="col-span-12 lg:col-span-5">
            <StaffTodayTasks />
          </div>

          {/* Middle Section - 3 columns (stacked) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:gap-6">
            <StaffWorkloadMeter
              currentLoad={75}
              weeklyHours={32}
              targetHours={40}
              completedToday={2}
              totalToday={5}
            />
            <StaffSchedulePreview />
          </div>

          {/* Client Feedback - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <StaffClientFeedback />
          </div>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}

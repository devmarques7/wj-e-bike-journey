import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ServiceAIAssistant from "@/components/dashboard/ServiceAIAssistant";
import ServiceAppointmentsList from "@/components/dashboard/ServiceAppointmentsList";
import ServiceCalendarCompact from "@/components/dashboard/ServiceCalendarCompact";
import ServiceRequestCard from "@/components/dashboard/ServiceRequestCard";
import ServiceCountdown from "@/components/dashboard/ServiceCountdown";
import ServiceActionsGrid from "@/components/dashboard/ServiceActionsGrid";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ServiceDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* AI Assistant Section - Above the Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ServiceAIAssistant />
        </motion.div>

        {/* 12 Column Grid Layout */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Appointments List - Columns 1-5 */}
          <div className="col-span-12 lg:col-span-5">
            <ServiceAppointmentsList />
          </div>

          {/* Urgent Service + Calendar Stacked - Columns 6-8 (3 cols) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:gap-6">
            <ServiceRequestCard />
            <ServiceCalendarCompact />
          </div>

          {/* Service Health / Countdown - Columns 9-12 (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <ServiceCountdown />
          </div>
        </div>

        {/* Service Actions Grid - Below */}
        <ServiceActionsGrid />
      </div>
    </DashboardLayout>
  );
}

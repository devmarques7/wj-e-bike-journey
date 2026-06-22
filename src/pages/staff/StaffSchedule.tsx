import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Wrench, CheckCircle2, Clock, Activity } from "lucide-react";
import { Navigate } from "react-router-dom";
import RoleDashboardLayout from "@/components/dashboard/RoleDashboardLayout";
import StaffKPICard from "@/components/dashboard/StaffKPICard";
import StaffCalendarHeatmap from "@/components/dashboard/StaffCalendarHeatmap";
import StaffWorkloadMeter from "@/components/dashboard/StaffWorkloadMeter";
import AppointmentsTableCard from "@/components/dashboard/scheduling/AppointmentsTableCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSchedulingData } from "@/hooks/scheduling/useSchedulingData";

export default function StaffSchedule() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { appointments } = useSchedulingData();

  const mineUserId = user?.id ?? "";
  const mine = useMemo(
    () => appointments.filter((a) => a.assigned_mechanic_id === mineUserId),
    [appointments, mineUserId],
  );

  const kpis = useMemo(() => {
    const total = mine.length;
    const inProgress = mine.filter((a) => a.status === "in_progress").length;
    const completed = mine.filter((a) => a.status === "completed").length;
    const durs = mine.filter((a) => a.duration_minutes);
    const avg = durs.length
      ? Math.round(durs.reduce((acc, a) => acc + (a.duration_minutes ?? 0), 0) / durs.length)
      : 0;
    return { total, inProgress, completed, avg };
  }, [mine]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "staff") return <Navigate to="/dashboard" replace />;

  const kpiData = [
    {
      label: "My Appointments",
      value: String(kpis.total),
      change: `${kpis.total - kpis.completed} remaining`,
      trend: "neutral" as const,
      icon: CalendarDays,
    },
    {
      label: "In Progress",
      value: String(kpis.inProgress),
      change: kpis.inProgress > 0 ? "active now" : "none active",
      trend: kpis.inProgress > 0 ? ("up" as const) : ("neutral" as const),
      icon: Wrench,
    },
    {
      label: "Completed",
      value: String(kpis.completed),
      change: "today",
      trend: "up" as const,
      icon: CheckCircle2,
    },
    {
      label: "Avg. Service Time",
      value: `${kpis.avg}m`,
      change: kpis.avg ? "across my tasks" : "no data",
      trend: "neutral" as const,
      icon: Clock,
    },
  ];

  const completionRate = kpis.total ? Math.round((kpis.completed / kpis.total) * 100) : 0;

  return (
    <RoleDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-wj-green" />
              <h1 className="text-xl sm:text-2xl font-light text-foreground">My Schedule</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Personal workload, assignments and task distribution
            </p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {kpiData.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <StaffKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Main Grid — Appointments (mine) + Workload sidebar */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8 min-h-[500px]">
            <AppointmentsTableCard
              mineOnlyMechanicId={mineUserId}
              title="My Appointments"
            />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            <StaffWorkloadMeter
              currentLoad={completionRate}
              weeklyHours={32}
              targetHours={40}
              completedToday={kpis.completed}
              totalToday={kpis.total}
            />
            <div className="flex-1 min-h-[420px]">
              <StaffCalendarHeatmap />
            </div>
          </div>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}

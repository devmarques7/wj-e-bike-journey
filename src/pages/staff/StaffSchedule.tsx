import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Wrench,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Layers,
  CalendarDays,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import RoleDashboardLayout from "@/components/dashboard/RoleDashboardLayout";
import StaffKPICard from "@/components/dashboard/StaffKPICard";
import StaffCalendarHeatmap from "@/components/dashboard/StaffCalendarHeatmap";
import StaffWorkloadMeter from "@/components/dashboard/StaffWorkloadMeter";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSchedulingData, type AppointmentRow } from "@/hooks/scheduling/useSchedulingData";
import AppointmentActionsMenu from "@/components/dashboard/scheduling/AppointmentActionsMenu";
import AppointmentCompletionDrawer from "@/components/dashboard/scheduling/AppointmentCompletionDrawer";
import AppointmentReviewHistoryDialog from "@/components/dashboard/scheduling/AppointmentReviewHistoryDialog";
import FloatingActiveAppointment from "@/components/dashboard/scheduling/FloatingActiveAppointment";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const formatRelative = (iso: string | null, t: (k: string, o?: any) => string) => {
  if (!iso) return t("workshop.rel.no_record");
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("workshop.rel.just_now");
  if (mins < 60) return t("workshop.rel.min", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("workshop.rel.hour", { n: hrs });
  const days = Math.floor(hrs / 24);
  return t("workshop.rel.day", { n: days });
};

const formatAbsolute = (iso: string | null, locale: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string, t: (k: string) => string) => {
  const base = "border font-normal text-[10px] gap-1 pl-1.5 pr-2 py-0.5";
  const dot = "inline-block w-1.5 h-1.5 rounded-full";
  const cls = `${base} bg-muted/30 text-foreground/80 border-border/40`;
  switch (status) {
    case "completed":
      return <Badge className={cls}><span className={`${dot} bg-wj-green`} /> {t("workshop.status.completed")}</Badge>;
    case "confirmed":
      return <Badge className={cls}><span className={`${dot} bg-wj-green/70`} /> {t("workshop.status.confirmed")}</Badge>;
    case "in_progress":
      return <Badge className={cls}><span className={`${dot} bg-wj-green animate-pulse`} /> {t("workshop.status.in_progress")}</Badge>;
    case "pending":
      return <Badge className={cls}><span className={`${dot} bg-amber-400`} /> {t("workshop.status.pending")}</Badge>;
    case "rescheduled":
      return <Badge className={cls}><span className={`${dot} bg-amber-400`} /> {t("workshop.status.rescheduled")}</Badge>;
    case "canceled":
      return <Badge className={cls}><span className={`${dot} bg-red-500`} /> {t("workshop.status.canceled")}</Badge>;
    case "no_show":
      return <Badge className={cls}><span className={`${dot} bg-red-500/70`} /> {t("workshop.status.no_show")}</Badge>;
    default:
      return <Badge className={cls}><span className={`${dot} bg-muted-foreground/60`} /> {status}</Badge>;
  }
};

export default function StaffSchedule() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("day");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "ongoing" | "completed">("all");
  const [groupBy, setGroupBy] = useState<"none" | "status" | "service" | "plan">("none");
  const [sortAsc, setSortAsc] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [completionTarget, setCompletionTarget] = useState<AppointmentRow | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AppointmentRow | null>(null);
  const {
    loading,
    appointments,
    serviceTypes,
    mechanics,
    updateAppointmentStatus,
    updateAppointmentFields,
    rescheduleAppointment,
    cancelAppointment,
    deleteAppointment,
    refetch,
  } = useSchedulingData();

  const mineUserId = user?.id ?? "";

  // Only my own appointments
  const mine = useMemo(
    () => appointments.filter((a) => a.assigned_mechanic_id === mineUserId),
    [appointments, mineUserId],
  );

  const filteredSorted = useMemo(() => {
    const matchStatus = (s: string) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "pending") return s === "pending" || s === "confirmed" || s === "rescheduled";
      if (statusFilter === "ongoing") return s === "in_progress";
      if (statusFilter === "completed") return s === "completed";
      return true;
    };
    const arr = mine.filter((a) => matchStatus(a.status));
    arr.sort((a, b) => {
      const cmp = a.scheduled_start_time.localeCompare(b.scheduled_start_time);
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [mine, statusFilter, sortAsc]);

  const groupedAppointments = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "", items: filteredSorted }];
    const map = new Map<string, { key: string; label: string; items: AppointmentRow[] }>();
    const labelFor = (a: AppointmentRow): { key: string; label: string } => {
      switch (groupBy) {
        case "status":
          return { key: a.status, label: t(`workshop.status.${a.status}`, a.status) };
        case "service":
          return { key: a.service_type_id ?? "none", label: a.service_name ?? t("workshop.cols.no_plan") };
        case "plan":
          return { key: a.plan_name ?? "none", label: a.plan_name ?? t("workshop.cols.no_plan") };
        default:
          return { key: "all", label: "" };
      }
    };
    for (const a of filteredSorted) {
      const { key, label } = labelFor(a);
      const g = map.get(key) ?? { key, label, items: [] };
      g.items.push(a);
      map.set(key, g);
    }
    return Array.from(map.values());
  }, [filteredSorted, groupBy, t]);

  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "staff") return <Navigate to="/dashboard" replace />;

  // KPIs (mine)
  const totalMine = mine.length;
  const inProgress = mine.filter((a) => a.status === "in_progress").length;
  const completed = mine.filter((a) => a.status === "completed").length;
  const durs = mine.filter((a) => a.duration_minutes);
  const avgDuration = durs.length
    ? durs.reduce((acc, a) => acc + (a.duration_minutes ?? 0), 0) / durs.length
    : 0;

  const activeAppointment =
    mine.find((a) => a.status === "in_progress" && a.work_started_at) ?? null;

  // Weekly hours from my completed/in_progress appointments
  const weeklyHours = Math.round(
    mine
      .filter((a) => a.status === "completed" || a.status === "in_progress")
      .reduce((acc, a) => acc + (a.duration_minutes ?? 0), 0) / 60,
  );
  const completionRate = totalMine ? Math.round((completed / totalMine) * 100) : 0;

  const kpiData = [
    { label: "My Appointments", value: String(totalMine), change: `${totalMine - completed} remaining`, trend: "neutral" as const, icon: Calendar },
    { label: "In Progress", value: String(inProgress), change: inProgress > 0 ? "active now" : "none active", trend: inProgress > 0 ? ("up" as const) : ("neutral" as const), icon: Wrench },
    { label: "Completed", value: String(completed), change: "today", trend: "up" as const, icon: CheckCircle2 },
    { label: "Avg. Service Time", value: `${Math.round(avgDuration)}m`, change: avgDuration ? "across my tasks" : "no data", trend: "neutral" as const, icon: Clock },
  ];

  // Restrict actions menu: staff can only act on their own appointments — they already are mine.
  // We omit assignment editing (no mechanics list passed).

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

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Appointments Table - 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden h-full flex flex-col"
            >
              <div className="p-4 border-b border-border/30">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">My Appointments</h3>
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="day" className="text-xs">{t("workshop.appts.day")}</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs" disabled>{t("workshop.appts.week")}</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs" disabled>{t("workshop.appts.month")}</TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <TabsList className="bg-muted/40 h-8">
                      <TabsTrigger value="all" className="text-[11px] h-6 px-2.5">{t("workshop.appts.all")}</TabsTrigger>
                      <TabsTrigger value="pending" className="text-[11px] h-6 px-2.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                        {t("workshop.appts.pending")}
                      </TabsTrigger>
                      <TabsTrigger value="ongoing" className="text-[11px] h-6 px-2.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-wj-green animate-pulse mr-1.5" />
                        {t("workshop.appts.ongoing")}
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-[11px] h-6 px-2.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-wj-green mr-1.5" />
                        {t("workshop.appts.completed")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                        <SelectTrigger className="h-8 text-[11px] border-border/40 w-[150px]">
                          <SelectValue placeholder={t("workshop.appts.group_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">{t("workshop.appts.group_none")}</SelectItem>
                          <SelectItem value="status" className="text-xs">{t("workshop.appts.group_status")}</SelectItem>
                          <SelectItem value="service" className="text-xs">{t("workshop.appts.group_service")}</SelectItem>
                          <SelectItem value="plan" className="text-xs">{t("workshop.appts.group_plan")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px] border-border/40 gap-1.5"
                      onClick={() => setSortAsc((v) => !v)}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {t("workshop.appts.sort_time")} {sortAsc ? "↑" : "↓"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("workshop.appts.loading")}
                  </div>
                ) : filteredSorted.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {t("workshop.appts.empty")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium w-[80px]">{t("workshop.cols.time")}</TableHead>
                        <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">{t("workshop.cols.customer")}</TableHead>
                        <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">{t("workshop.cols.plan")}</TableHead>
                        <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">{t("workshop.cols.service")}</TableHead>
                        <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">{t("workshop.cols.status")}</TableHead>
                        <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium text-right w-[80px]">{t("workshop.cols.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedAppointments.map((group) => (
                        <Fragment key={`g-${group.key}`}>
                          {groupBy !== "none" && (
                            <TableRow
                              className="border-border/30 bg-muted/20 hover:bg-muted/30 cursor-pointer"
                              onClick={() => toggleGroup(group.key)}
                            >
                              <TableCell colSpan={6} className="py-2">
                                <div className="flex items-center gap-2 text-xs">
                                  {collapsedGroups[group.key] ? (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className="font-medium text-foreground">{group.label}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {group.items.length} {group.items.length === 1 ? t("workshop.appts.item_one") : t("workshop.appts.item_other")}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {!collapsedGroups[group.key] &&
                            group.items.map((apt) => (
                              <TableRow
                                key={apt.id}
                                className="border-border/20 hover:bg-muted/30 transition-colors"
                              >
                                <TableCell className="text-xs font-medium align-middle">
                                  <div className="flex items-center gap-1.5">
                                    <span className="tabular-nums">{apt.scheduled_start_time.slice(0, 5)}</span>
                                    {apt.priority === "vip" && (
                                      <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30">VIP</Badge>
                                    )}
                                    {apt.priority === "emergency" && (
                                      <Badge className="text-[9px] h-4 px-1.5 bg-red-500/15 text-red-400 border-red-500/30">SOS</Badge>
                                    )}
                                  </div>
                                  {apt.duration_minutes ? (
                                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                                      {apt.duration_minutes}{t("workshop.cols.min")}
                                    </span>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-xs align-middle">
                                  <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Avatar className="h-8 w-8 border border-border/30 cursor-default">
                                          <AvatarFallback className="text-[10px] bg-muted/50">
                                            {(apt.customer_name ?? apt.customer_email ?? "?")
                                              .split(" ")
                                              .map((s) => s[0])
                                              .slice(0, 2)
                                              .join("")
                                              .toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs">
                                        <div className="font-medium">{apt.customer_name ?? "—"}</div>
                                        {apt.customer_email && (
                                          <div className="text-muted-foreground text-[10px]">{apt.customer_email}</div>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="align-middle">
                                  {apt.plan_name ? (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                                      style={{
                                        color: apt.plan_color ?? "#9ca3af",
                                        borderColor: `${apt.plan_color ?? "#9ca3af"}40`,
                                        backgroundColor: `${apt.plan_color ?? "#9ca3af"}15`,
                                      }}
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: apt.plan_color ?? "#9ca3af" }}
                                      />
                                      {apt.plan_name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/60">{t("workshop.cols.no_plan")}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs align-middle">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-block w-1.5 h-6 rounded-full shrink-0"
                                      style={{ backgroundColor: apt.service_color ?? "#9ca3af" }}
                                    />
                                    <span className="truncate">{apt.service_name ?? "—"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="align-middle">
                                  <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex cursor-default">{getStatusBadge(apt.status, t)}</span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="h-3 w-3" />
                                          <span className="font-medium">{formatRelative(apt.updated_at, t)}</span>
                                        </div>
                                        <div className="text-muted-foreground text-[10px]">
                                          {t("workshop.status_tip.last_change")}: {formatAbsolute(apt.updated_at, i18n.language)}
                                        </div>
                                        {apt.work_started_at && (
                                          <div className="text-muted-foreground text-[10px]">
                                            {t("workshop.status_tip.started")}: {formatAbsolute(apt.work_started_at, i18n.language)}
                                          </div>
                                        )}
                                        {apt.work_ended_at && (
                                          <div className="text-muted-foreground text-[10px]">
                                            {t("workshop.status_tip.ended")}: {formatAbsolute(apt.work_ended_at, i18n.language)}
                                          </div>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right align-middle">
                                  <AppointmentActionsMenu
                                    appointment={apt}
                                    mechanics={[]}
                                    serviceTypes={serviceTypes}
                                    onStart={() => updateAppointmentStatus(apt.id, "in_progress")}
                                    onComplete={() => setCompletionTarget(apt)}
                                    onReviewHistory={() => setReviewTarget(apt)}
                                    onExtendTime={async (extra) => {
                                      const newDuration = (apt.duration_minutes ?? 0) + extra;
                                      await updateAppointmentFields(apt.id, { duration_minutes: newDuration });
                                      toast.warning(t("workshop.actions.extra_added", { n: extra }));
                                    }}
                                    onUpdateFields={updateAppointmentFields}
                                    onReschedule={rescheduleAppointment}
                                    onCancel={cancelAppointment}
                                    onDelete={deleteAppointment}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </motion.div>
          </div>

          {/* Workload sidebar - 4 cols */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            <StaffWorkloadMeter
              currentLoad={completionRate}
              weeklyHours={weeklyHours}
              targetHours={40}
              completedToday={completed}
              totalToday={totalMine}
            />
            <div className="flex-1 min-h-[420px]">
              <StaffCalendarHeatmap />
            </div>
          </div>
        </div>

        <AppointmentCompletionDrawer
          appointment={completionTarget}
          open={!!completionTarget}
          onOpenChange={(v) => { if (!v) setCompletionTarget(null); }}
          onCompleted={() => { setCompletionTarget(null); refetch(); }}
        />

        <AppointmentReviewHistoryDialog
          appointment={reviewTarget}
          open={!!reviewTarget}
          onOpenChange={(v) => { if (!v) setReviewTarget(null); }}
        />

        <FloatingActiveAppointment
          appointment={activeAppointment}
          onOpen={() => activeAppointment && setCompletionTarget(activeAppointment)}
        />
      </div>
    </RoleDashboardLayout>
  );
}
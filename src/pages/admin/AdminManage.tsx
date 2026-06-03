import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Settings, 
  Users, 
  Clock,
  Loader2,
  CalendarOff,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSchedulingData, type BusinessHour } from "@/hooks/scheduling/useSchedulingData";
import StaffScheduleDialog from "@/components/dashboard/scheduling/StaffScheduleDialog";
import TeamWeekScheduleDialog from "@/components/dashboard/scheduling/TeamWeekScheduleDialog";
import TeamWeekWorkloadCompact from "@/components/dashboard/scheduling/TeamWeekWorkloadCompact";
import { useTranslation } from "react-i18next";
import { Wrench, CalendarDays, Activity, LayoutGrid } from "lucide-react";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const trimHm = (t: string | null) => (t ? t.slice(0, 5) : "");
const WEEKDAYS_HEAT_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const getHeatColor = (v: number) => {
  if (v === 0) return "bg-muted/30";
  if (v === 1) return "bg-wj-green/20";
  if (v === 2) return "bg-wj-green/40";
  if (v === 3) return "bg-wj-green/60";
  if (v === 4) return "bg-wj-green/80";
  return "bg-wj-green";
};

export default function AdminManage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language?.startsWith("pt") ? "pt-PT" : "en-GB";
  const getHeatLabel = (v: number) => {
    if (v === 0) return t("manage.heatmap.labels.none");
    if (v === 1) return t("manage.heatmap.labels.light");
    if (v <= 2) return t("manage.heatmap.labels.moderate");
    if (v <= 4) return t("manage.heatmap.labels.busy");
    return t("manage.heatmap.labels.very_busy");
  };

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<Record<number, BusinessHour>>({});
  const [saving, setSaving] = useState(false);
  const [staffDetail, setStaffDetail] = useState<{
    id: string;
    name: string;
    email: string | null;
    weekly: number;
    capacity: number;
  } | null>(null);
  const [heatMonth, setHeatMonth] = useState(new Date().getMonth());
  const [heatYear, setHeatYear] = useState(new Date().getFullYear());
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});
  const [dayModalDow, setDayModalDow] = useState<number | null>(null);
  const [teamWeekOpen, setTeamWeekOpen] = useState(false);

  const dateStr = (selectedDate ?? new Date()).toISOString().slice(0, 10);
  const {
    loading,
    businessHours,
    exceptions,
    mechanics,
    appointments,
    saveAllBusinessHours,
    refetch,
  } = useSchedulingData({ date: dateStr });

  // Monthly appointment counts for heatmap
  useEffect(() => {
    const from = `${heatYear}-${String(heatMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(heatYear, heatMonth + 1, 0).getDate();
    const to = `${heatYear}-${String(heatMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    (async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_date")
        .gte("scheduled_date", from)
        .lte("scheduled_date", to)
        .in("status", ["pending", "confirmed", "in_progress", "completed"]);
      if (error) return;
      const map: Record<string, number> = {};
      (data ?? []).forEach((a: any) => {
        map[a.scheduled_date] = (map[a.scheduled_date] ?? 0) + 1;
      });
      setMonthCounts(map);
    })();
  }, [heatMonth, heatYear, appointments.length]);

  useEffect(() => {
    if (!businessHours.length) return;
    const next: Record<number, BusinessHour> = {};
    for (const h of businessHours) next[h.day_of_week] = h;
    setDraft(next);
  }, [businessHours]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const toggleDay = (dow: number) => {
    setDraft((p) => ({
      ...p,
      [dow]: { ...(p[dow] ?? ({} as BusinessHour)), day_of_week: dow, is_open: !p[dow]?.is_open },
    }));
  };

  const updateTime = (dow: number, field: "open_time" | "close_time", value: string) => {
    setDraft((p) => ({
      ...p,
      [dow]: { ...(p[dow] ?? ({} as BusinessHour)), day_of_week: dow, [field]: value },
    }));
  };

  const handleSaveHours = async () => {
    setSaving(true);
    const rows = Object.values(draft).map((d) => ({
      day_of_week: d.day_of_week,
      is_open: d.is_open,
      open_time: d.open_time,
      close_time: d.close_time,
    }));
    const ok = await saveAllBusinessHours(rows);
    setSaving(false);
    if (ok) setShowSettings(false);
  };

  const totalCapacity = mechanics.reduce((a, m) => a + m.weekly_capacity, 0) || 1;
  const totalAppointments = mechanics.reduce((a, m) => a + m.weekly_appointments, 0);
  const workloadPercentage = Math.min(100, Math.round((totalAppointments / totalCapacity) * 100));

  // Overloaded staff (>= 75% capacity)
  const overloadedStaff = mechanics
    .map((m) => ({
      ...m,
      load: Math.min(100, Math.round((m.weekly_appointments / Math.max(1, m.weekly_capacity)) * 100)),
    }))
    .filter((m) => m.load >= 75)
    .sort((a, b) => b.load - a.load);

  // weekly appointment counts per day-of-week for week-overview
  const weeklyByDow = appointments.reduce<Record<number, number>>((acc, a) => {
    const d = new Date(a.scheduled_date).getDay();
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  const todayDow = new Date().getDay();
  const dayApptList = dayModalDow == null
    ? []
    : appointments.filter((a) => new Date(a.scheduled_date).getDay() === dayModalDow);

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header with Settings Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">{t("manage.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("manage.subtitle")}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t("manage.business_hours_btn")}</span>
          </Button>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { icon: Users, label: t("manage.kpi.mechanics"), hint: t("manage.kpi.mechanics_hint"), value: String(mechanics.length), accent: "text-wj-green" },
            { icon: AlertTriangle, label: t("manage.kpi.overloaded"), hint: t("manage.kpi.overloaded_hint"), value: String(overloadedStaff.length), accent: overloadedStaff.length ? "text-amber-400" : "text-muted-foreground" },
            { icon: CalendarDays, label: t("manage.kpi.appointments"), hint: t("manage.kpi.appointments_hint"), value: String(totalAppointments), accent: "text-wj-green" },
            { icon: Activity, label: t("manage.kpi.capacity"), hint: t("manage.kpi.capacity_hint"), value: `${workloadPercentage}%`, accent: workloadPercentage > 80 ? "text-red-400" : workloadPercentage > 60 ? "text-amber-400" : "text-wj-green" },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                  <k.icon className={cn("h-4 w-4", k.accent)} />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.hint}</span>
              </div>
              <p className={cn("text-2xl font-light mt-3", k.accent)}>{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Overloaded Staff Alert — above calendar, full width */}
        <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl p-4 border backdrop-blur-md",
                overloadedStaff.length > 0
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-background/60 border-border/30",
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className={cn(
                    "h-4 w-4",
                    overloadedStaff.length > 0 ? "text-amber-400" : "text-wj-green",
                  )}
                />
                <h3 className="text-sm font-medium text-foreground">{t("manage.overload.title")}</h3>
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] border-border/40"
                >
                  {overloadedStaff.length} / {mechanics.length}
                </Badge>
              </div>
              {overloadedStaff.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("manage.overload.empty")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {overloadedStaff.map((m) => {
                    const initials = (m.full_name ?? m.email ?? "??")
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={m.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/60"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {m.full_name ?? m.email}
                          </p>
                          <div className="h-1 mt-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full",
                                m.load >= 90 ? "bg-red-500" : "bg-amber-500",
                              )}
                              style={{ width: `${m.load}%` }}
                            />
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px]",
                            m.load >= 90
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30",
                          )}
                        >
                          {m.load}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

        {/* Main Content Grid — independent glass blocks */}
        <div className="grid grid-cols-12 gap-4 lg:gap-5">
            {/* Heatmap — compact, no longer the highlight */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.10 }}
              className="col-span-12 lg:col-span-4 p-4 lg:p-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">{t("manage.heatmap.title")}</h3>
              </div>
              <TooltipProvider>
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (heatMonth === 0) {
                        setHeatMonth(11);
                        setHeatYear((y) => y - 1);
                      } else setHeatMonth((m) => m - 1);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-foreground capitalize">
                    {new Date(heatYear, heatMonth).toLocaleDateString(locale, {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (heatMonth === 11) {
                        setHeatMonth(0);
                        setHeatYear((y) => y + 1);
                      } else setHeatMonth((m) => m + 1);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS_HEAT_KEYS.map((k, i) => (
                    <div key={i} className="text-center text-[9px] text-muted-foreground uppercase">
                      {t(`manage.days_short.${k}`).charAt(0)}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const first = new Date(heatYear, heatMonth, 1);
                    const last = new Date(heatYear, heatMonth + 1, 0);
                    const pad = first.getDay();
                    const cells: JSX.Element[] = [];
                    for (let i = 0; i < pad; i++) {
                      cells.push(<div key={`p-${i}`} className="aspect-square" />);
                    }
                    for (let day = 1; day <= last.getDate(); day++) {
                      const date = new Date(heatYear, heatMonth, day);
                      const key = `${heatYear}-${String(heatMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const count = monthCounts[key] ?? 0;
                      const dow = date.getDay();
                      const isWeekend = dow === 0 || dow === 6;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isSelected =
                        selectedDate && date.toDateString() === selectedDate.toDateString();
                      cells.push(
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedDate(date)}
                              className={cn(
                                "aspect-square rounded-md flex items-center justify-center text-[10px] transition-all hover:ring-1 hover:ring-wj-green/50",
                                isWeekend && !count && "opacity-40",
                                isToday && "ring-1 ring-wj-green",
                                isSelected && "ring-2 ring-wj-green",
                                getHeatColor(count),
                              )}
                            >
                              {day}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">
                              {date.toLocaleDateString(locale, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <p className="text-muted-foreground">
                              {t("manage.heatmap.appointments", { n: count })} · {getHeatLabel(count)}
                            </p>
                          </TooltipContent>
                        </Tooltip>,
                      );
                    }
                    return cells;
                  })()}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t("manage.heatmap.less")}</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4, 5].map((l) => (
                      <div key={l} className={cn("w-3 h-3 rounded-sm", getHeatColor(l))} />
                    ))}
                  </div>
                  <span>{t("manage.heatmap.more")}</span>
                </div>
              </TooltipProvider>

              <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate">
                  {selectedDate?.toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </span>
                <span className="text-foreground font-medium">
                  {appointments.length} {t("manage.heatmap.appointments", { n: appointments.length })}
                </span>
              </div>
            </motion.div>

            {/* Week Overview — middle column */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-12 lg:col-span-5 p-4 lg:p-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{t("manage.team_week.title")}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("manage.team_week.subtitle")}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-wj-green hover:text-wj-green/80 gap-1 h-7"
                  onClick={() => navigate("/dashboard/admin/workshop")}
                >
                  {t("manage.week.manage")}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              <TeamWeekWorkloadCompact mechanics={mechanics} />
            </motion.div>

            {/* Workload + Team week button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.20 }}
              className="col-span-12 lg:col-span-3 p-4 lg:p-5 flex flex-col bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-wj-green" />
                  <h3 className="text-sm font-medium text-foreground">{t("manage.workload.title")}</h3>
                </div>
                <Badge className={cn(
                  "text-[10px]",
                  workloadPercentage > 80 
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : workloadPercentage > 60
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-wj-green/20 text-wj-green border-wj-green/30"
                )}>
                  {t("manage.workload.of_capacity", { n: workloadPercentage })}
                </Badge>
              </div>
              
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${workloadPercentage}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className={cn(
                    "h-full rounded-full",
                    workloadPercentage > 80 
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : workloadPercentage > 60
                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                      : "bg-gradient-to-r from-wj-green to-wj-green/60"
                  )}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                <span>{t("manage.workload.appointments", { n: totalAppointments })}</span>
                <span>{t("manage.workload.capacity", { n: totalCapacity })}</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="mt-auto gap-2 w-full text-xs h-8"
                onClick={() => setTeamWeekOpen(true)}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("manage.team_week.open_button")}
              </Button>
            </motion.div>

            {/* Team Members Workload — bottom row left */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="col-span-12 lg:col-span-7 p-4 lg:p-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">{t("manage.team.title")}</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("manage.team.loading")}
                </div>
              ) : mechanics.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t("manage.team.empty")}
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mechanics.map((member, index) => {
                  const memberLoad = Math.min(100, Math.round((member.weekly_appointments / member.weekly_capacity) * 100));
                  const initials = (member.full_name ?? member.email ?? "??")
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <motion.div
                      key={member.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="bg-muted/30 rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-wj-green/20 text-wj-green text-xs font-bold flex items-center justify-center">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.full_name ?? member.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{t("manage.team.role")}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {member.weekly_appointments}/{member.weekly_capacity}
                        </Badge>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            memberLoad > 80 
                              ? "bg-red-500"
                              : memberLoad > 60
                              ? "bg-amber-500"
                              : "bg-wj-green"
                          )}
                          style={{ width: `${memberLoad}%` }}
                        />
                      </div>
                      <button
                        onClick={() =>
                          setStaffDetail({
                            id: member.user_id,
                            name: member.full_name ?? member.email ?? "Mecânico",
                            email: member.email,
                            weekly: member.weekly_appointments,
                            capacity: member.weekly_capacity,
                          })
                        }
                        className="mt-2 w-full flex items-center justify-between text-[10px] text-wj-green hover:text-wj-green/80 transition-colors"
                      >
                        <span>{t("manage.team.view_details")}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
              )}
            </motion.div>

            {/* Exceptions — bottom row right */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30 }}
              className="col-span-12 lg:col-span-5 p-4 lg:p-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarOff className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">{t("manage.exceptions.title")}</h3>
              </div>
              {exceptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("manage.exceptions.empty")}</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {exceptions.slice(0, 6).map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-wj-green/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-wj-green">
                            {new Date(ex.exception_date).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{ex.reason}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {new Date(ex.exception_date).toLocaleDateString(locale, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] shrink-0",
                          ex.exception_type === "closed"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30",
                        )}
                      >
                        {ex.exception_type === "closed"
                          ? t("manage.exceptions.closed")
                          : t("manage.exceptions.special")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
        </div>
      </div>

      {/* Opening Hours Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("manage.settings_modal.title")}</DialogTitle>
            <DialogDescription>{t("manage.settings_modal.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
              const config = draft[dow];
              if (!config) return null;
              return (
                <div
                  key={dow}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-xl transition-all",
                    config.is_open ? "bg-muted/50" : "bg-muted/20",
                  )}
                >
                  <Switch checked={config.is_open} onCheckedChange={() => toggleDay(dow)} />
                  <span className="w-24 text-sm font-medium text-foreground">
                    {t(`manage.days_long.${DAY_KEYS[dow]}`)}
                  </span>
                  {config.is_open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={trimHm(config.open_time) || "09:00"}
                        onChange={(e) => updateTime(dow, "open_time", e.target.value)}
                        className="bg-muted px-2 py-1 rounded text-xs text-foreground"
                      />
                      <span className="text-muted-foreground text-xs">{t("manage.settings_modal.until")}</span>
                      <input
                        type="time"
                        value={trimHm(config.close_time) || "18:00"}
                        onChange={(e) => updateTime(dow, "close_time", e.target.value)}
                        className="bg-muted px-2 py-1 rounded text-xs text-foreground"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("manage.settings_modal.closed")}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(false)} disabled={saving}>
              {t("manage.settings_modal.cancel")}
            </Button>
            <Button
              size="sm"
              className="bg-wj-green hover:bg-wj-green/90"
              onClick={handleSaveHours}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("manage.settings_modal.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day appointments modal */}
      <Dialog open={dayModalDow !== null} onOpenChange={(v) => !v && setDayModalDow(null)}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t("manage.day_modal.title")} ·{" "}
              {dayModalDow != null && t(`manage.days_long.${DAY_KEYS[dayModalDow]}`)}
            </DialogTitle>
            <DialogDescription>
              {t("manage.heatmap.appointments", { n: dayApptList.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-3 max-h-[50vh] overflow-y-auto">
            {dayApptList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {t("manage.day_modal.empty")}
              </p>
            ) : (
              dayApptList.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {a.customer_name ?? a.customer_email ?? "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {a.service_name ?? "—"} · {a.mechanic_name ?? "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {trimHm(a.scheduled_start_time)}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setDayModalDow(null)}>
              {t("manage.day_modal.close")}
            </Button>
            <Button
              size="sm"
              className="bg-wj-green hover:bg-wj-green/90 gap-2"
              onClick={() => {
                setDayModalDow(null);
                navigate("/dashboard/admin/workshop");
              }}
            >
              <Wrench className="h-3.5 w-3.5" />
              {t("manage.day_modal.go_workshop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {staffDetail && (
        <StaffScheduleDialog
          open={!!staffDetail}
          onOpenChange={(v) => !v && setStaffDetail(null)}
          staffId={staffDetail.id}
          staffName={staffDetail.name}
          staffEmail={staffDetail.email}
          weeklyAppointments={staffDetail.weekly}
          weeklyCapacity={staffDetail.capacity}
        />
      )}

      <TeamWeekScheduleDialog
        open={teamWeekOpen}
        onOpenChange={setTeamWeekOpen}
        mechanics={mechanics}
        onChanged={refetch}
      />
    </AdminDashboardLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarOff,
  Clock,
  UserPlus,
  Shield,
  Wrench,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Mechanic } from "@/hooks/scheduling/useSchedulingData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ScheduleRow = {
  staff_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  max_concurrent: number;
};

type ExceptionRow = {
  id: string;
  staff_id: string;
  exception_date: string;
  exception_type: string;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

type ApptRow = {
  id: string;
  assigned_mechanic_id: string | null;
  scheduled_date: string;
  duration_minutes: number | null;
};

const trim = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");
const ymd = (d: Date) => d.toISOString().slice(0, 10);

function startOfWeek(d: Date) {
  // Monday-start week
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mechanics: Mechanic[];
  onChanged?: () => void;
}

export default function TeamWeekScheduleDialog({ open, onOpenChange, mechanics, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("pt") ? "pt-PT" : "en-GB";
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [appts, setAppts] = useState<ApptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  const fromISO = ymd(days[0]);
  const toISO = ymd(days[6]);

  const load = useCallback(async () => {
    if (!mechanics.length) return;
    setLoading(true);
    try {
      const ids = mechanics.map((m) => m.user_id);
      const today = ymd(new Date());
      const [schedRes, excRes, apptRes] = await Promise.all([
        supabase
          .from("staff_schedules")
          .select("staff_id, day_of_week, is_working, start_time, end_time, max_concurrent")
          .in("staff_id", ids)
          .lte("valid_from", today)
          .or(`valid_until.is.null,valid_until.gte.${today}`),
        supabase
          .from("staff_schedule_exceptions")
          .select("*")
          .in("staff_id", ids)
          .gte("exception_date", fromISO)
          .lte("exception_date", toISO),
        supabase
          .from("appointments")
          .select("id, assigned_mechanic_id, scheduled_date, duration_minutes")
          .in("assigned_mechanic_id", ids)
          .gte("scheduled_date", fromISO)
          .lte("scheduled_date", toISO)
          .in("status", ["pending", "confirmed", "in_progress", "completed"]),
      ]);
      if (schedRes.error) throw schedRes.error;
      if (excRes.error) throw excRes.error;
      if (apptRes.error) throw apptRes.error;
      setSchedules((schedRes.data ?? []) as ScheduleRow[]);
      setExceptions((excRes.data ?? []) as ExceptionRow[]);
      setAppts((apptRes.data ?? []) as ApptRow[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Falha ao carregar horários da equipa");
    } finally {
      setLoading(false);
    }
  }, [mechanics, fromISO, toISO]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  /* ------------- helpers ------------- */

  const getEffectiveDay = (staffId: string, date: Date) => {
    const iso = ymd(date);
    const exc = exceptions.find((e) => e.staff_id === staffId && e.exception_date === iso);
    if (exc) {
      return {
        is_working: exc.is_working,
        start_time: trim(exc.start_time),
        end_time: trim(exc.end_time),
        source: "exception" as const,
        exception: exc,
      };
    }
    const sch = schedules.find((s) => s.staff_id === staffId && s.day_of_week === date.getDay());
    if (sch) {
      return {
        is_working: sch.is_working,
        start_time: trim(sch.start_time),
        end_time: trim(sch.end_time),
        source: "schedule" as const,
        exception: null,
      };
    }
    // default: M-F 9-18
    const dow = date.getDay();
    return {
      is_working: dow >= 1 && dow <= 5,
      start_time: "09:00",
      end_time: "18:00",
      source: "default" as const,
      exception: null,
    };
  };

  const computeLoad = (staffId: string, date: Date) => {
    const eff = getEffectiveDay(staffId, date);
    if (!eff.is_working || !eff.start_time || !eff.end_time) return { pct: 0, busyMin: 0, totalMin: 0 };
    const [sh, sm] = eff.start_time.split(":").map(Number);
    const [eh, em] = eff.end_time.split(":").map(Number);
    const totalMin = Math.max(60, eh * 60 + em - (sh * 60 + sm));
    const iso = ymd(date);
    const busyMin = appts
      .filter((a) => a.assigned_mechanic_id === staffId && a.scheduled_date === iso)
      .reduce((s, a) => s + (a.duration_minutes ?? 60), 0);
    return { pct: Math.min(100, Math.round((busyMin / totalMin) * 100)), busyMin, totalMin };
  };

  /* ------------- mutations (per cell) ------------- */

  const saveCell = async (
    staffId: string,
    date: Date,
    patch: { is_working: boolean; start_time: string; end_time: string },
  ) => {
    const iso = ymd(date);
    const key = `${staffId}-${iso}`;
    setSaving(key);
    try {
      const existing = exceptions.find((e) => e.staff_id === staffId && e.exception_date === iso);
      if (existing) {
        const { error } = await supabase
          .from("staff_schedule_exceptions")
          .update({
            is_working: patch.is_working,
            start_time: patch.is_working ? patch.start_time : null,
            end_time: patch.is_working ? patch.end_time : null,
            exception_type: patch.is_working ? "custom_hours" : "off",
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_schedule_exceptions").insert({
          staff_id: staffId,
          exception_date: iso,
          is_working: patch.is_working,
          start_time: patch.is_working ? patch.start_time : null,
          end_time: patch.is_working ? patch.end_time : null,
          exception_type: patch.is_working ? "custom_hours" : "off",
          reason: patch.is_working ? "Custom hours" : "Day off",
        });
        if (error) throw error;
      }
      toast.success(t("manage.team_week.saved"));
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha a guardar");
    } finally {
      setSaving(null);
    }
  };

  const clearException = async (staffId: string, date: Date) => {
    const iso = ymd(date);
    const existing = exceptions.find((e) => e.staff_id === staffId && e.exception_date === iso);
    if (!existing) return;
    const key = `${staffId}-${iso}`;
    setSaving(key);
    try {
      const { error } = await supabase
        .from("staff_schedule_exceptions")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      toast.success(t("manage.team_week.reverted"));
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha");
    } finally {
      setSaving(null);
    }
  };

  const todayISO = ymd(new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-background/95 backdrop-blur-xl border-border/50 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("manage.team_week.title")}</DialogTitle>
          <DialogDescription>{t("manage.team_week.subtitle")}</DialogDescription>
        </DialogHeader>

        {/* Week nav */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() - 7);
              setWeekStart(d);
            }}
          >
            <ChevronLeft className="h-4 w-4" /> {t("manage.team_week.prev")}
          </Button>
          <div className="text-sm font-medium text-foreground capitalize">
            {days[0].toLocaleDateString(locale, { day: "numeric", month: "short" })} –{" "}
            {days[6].toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              {t("manage.team_week.today")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + 7);
                setWeekStart(d);
              }}
            >
              {t("manage.team_week.next")} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("manage.team_week.loading")}
          </div>
        ) : mechanics.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t("manage.team.empty")}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-1 mb-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
                  {t("manage.team_week.mechanic")}
                </div>
                {days.map((d) => {
                  const isToday = ymd(d) === todayISO;
                  return (
                    <div
                      key={d.toISOString()}
                      className={cn(
                        "text-center text-[10px] uppercase tracking-wider py-1 rounded-md",
                        isToday ? "bg-wj-green/15 text-wj-green font-bold" : "text-muted-foreground",
                      )}
                    >
                      <div>{d.toLocaleDateString(locale, { weekday: "short" })}</div>
                      <div className="text-foreground text-sm font-medium mt-0.5">
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mechanic rows */}
              <div className="space-y-1">
                {mechanics.map((m) => (
                  <div
                    key={m.user_id}
                    className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-1 items-stretch"
                  >
                    {/* Mechanic identity */}
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/30">
                      <div className="w-7 h-7 rounded-full bg-wj-green/20 text-wj-green text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(m.full_name ?? m.email ?? "??")
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {m.full_name ?? m.email}
                        </p>
                      </div>
                    </div>

                    {days.map((d) => (
                      <DayCell
                        key={d.toISOString()}
                        date={d}
                        eff={getEffectiveDay(m.user_id, d)}
                        load={computeLoad(m.user_id, d)}
                        saving={saving === `${m.user_id}-${ymd(d)}`}
                        isToday={ymd(d) === todayISO}
                        onSave={(patch) => saveCell(m.user_id, d, patch)}
                        onClear={() => clearException(m.user_id, d)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Role assignment layer */}
        <RoleAssignmentPanel onChanged={onChanged} />

        <div className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-1.5 rounded-full bg-wj-green" /> {t("manage.team_week.legend_load")}
            </span>
            <span className="flex items-center gap-1">
              <CalendarOff className="h-3 w-3" /> {t("manage.team_week.legend_off")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t("manage.team_week.legend_custom")}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            {t("manage.day_modal.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================ */

function DayCell({
  date,
  eff,
  load,
  saving,
  isToday,
  onSave,
  onClear,
}: {
  date: Date;
  eff: {
    is_working: boolean;
    start_time: string;
    end_time: string;
    source: "exception" | "schedule" | "default";
  };
  load: { pct: number; busyMin: number; totalMin: number };
  saving: boolean;
  isToday: boolean;
  onSave: (p: { is_working: boolean; start_time: string; end_time: string }) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(eff.is_working);
  const [start, setStart] = useState(eff.start_time || "09:00");
  const [end, setEnd] = useState(eff.end_time || "18:00");

  useEffect(() => {
    setWorking(eff.is_working);
    setStart(eff.start_time || "09:00");
    setEnd(eff.end_time || "18:00");
  }, [eff.is_working, eff.start_time, eff.end_time]);

  const off = !eff.is_working;
  const isCustom = eff.source === "exception";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative h-[110px] rounded-xl p-2 text-left transition-all border overflow-hidden",
            off
              ? "bg-background/80 border-border/20 hover:bg-background/60"
              : "bg-muted/30 border-border/40 hover:bg-muted/50",
            isToday && "ring-2 ring-wj-green/70",
            isCustom && "border-wj-green/50",
          )}
        >
          {/* Bottom-up load fill */}
          {!off && (
            <div
              className={cn(
                "absolute left-0 right-0 bottom-0 transition-all duration-500 pointer-events-none",
                load.pct >= 90
                  ? "bg-red-500/30"
                  : load.pct >= 70
                    ? "bg-amber-500/30"
                    : "bg-wj-green/25",
              )}
              style={{ height: `${Math.max(4, load.pct)}%` }}
            />
          )}
          {off && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-foreground/10 pointer-events-none" />
          )}

          <div className="relative flex items-start justify-between">
            <span className={cn(
              "text-[10px] font-medium",
              off ? "text-muted-foreground/60" : "text-foreground/80",
            )}>
              {off ? t("manage.team_week.off") : `${eff.start_time}-${eff.end_time}`}
            </span>
            {off && <CalendarOff className="h-3 w-3 text-muted-foreground/60" />}
            {isCustom && !off && <Clock className="h-3 w-3 text-wj-green" />}
          </div>

          {!off && (
            <div className="relative mt-auto flex items-end justify-between h-full pt-4">
              <div className="flex flex-col">
                <span className={cn(
                  "text-lg font-bold leading-none",
                  load.pct >= 90 ? "text-red-500" : load.pct >= 70 ? "text-amber-500" : "text-wj-green",
                )}>
                  {load.pct}%
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  {load.busyMin}/{load.totalMin}m
                </span>
              </div>
            </div>
          )}

          {saving && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-xl">
              <Loader2 className="h-3 w-3 animate-spin text-wj-green" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-background/95 backdrop-blur-xl border-border/50" align="center">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isCustom ? t("manage.team_week.source_custom") : t("manage.team_week.source_default")}
            </p>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
            <span className="text-xs text-foreground">{t("manage.team_week.working")}</span>
            <Switch checked={working} onCheckedChange={setWorking} />
          </div>

          {working && (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {!working && (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] w-full justify-center py-1">
              {t("manage.team_week.marked_off")}
            </Badge>
          )}

          {!off && load.busyMin > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {t("manage.team_week.booked_minutes", { busy: load.busyMin, total: load.totalMin })}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {isCustom ? (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { onClear(); setOpen(false); }}>
                {t("manage.team_week.reset")}
              </Button>
            ) : <span />}
            <Button
              size="sm"
              className="h-7 text-xs bg-wj-green hover:bg-wj-green/90"
              onClick={() => {
                onSave({ is_working: working, start_time: start, end_time: end });
                setOpen(false);
              }}
            >
              {t("manage.team_week.save")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ============================================================ */
/* Role assignment panel                                        */
/* ============================================================ */

type Candidate = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: string[];
};

function RoleAssignmentPanel({ onChanged }: { onChanged?: () => void }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"staff" | "admin">("staff");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: profs, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").eq("is_active", true).limit(500),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      const list: Candidate[] = (profs ?? []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        roles: roleMap.get(p.user_id) ?? [],
      }));
      // Exclude users who are *only* customers (or guests) — show staff/admin/no-role users.
      const filtered = list.filter(
        (u) => !(u.roles.length === 1 && u.roles[0] === "customer") && u.roles[0] !== "guest",
      );
      // Sort: staff/admin first, then unassigned
      filtered.sort((a, b) => {
        const aHas = a.roles.includes("admin") || a.roles.includes("staff") ? 0 : 1;
        const bHas = b.roles.includes("admin") || b.roles.includes("staff") ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? "");
      });
      setUsers(filtered);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Falha a carregar utilizadores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assignRole = async (userId: string, role: "staff" | "admin") => {
    setBusyId(userId + role);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
      toast.success(t("manage.team_week.role_assigned", { defaultValue: "Role assigned" }));
      await load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message ?? "Falha");
    } finally {
      setBusyId(null);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    setBusyId(userId + role + "rm");
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      if (error) throw error;
      toast.success(t("manage.team_week.role_removed", { defaultValue: "Role removed" }));
      await load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message ?? "Falha");
    } finally {
      setBusyId(null);
    }
  };

  const candidatesForSelect = users.filter(
    (u) => !u.roles.includes("admin") && !u.roles.includes("staff"),
  );

  return (
    <div className="mt-6 rounded-xl border border-border/40 bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-wj-green" />
          <h4 className="text-sm font-semibold text-foreground">
            {t("manage.team_week.roles_title", { defaultValue: "Team roles" })}
          </h4>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {t("manage.team_week.roles_hint", {
            defaultValue: "Promote a user to mechanic (staff) or admin",
          })}
        </span>
      </div>

      {/* Quick assign */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[260px] h-9 text-xs">
            <SelectValue
              placeholder={t("manage.team_week.pick_user", {
                defaultValue: "Select a user…",
              })}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {candidatesForSelect.length === 0 ? (
              <div className="text-xs text-muted-foreground px-3 py-2">
                {t("manage.team_week.no_candidates", { defaultValue: "No available users" })}
              </div>
            ) : (
              candidatesForSelect.map((u) => (
                <SelectItem key={u.user_id} value={u.user_id} className="text-xs">
                  {(u.full_name ?? u.email) || u.user_id.slice(0, 8)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff" className="text-xs">
              <span className="flex items-center gap-1.5"><Wrench className="h-3 w-3" /> Mechanic</span>
            </SelectItem>
            <SelectItem value="admin" className="text-xs">
              <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Admin</span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="h-9 text-xs bg-wj-green hover:bg-wj-green/90"
          disabled={!selectedUser || !!busyId}
          onClick={() => {
            if (selectedUser) {
              assignRole(selectedUser, selectedRole);
              setSelectedUser("");
            }
          }}
        >
          {busyId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          {t("manage.team_week.assign", { defaultValue: "Assign" })}
        </Button>
      </div>

      {/* Current staff/admin list */}
      <div className="rounded-lg border border-border/30 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("manage.team_week.user", { defaultValue: "User" })}</span>
          <span>{t("manage.team_week.roles", { defaultValue: "Roles" })}</span>
          <span className="text-right">{t("manage.team_week.actions", { defaultValue: "Actions" })}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </div>
        ) : users.filter((u) => u.roles.includes("staff") || u.roles.includes("admin")).length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            {t("manage.team_week.no_staff", { defaultValue: "No staff or admins yet" })}
          </div>
        ) : (
          users
            .filter((u) => u.roles.includes("staff") || u.roles.includes("admin"))
            .map((u) => (
              <div
                key={u.user_id}
                className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-3 py-2 border-t border-border/20 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate">{u.full_name ?? u.email}</p>
                  {u.full_name && u.email && (
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {u.roles.includes("admin") && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[9px] gap-1">
                      <Shield className="h-2.5 w-2.5" /> admin
                    </Badge>
                  )}
                  {u.roles.includes("staff") && (
                    <Badge className="bg-wj-green/15 text-wj-green border-wj-green/30 text-[9px] gap-1">
                      <Wrench className="h-2.5 w-2.5" /> staff
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 justify-end">
                  {!u.roles.includes("staff") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      disabled={!!busyId}
                      onClick={() => assignRole(u.user_id, "staff")}
                    >
                      + Mechanic
                    </Button>
                  )}
                  {!u.roles.includes("admin") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      disabled={!!busyId}
                      onClick={() => assignRole(u.user_id, "admin")}
                    >
                      + Admin
                    </Button>
                  )}
                  {u.roles.includes("staff") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2 text-red-400 hover:text-red-300"
                      disabled={!!busyId}
                      onClick={() => removeRole(u.user_id, "staff")}
                    >
                      − Mechanic
                    </Button>
                  )}
                  {u.roles.includes("admin") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2 text-red-400 hover:text-red-300"
                      disabled={!!busyId}
                      onClick={() => removeRole(u.user_id, "admin")}
                    >
                      − Admin
                    </Button>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
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
            "relative h-[58px] rounded-lg p-1.5 text-left transition-all border",
            off
              ? "bg-muted/20 border-border/30 hover:bg-muted/30"
              : "bg-muted/40 border-border/30 hover:bg-muted/60",
            isToday && "ring-1 ring-wj-green",
            isCustom && "border-wj-green/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">
              {off ? t("manage.team_week.off") : `${eff.start_time}-${eff.end_time}`}
            </span>
            {off && <CalendarOff className="h-3 w-3 text-muted-foreground" />}
            {isCustom && !off && <Clock className="h-3 w-3 text-wj-green" />}
          </div>
          {!off && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    load.pct >= 90
                      ? "bg-red-500"
                      : load.pct >= 70
                        ? "bg-amber-500"
                        : "bg-wj-green",
                  )}
                  style={{ width: `${load.pct}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">{load.pct}%</p>
            </div>
          )}
          {saving && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
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
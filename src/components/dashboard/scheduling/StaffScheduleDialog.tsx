import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  Calendar as CalendarIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const trim = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");
const todayISO = () => new Date().toISOString().slice(0, 10);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

type DraftRow = {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  max_concurrent: number;
};

type StaffApptRow = {
  id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  status: string;
  duration_minutes: number | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  staffId: string;
  staffName: string;
  staffEmail: string | null;
  weeklyAppointments: number;
  weeklyCapacity: number;
}

const DEFAULT_ROW = (dow: number): DraftRow => ({
  day_of_week: dow,
  is_working: dow >= 1 && dow <= 5,
  start_time: "09:00",
  end_time: "18:00",
  max_concurrent: 1,
});

export default function StaffScheduleDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  staffEmail,
  weeklyAppointments,
  weeklyCapacity,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<number, DraftRow>>(() => {
    const obj: Record<number, DraftRow> = {};
    for (let i = 0; i < 7; i++) obj[i] = DEFAULT_ROW(i);
    return obj;
  });
  const [appts, setAppts] = useState<StaffApptRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = todayISO();
      const { data: schedRows, error: sErr } = await supabase
        .from("staff_schedules")
        .select("*")
        .eq("staff_id", staffId)
        .lte("valid_from", today)
        .or(`valid_until.is.null,valid_until.gte.${today}`);
      if (sErr) throw sErr;

      const next: Record<number, DraftRow> = {};
      for (let i = 0; i < 7; i++) next[i] = DEFAULT_ROW(i);
      (schedRows ?? []).forEach((r: any) => {
        const existing = next[r.day_of_week];
        if (!existing || existing.day_of_week === undefined) return;
        next[r.day_of_week] = {
          day_of_week: r.day_of_week,
          is_working: r.is_working,
          start_time: trim(r.start_time) || "09:00",
          end_time: trim(r.end_time) || "18:00",
          max_concurrent: r.max_concurrent ?? 1,
        };
      });
      setDraft(next);

      // workload: last 30 days
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const to = new Date();
      to.setDate(to.getDate() + 30);
      const { data: apptRows } = await supabase
        .from("appointments")
        .select("id, scheduled_date, scheduled_start_time, status, duration_minutes")
        .eq("assigned_mechanic_id", staffId)
        .gte("scheduled_date", ymd(from))
        .lte("scheduled_date", ymd(to))
        .order("scheduled_date", { ascending: false });
      setAppts((apptRows ?? []) as StaffApptRow[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Falha ao carregar dados do mecânico");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const update = (dow: number, patch: Partial<DraftRow>) =>
    setDraft((p) => ({ ...p, [dow]: { ...p[dow], ...patch } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = todayISO();
      // close all current open versions for this staff
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await supabase
        .from("staff_schedules")
        .update({ valid_until: ymd(yesterday) })
        .eq("staff_id", staffId)
        .is("valid_until", null);

      // insert 7 fresh rows
      const rows = Object.values(draft).map((d) => ({
        staff_id: staffId,
        day_of_week: d.day_of_week,
        is_working: d.is_working,
        start_time: d.is_working ? d.start_time : null,
        end_time: d.is_working ? d.end_time : null,
        max_concurrent: d.max_concurrent,
        valid_from: today,
      }));
      const { error } = await supabase.from("staff_schedules").insert(rows);
      if (error) throw error;
      toast.success("Horário do mecânico atualizado");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Falha a guardar");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- workload metrics ---------- */
  const metrics = useMemo(() => {
    const today = todayISO();
    const past = appts.filter((a) => a.scheduled_date < today);
    const upcoming = appts.filter((a) => a.scheduled_date >= today);
    const byStatus = appts.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});
    const avgDuration =
      past.length > 0
        ? Math.round(
            past.reduce((s, a) => s + (a.duration_minutes ?? 0), 0) / past.length,
          )
        : 0;
    return { past, upcoming, byStatus, avgDuration };
  }, [appts]);

  const loadPct = Math.min(100, Math.round((weeklyAppointments / Math.max(weeklyCapacity, 1)) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-foreground flex items-center gap-2">
                {staffName}
                <Badge variant="outline" className="text-[10px]">Mecânico</Badge>
              </DialogTitle>
              <DialogDescription>
                {staffEmail ?? "—"} · Gerir horário e ver carga de trabalho
              </DialogDescription>
            </div>
            <Badge
              className={cn(
                "text-xs",
                loadPct > 80
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : loadPct > 60
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-wj-green/20 text-wj-green border-wj-green/30",
              )}
            >
              {loadPct}% carga
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="workload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workload" className="gap-2">
              <Activity className="h-4 w-4" />
              Workload
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="h-4 w-4" />
              Horário
            </TabsTrigger>
          </TabsList>

          {/* ---------------- Workload ---------------- */}
          <TabsContent value="workload" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard
                    icon={<CalendarIcon className="h-4 w-4" />}
                    label="Esta semana"
                    value={weeklyAppointments}
                    sub={`de ${weeklyCapacity}`}
                  />
                  <MetricCard
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="Concluídos"
                    value={metrics.byStatus.completed ?? 0}
                    sub="últimos 30d"
                  />
                  <MetricCard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Duração média"
                    value={metrics.avgDuration}
                    sub="minutos"
                  />
                  <MetricCard
                    icon={<AlertCircle className="h-4 w-4" />}
                    label="Próximos"
                    value={metrics.upcoming.length}
                    sub="agendados"
                  />
                </div>

                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Carga semanal
                  </p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${loadPct}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        "h-full",
                        loadPct > 80
                          ? "bg-red-500"
                          : loadPct > 60
                            ? "bg-amber-500"
                            : "bg-wj-green",
                      )}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                    <span>{weeklyAppointments} agendamentos</span>
                    <span>{weeklyCapacity} capacidade</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Próximos agendamentos
                  </p>
                  {metrics.upcoming.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem agendamentos futuros.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {metrics.upcoming.slice(0, 10).map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/40"
                        >
                          <span className="text-foreground">
                            {new Date(a.scheduled_date).toLocaleDateString("pt-PT", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            · {trim(a.scheduled_start_time)}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {a.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ---------------- Schedule ---------------- */}
          <TabsContent value="schedule" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              Define os dias e horários de trabalho. Cada alteração cria uma nova versão a partir de hoje.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                  const r = draft[dow];
                  return (
                    <div
                      key={dow}
                      className={cn(
                        "flex flex-wrap items-center gap-3 p-3 rounded-xl transition-all",
                        r.is_working ? "bg-muted/50" : "bg-muted/20",
                      )}
                    >
                      <Switch
                        checked={r.is_working}
                        onCheckedChange={(v) => update(dow, { is_working: v })}
                      />
                      <span className="w-20 text-sm font-medium text-foreground">
                        {DAY_SHORT[dow]}
                      </span>
                      {r.is_working ? (
                        <>
                          <input
                            type="time"
                            value={r.start_time}
                            onChange={(e) => update(dow, { start_time: e.target.value })}
                            className="bg-muted px-2 py-1 rounded text-xs text-foreground"
                          />
                          <span className="text-muted-foreground text-xs">até</span>
                          <input
                            type="time"
                            value={r.end_time}
                            onChange={(e) => update(dow, { end_time: e.target.value })}
                            className="bg-muted px-2 py-1 rounded text-xs text-foreground"
                          />
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Paralelo
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={r.max_concurrent}
                              onChange={(e) =>
                                update(dow, {
                                  max_concurrent: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-14 h-7 text-xs"
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Folga</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-wj-green hover:bg-wj-green/90"
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Horário"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-light text-foreground mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
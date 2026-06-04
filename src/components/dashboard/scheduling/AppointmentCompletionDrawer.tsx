import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Check,
  Loader2,
  ShieldCheck,
  ListChecks,
  ChevronRight,
  Camera,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppointmentRow } from "@/hooks/scheduling/useSchedulingData";

interface Props {
  appointment: AppointmentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

type Stage = {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  position: number;
  requires_photo: boolean;
  photo_min_count: number;
};

type Task = {
  id: string;
  stage_id: string;
  label: string;
  description: string | null;
  position: number;
  is_required: boolean;
};

type StageProgress = {
  started_at: number | null;
  completed_at: number | null;
  duration_seconds: number | null;
  elapsed_from_start_seconds: number | null;
  task_done: Record<string, boolean>;
  has_photo: boolean;
};

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
};

export default function AppointmentCompletionDrawer({
  appointment,
  open,
  onOpenChange,
  onCompleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<Record<string, StageProgress>>({});
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // ticker for live timer
  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [open]);

  // Global appointment start (drives the live cumulative timer)
  const workStartedAtMs = useMemo(() => {
    const v = (appointment as any)?.work_started_at;
    return v ? new Date(v).getTime() : null;
  }, [appointment]);

  const elapsedFromStartSeconds = useMemo(() => {
    if (!workStartedAtMs) return 0;
    return Math.max(0, Math.floor((Date.now() - workStartedAtMs) / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workStartedAtMs, tick]);

  const loadTemplate = useCallback(async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const { data: tpl, error: tplErr } = await supabase
        .from("qc_templates")
        .select("id")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (tplErr) throw tplErr;
      if (!tpl) {
        setStages([]);
        setTasks([]);
        return;
      }
      const [sRes, kRes, prRes] = await Promise.all([
        supabase
          .from("qc_stages")
          .select("*")
          .eq("template_id", tpl.id)
          .order("position", { ascending: true }),
        supabase
          .from("qc_tasks")
          .select("*")
          .order("position", { ascending: true }),
        supabase
          .from("appointment_qc_progress")
          .select("*")
          .eq("appointment_id", appointment.id),
      ]);
      if (sRes.error) throw sRes.error;
      if (kRes.error) throw kRes.error;
      const st = (sRes.data ?? []) as Stage[];
      const tk = ((kRes.data ?? []) as Task[]).filter((t) =>
        st.some((s) => s.id === t.stage_id),
      );
      setStages(st);
      setTasks(tk);

      // hydrate progress
      const map: Record<string, StageProgress> = {};
      st.forEach((s) => {
        const row = (prRes.data ?? []).find((p: any) => p.stage_id === s.id);
        const tr = (row?.task_results ?? []) as Array<{ task_id: string; done: boolean }>;
        map[s.id] = {
          started_at: row?.started_at ? new Date(row.started_at).getTime() : null,
          completed_at: row?.completed_at ? new Date(row.completed_at).getTime() : null,
          duration_seconds: row?.duration_seconds ?? null,
          elapsed_from_start_seconds: (row as any)?.elapsed_from_start_seconds ?? null,
          task_done: Object.fromEntries(tr.map((t) => [t.task_id, !!t.done])),
          has_photo: !s.requires_photo
            ? true
            : Array.isArray(row?.task_results)
              ? !!(row as any)?.notes || tr.length > 0 // heuristic — UI marks via toggle below
              : false,
        };
      });
      setProgress(map);

      // pick first incomplete stage as active
      const firstIncomplete = st.find((s) => !map[s.id]?.completed_at) ?? st[0] ?? null;
      setActiveStageId(firstIncomplete?.id ?? null);
    } catch (e: any) {
      toast.error(e.message ?? "Falha a carregar Controlo de Qualidade");
    } finally {
      setLoading(false);
    }
  }, [appointment]);

  useEffect(() => {
    if (open && appointment) loadTemplate();
    if (!open) {
      setStages([]);
      setTasks([]);
      setProgress({});
      setActiveStageId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.id]);

  // Stage "started_at" is anchored to the appointment work_started_at — the
  // QC timer is a single cumulative counter for the whole appointment.
  useEffect(() => {
    if (!activeStageId || !workStartedAtMs) return;
    setProgress((prev) => {
      const cur = prev[activeStageId];
      if (!cur) return prev;
      if (cur.started_at || cur.completed_at) return prev;
      return { ...prev, [activeStageId]: { ...cur, started_at: workStartedAtMs } };
    });
  }, [activeStageId, workStartedAtMs]);

  const tasksByStage = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const arr = m.get(t.stage_id) ?? [];
      arr.push(t);
      m.set(t.stage_id, arr);
    });
    return m;
  }, [tasks]);

  const activeStage = stages.find((s) => s.id === activeStageId) ?? null;
  const activeTasks = activeStage ? tasksByStage.get(activeStage.id) ?? [] : [];
  const activeProgress = activeStageId ? progress[activeStageId] : null;

  const allStagesCompleted =
    stages.length > 0 && stages.every((s) => !!progress[s.id]?.completed_at);

  // For the active stage we show the live cumulative timer from work_started_at,
  // or the frozen cumulative value at the moment the stage was completed.
  const displayStageSeconds = useMemo(() => {
    if (!activeProgress) return elapsedFromStartSeconds;
    if (activeProgress.completed_at)
      return (
        activeProgress.elapsed_from_start_seconds ??
        activeProgress.duration_seconds ??
        0
      );
    return elapsedFromStartSeconds;
  }, [activeProgress, elapsedFromStartSeconds]);

  const toggleTask = (taskId: string) => {
    if (!activeStageId) return;
    setProgress((prev) => {
      const cur = prev[activeStageId];
      if (!cur || cur.completed_at) return prev;
      return {
        ...prev,
        [activeStageId]: {
          ...cur,
          task_done: { ...cur.task_done, [taskId]: !cur.task_done[taskId] },
        },
      };
    });
  };

  const togglePhoto = () => {
    if (!activeStageId) return;
    setProgress((prev) => {
      const cur = prev[activeStageId];
      if (!cur || cur.completed_at) return prev;
      return { ...prev, [activeStageId]: { ...cur, has_photo: !cur.has_photo } };
    });
  };

  const canCompleteActive = useMemo(() => {
    if (!activeStage || !activeProgress) return false;
    const requiredTasksDone = activeTasks
      .filter((t) => t.is_required)
      .every((t) => activeProgress.task_done[t.id]);
    const photoOk = activeStage.requires_photo ? activeProgress.has_photo : true;
    return requiredTasksDone && photoOk;
  }, [activeStage, activeProgress, activeTasks]);

  const persistStage = async (stage: Stage, prog: StageProgress) => {
    if (!appointment) return false;
    const tr = Object.entries(prog.task_done).map(([task_id, done]) => ({ task_id, done }));
    const payload = {
      appointment_id: appointment.id,
      stage_id: stage.id,
      template_id: stage.template_id,
      stage_name: stage.name,
      stage_position: stage.position,
      started_at: prog.started_at ? new Date(prog.started_at).toISOString() : null,
      completed_at: prog.completed_at ? new Date(prog.completed_at).toISOString() : null,
      duration_seconds: prog.duration_seconds,
      elapsed_from_start_seconds: prog.elapsed_from_start_seconds,
      task_results: tr,
    } as any;
    const { error } = await supabase
      .from("appointment_qc_progress")
      .upsert(payload, { onConflict: "appointment_id,stage_id" });
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  };

  const completeActiveStage = async () => {
    if (!activeStage || !activeProgress || !canCompleteActive) return;
    const now = Date.now();
    // duration_seconds = cumulative seconds from appointment start to now
    const cumulative = workStartedAtMs
      ? Math.max(0, Math.floor((now - workStartedAtMs) / 1000))
      : activeProgress.started_at
        ? Math.floor((now - activeProgress.started_at) / 1000)
        : 0;
    const updated: StageProgress = {
      ...activeProgress,
      completed_at: now,
      duration_seconds: cumulative,
      elapsed_from_start_seconds: cumulative,
    };
    setSaving(true);
    const ok = await persistStage(activeStage, updated);
    setSaving(false);
    if (!ok) return;
    setProgress((prev) => ({ ...prev, [activeStage.id]: updated }));
    // jump to next incomplete
    const idx = stages.findIndex((s) => s.id === activeStage.id);
    const next = stages.slice(idx + 1).find((s) => !progress[s.id]?.completed_at);
    if (next) setActiveStageId(next.id);
  };

  const completeAppointment = async () => {
    if (!appointment) return;
    setSaving(true);
    const { error } = await supabase
      .from("appointments")
      .update({ status: "completed", work_ended_at: new Date().toISOString() })
      .eq("id", appointment.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agendamento concluído");
    onCompleted();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-[88vh] p-0 bg-background/95 backdrop-blur-xl border-t border-border/40 rounded-t-3xl flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-base font-light">
            <ShieldCheck className="h-4 w-4 text-wj-green" />
            Controlo de Qualidade
          </SheetTitle>
          <SheetDescription className="text-xs">
            Conclua cada etapa de QC antes de finalizar o agendamento de{" "}
            <span className="text-foreground">
              {appointment?.customer_name ?? "—"}
            </span>
            .
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> A carregar etapas…
          </div>
        ) : stages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ListChecks className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum modelo de Controlo de Qualidade ativo. Pode concluir o
              agendamento mesmo assim.
            </p>
            <Button
              size="sm"
              className="bg-wj-green hover:bg-wj-green/90 text-black"
              onClick={completeAppointment}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Concluir agendamento
            </Button>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-12 gap-4 px-4 sm:px-6 pb-6 overflow-hidden">
            {/* Stages sidebar */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-1.5">
                  {stages.map((s, i) => {
                    const p = progress[s.id];
                    const done = !!p?.completed_at;
                    const active = s.id === activeStageId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveStageId(s.id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3",
                          active
                            ? "bg-wj-green/10 border-wj-green/40"
                            : done
                              ? "bg-muted/30 border-border/30"
                              : "bg-background/60 border-border/30 hover:bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                            done
                              ? "bg-wj-green text-black"
                              : active
                                ? "bg-wj-green/20 text-wj-green border border-wj-green/40"
                                : "bg-muted/50 text-muted-foreground",
                          )}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{s.name}</p>
                          {p?.duration_seconds != null && (
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              {fmt(p.duration_seconds)}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Active stage panel */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {activeStage && activeProgress ? (
                  <motion.div
                    key={activeStage.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col rounded-2xl border border-border/30 bg-background/60 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border/30 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Etapa {activeStage.position}
                        </p>
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {activeStage.name}
                        </h3>
                        {activeStage.description && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {activeStage.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-wj-green/10 border border-wj-green/20 shrink-0">
                        <Clock className="h-3 w-3 text-wj-green" />
                        <span className="text-[11px] font-mono font-bold text-wj-green tabular-nums">
                          {fmt(elapsedActiveSeconds)}
                        </span>
                      </div>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-2">
                        {activeTasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            Sem tarefas registadas para esta etapa.
                          </p>
                        ) : (
                          activeTasks.map((t) => {
                            const checked = !!activeProgress.task_done[t.id];
                            const disabled = !!activeProgress.completed_at;
                            return (
                              <button
                                key={t.id}
                                disabled={disabled}
                                onClick={() => toggleTask(t.id)}
                                className={cn(
                                  "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                  checked
                                    ? "bg-wj-green/10 border-wj-green/30"
                                    : "bg-background/60 border-border/30 hover:bg-muted/30",
                                  disabled && "opacity-60 cursor-default",
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                    checked
                                      ? "bg-wj-green border-wj-green"
                                      : "border-border",
                                  )}
                                >
                                  {checked && <Check className="h-3 w-3 text-black" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p
                                      className={cn(
                                        "text-xs",
                                        checked
                                          ? "text-foreground line-through"
                                          : "text-foreground",
                                      )}
                                    >
                                      {t.label}
                                    </p>
                                    {t.is_required && (
                                      <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30">
                                        Obrigatório
                                      </Badge>
                                    )}
                                  </div>
                                  {t.description && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}

                        {activeStage.requires_photo && (
                          <button
                            disabled={!!activeProgress.completed_at}
                            onClick={togglePhoto}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all",
                              activeProgress.has_photo
                                ? "bg-wj-green/10 border-wj-green/30 text-wj-green"
                                : "border-dashed border-border hover:bg-muted/30 text-muted-foreground",
                            )}
                          >
                            {activeProgress.has_photo ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Camera className="h-3.5 w-3.5" />
                            )}
                            {activeProgress.has_photo
                              ? "Evidência fotográfica anexada"
                              : `Adicionar evidência (mín. ${activeStage.photo_min_count})`}
                          </button>
                        )}
                      </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-border/30 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {activeProgress.completed_at
                          ? `Concluída em ${fmt(activeProgress.duration_seconds ?? 0)}`
                          : "Marque todas as tarefas obrigatórias para concluir"}
                      </span>
                      <Button
                        size="sm"
                        disabled={
                          !canCompleteActive ||
                          !!activeProgress.completed_at ||
                          saving
                        }
                        onClick={completeActiveStage}
                        className="bg-wj-green hover:bg-wj-green/90 text-black h-8 text-xs"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        {activeProgress.completed_at ? "Concluída" : "Concluir etapa"}
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Final completion */}
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <div className="text-[11px] text-muted-foreground">
                  {stages.filter((s) => !!progress[s.id]?.completed_at).length}/
                  {stages.length} etapas concluídas
                </div>
                <Button
                  size="sm"
                  disabled={!allStagesCompleted || saving}
                  onClick={completeAppointment}
                  className={cn(
                    "h-9 text-xs",
                    allStagesCompleted
                      ? "bg-wj-green hover:bg-wj-green/90 text-black"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  Concluir agendamento
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
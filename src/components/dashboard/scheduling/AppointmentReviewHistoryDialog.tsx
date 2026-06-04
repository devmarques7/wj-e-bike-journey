import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ClipboardCheck,
  Clock,
  Camera,
  Check,
  ListChecks,
  Loader2,
  User,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { AppointmentRow } from "@/hooks/scheduling/useSchedulingData";

interface Props {
  appointment: AppointmentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProgressRow = {
  id: string;
  stage_id: string;
  stage_name: string | null;
  stage_position: number;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  elapsed_from_start_seconds: number | null;
  task_results: Array<{ task_id: string; done: boolean }>;
  notes: string | null;
};

const fmtDur = (s: number | null) => {
  if (s == null) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(x).padStart(2, "0")}s`;
};

const fmtAbs = (iso: string | null, locale = "pt") => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AppointmentReviewHistoryDialog({
  appointment,
  open,
  onOpenChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProgressRow[]>([]);

  useEffect(() => {
    if (!open || !appointment) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointment_qc_progress")
        .select(
          "id, stage_id, stage_name, stage_position, started_at, completed_at, duration_seconds, elapsed_from_start_seconds, task_results, notes",
        )
        .eq("appointment_id", appointment.id)
        .order("stage_position", { ascending: true });
      if (!cancelled) {
        if (!error) setRows((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, appointment]);

  const totalSeconds = (() => {
    if (!appointment?.work_started_at) return null;
    const end = appointment.work_ended_at
      ? new Date(appointment.work_ended_at).getTime()
      : null;
    if (!end) return null;
    return Math.max(
      0,
      Math.floor((end - new Date(appointment.work_started_at).getTime()) / 1000),
    );
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <DialogTitle className="text-base font-light flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-wj-green" />
            {t("workshop.review.title")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("workshop.review.desc")}
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="px-6 py-4 border-b border-border/30 grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <User className="h-3 w-3" /> {t("workshop.review.customer")}
              </div>
              <div className="font-medium truncate">
                {appointment.customer_name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Wrench className="h-3 w-3" /> {t("workshop.review.service")}
              </div>
              <div className="font-medium truncate">
                {appointment.service_name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {t("workshop.review.total_duration")}
              </div>
              <div className="font-medium tabular-nums">
                {totalSeconds != null ? fmtDur(totalSeconds) : "—"}
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("workshop.review.loading")}
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {t("workshop.review.empty")}
              </div>
            ) : (
              <ol className="relative space-y-3">
                {rows.map((r, i) => {
                  const completed = !!r.completed_at;
                  const taskCount = Array.isArray(r.task_results)
                    ? r.task_results.length
                    : 0;
                  const doneCount = Array.isArray(r.task_results)
                    ? r.task_results.filter((t) => t.done).length
                    : 0;
                  return (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        "rounded-xl border border-border/30 bg-muted/20 p-4",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-medium border",
                              completed
                                ? "bg-wj-green/10 text-wj-green border-wj-green/30"
                                : "bg-muted/40 text-muted-foreground border-border/40",
                            )}
                          >
                            {completed ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {r.stage_name ?? t("workshop.review.stage_fallback", { n: r.stage_position + 1 })}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {fmtAbs(r.completed_at, i18n.language)}
                              </span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="inline-flex items-center gap-1">
                                <ListChecks className="h-3 w-3" />
                                {t("workshop.review.tasks", { done: doneCount, total: taskCount })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t("workshop.review.accumulated")}
                          </div>
                          <div className="text-sm font-light tabular-nums text-wj-green">
                            {fmtDur(
                              r.elapsed_from_start_seconds ?? r.duration_seconds,
                            )}
                          </div>
                        </div>
                      </div>

                      {r.notes && (
                        <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/20 pt-2">
                          {r.notes}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <Badge className="text-[10px] gap-1 bg-muted/40 border-border/40 text-muted-foreground font-normal">
                          <Camera className="h-3 w-3" />
                          {t("workshop.review.photo_confirmed")}
                        </Badge>
                        {completed ? (
                          <Badge className="text-[10px] gap-1 bg-muted/30 text-foreground/80 border-border/40 font-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-wj-green inline-block" />
                            {t("workshop.review.status_done")}
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] gap-1 bg-muted/30 text-foreground/80 border-border/40 font-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            {t("workshop.review.status_running")}
                          </Badge>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
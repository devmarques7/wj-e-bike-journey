import { motion } from "framer-motion";
import { Camera, ListChecks, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQualityControl } from "@/hooks/qc/useQualityControl";

interface Props {
  onEdit: () => void;
}

export default function QualityControlPreviewCard({ onEdit }: Props) {
  const { templates, stages, tasks, loading } = useQualityControl();

  const active =
    templates.find((t) => t.is_default && t.is_active) ??
    templates.find((t) => t.is_active) ??
    templates[0] ??
    null;

  const activeStages = active
    ? stages.filter((s) => s.template_id === active.id).sort((a, b) => a.position - b.position)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-wj-green" />
            <h3 className="text-sm font-medium text-foreground">Controlo de Qualidade</h3>
            {active?.is_default && (
              <Badge className="text-[9px] h-4 bg-wj-green/15 text-wj-green border-wj-green/30 px-1.5">
                <Star className="h-2.5 w-2.5 mr-0.5" /> Padrão
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {active?.name ?? "Sem modelo definido"} ·{" "}
            {activeStages.length} etapa(s) ·{" "}
            {activeStages.reduce(
              (acc, s) => acc + tasks.filter((t) => t.stage_id === s.id).length,
              0,
            )}{" "}
            tarefa(s)
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-[11px] border-border/40"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Gerir
        </Button>
      </div>

      {loading ? (
        <div className="h-16 rounded-lg border border-border/20 bg-muted/20 animate-pulse" />
      ) : activeStages.length === 0 ? (
        <button
          onClick={onEdit}
          className="w-full py-6 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg hover:bg-muted/30 transition-colors"
        >
          Defina a primeira etapa do controlo de qualidade.
        </button>
      ) : (
        <ol className="flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {activeStages.map((s, idx) => {
            const count = tasks.filter((t) => t.stage_id === s.id).length;
            return (
              <li
                key={s.id}
                className="relative min-w-[140px] flex-1 p-2.5 rounded-lg border border-border/30 bg-muted/10 hover:border-wj-green/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-wj-green/15 text-wj-green text-[10px] font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {s.requires_photo && (
                    <Camera className="h-3 w-3 text-wj-green" aria-label="Exige fotografia" />
                  )}
                </div>
                <p className="text-[11px] font-medium mt-1.5 line-clamp-2">{s.name}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {count} tarefa(s)
                  {s.requires_photo ? ` · ${s.photo_min_count}+ foto` : ""}
                </p>
                {idx < activeStages.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden md:block absolute right-[-9px] top-1/2 -translate-y-1/2 h-px w-3 bg-border/60"
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </motion.div>
  );
}
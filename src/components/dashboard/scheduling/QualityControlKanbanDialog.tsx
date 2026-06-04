import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban";
import {
  Camera,
  GripVertical,
  Plus,
  Trash2,
  Check,
  X,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useQualityControl,
  type QcStage,
  type QcTask,
} from "@/hooks/qc/useQualityControl";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId: string | null;
}

export default function QualityControlKanbanDialog({ open, onOpenChange, templateId }: Props) {
  const {
    templates,
    stages,
    tasks,
    createStage,
    updateStage,
    deleteStage,
    createTask,
    updateTask,
    deleteTask,
  } = useQualityControl();

  const template = templates.find((t) => t.id === templateId) ?? null;

  const activeStages = useMemo<QcStage[]>(
    () =>
      stages
        .filter((s) => s.template_id === templateId)
        .sort((a, b) => a.position - b.position),
    [stages, templateId],
  );

  // Local kanban state: columns keyed by stage id, items are tasks
  type Col = Record<string, QcTask[]>;
  const [cols, setCols] = useState<Col>({});
  const [newStageName, setNewStageName] = useState("");

  useEffect(() => {
    if (!open) return;
    const next: Col = {};
    activeStages.forEach((s) => {
      next[s.id] = tasks
        .filter((t) => t.stage_id === s.id)
        .sort((a, b) => a.position - b.position);
    });
    setCols(next);
  }, [open, activeStages, tasks]);

  const handleAddStage = async () => {
    if (!templateId) return;
    await createStage(templateId, { name: newStageName.trim() || "Nova etapa" });
    setNewStageName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/20">
          <DialogTitle className="text-lg font-light flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-wj-green" />
            Kanban · {template?.name ?? "Modelo"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Arraste etapas para reordenar e mova tarefas entre etapas.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <Input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
              placeholder="Nome da nova etapa…"
              className="h-8 text-xs max-w-xs"
            />
            <Button
              size="sm"
              className="h-8 text-[11px] bg-wj-green hover:bg-wj-green/90"
              onClick={handleAddStage}
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar etapa
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
          {!template ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Modelo não encontrado.
            </div>
          ) : (
            <Kanban<QcTask>
              value={cols}
              onValueChange={setCols}
              getItemValue={(t) => t.id}
              onMove={async ({ activeContainer, overContainer, activeIndex, overIndex }) => {
                // Optimistic UI was already applied via onValueChange in onDragOver flow,
                // but we used onMove so columns are NOT mutated locally. We do it now:
                const fromItems = [...(cols[activeContainer] ?? [])];
                const [moved] = fromItems.splice(activeIndex, 1);
                if (!moved) return;
                if (activeContainer === overContainer) {
                  const arr = [...fromItems];
                  arr.splice(overIndex, 0, moved);
                  setCols({ ...cols, [activeContainer]: arr });
                  // Persist new positions for that column
                  await Promise.all(
                    arr.map((t, i) => updateTask(t.id, { position: i + 1 })),
                  );
                } else {
                  const toItems = [...(cols[overContainer] ?? [])];
                  toItems.splice(overIndex, 0, { ...moved, stage_id: overContainer });
                  setCols({
                    ...cols,
                    [activeContainer]: fromItems,
                    [overContainer]: toItems,
                  });
                  await updateTask(moved.id, {
                    stage_id: overContainer,
                    position: overIndex + 1,
                  });
                  // Re-compact positions in target column
                  await Promise.all(
                    toItems.map((t, i) =>
                      t.id !== moved.id ? updateTask(t.id, { position: i + 1 }) : null,
                    ),
                  );
                }
              }}
            >
              <KanbanBoard className="h-full items-start min-w-max">
                {Object.keys(cols).map((stageId) => {
                  const stage = activeStages.find((s) => s.id === stageId);
                  if (!stage) return null;
                  return (
                    <KanbanColumn
                      key={stageId}
                      value={stageId}
                      className="w-[300px] shrink-0 max-h-full"
                    >
                      <KanbanColumnHeader
                        stage={stage}
                        count={cols[stageId]?.length ?? 0}
                        index={activeStages.findIndex((s) => s.id === stageId)}
                        onRename={(name) => updateStage(stage.id, { name })}
                        onTogglePhoto={(v) => updateStage(stage.id, { requires_photo: v })}
                        onDelete={() => {
                          if (confirm("Remover etapa?")) deleteStage(stage.id);
                        }}
                      />
                      <KanbanColumnContent
                        value={stageId}
                        className="px-2.5 pb-2.5 overflow-y-auto max-h-[60vh] min-h-[60px]"
                      >
                        {(cols[stageId] ?? []).map((task) => (
                          <KanbanItem
                            key={task.id}
                            value={task.id}
                            className="group rounded-lg border border-border/30 bg-background/60 p-2.5 hover:border-wj-green/40 transition-colors"
                          >
                            <TaskKanbanCard
                              task={task}
                              onUpdate={(p) => updateTask(task.id, p)}
                              onDelete={() => deleteTask(task.id)}
                            />
                          </KanbanItem>
                        ))}
                        <button
                          onClick={() =>
                            createTask(stage.id, { label: "Nova tarefa" })
                          }
                          className="mt-1 w-full text-[11px] py-1.5 rounded-md border border-dashed border-border/30 text-muted-foreground hover:text-wj-green hover:border-wj-green/40 transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Tarefa
                        </button>
                      </KanbanColumnContent>
                    </KanbanColumn>
                  );
                })}
              </KanbanBoard>
              <KanbanOverlay>
                {({ variant }) => (
                  <div
                    className={cn(
                      "rounded-lg border border-wj-green/60 bg-background shadow-2xl",
                      variant === "column" ? "h-32 w-[300px]" : "h-12 w-[280px]",
                    )}
                  />
                )}
              </KanbanOverlay>
            </Kanban>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
function KanbanColumnHeader({
  stage,
  count,
  index,
  onRename,
  onTogglePhoto,
  onDelete,
}: {
  stage: QcStage;
  count: number;
  index: number;
  onRename: (name: string) => void;
  onTogglePhoto: (v: boolean) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(stage.name);
  useEffect(() => setName(stage.name), [stage.name]);
  return (
    <div className="p-2.5 border-b border-border/20">
      <div className="flex items-center gap-2">
        <KanbanColumnHandle className="text-muted-foreground/40 hover:text-foreground">
          <GripVertical className="h-3.5 w-3.5" />
        </KanbanColumnHandle>
        <span className="w-6 h-6 rounded-full bg-wj-green/10 text-wj-green text-[10px] font-medium flex items-center justify-center ring-1 ring-wj-green/20 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== stage.name && onRename(name.trim() || stage.name)}
          className="h-7 text-xs bg-transparent border-transparent hover:border-border/40 px-2 font-medium flex-1"
        />
        <button
          onClick={onDelete}
          className="h-6 w-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-2 pl-7">
        <span className="text-[10px] text-muted-foreground">{count} tarefas</span>
        <label
          className={cn(
            "inline-flex items-center gap-1.5 text-[9px] px-1.5 py-0.5 rounded-full cursor-pointer transition-colors",
            stage.requires_photo
              ? "bg-wj-green/10 text-wj-green"
              : "bg-muted/30 text-muted-foreground",
          )}
        >
          <Camera className="h-2.5 w-2.5" />
          Foto
          <Switch
            checked={stage.requires_photo}
            onCheckedChange={onTogglePhoto}
            className="scale-[0.6] -my-1"
          />
        </label>
      </div>
    </div>
  );
}

function TaskKanbanCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: QcTask;
  onUpdate: (p: Partial<QcTask>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(task.label);
  const [editing, setEditing] = useState(false);
  useEffect(() => setLabel(task.label), [task.label]);

  return (
    <div className="flex items-start gap-2">
      <KanbanItemHandle className="pt-0.5 text-muted-foreground/30 hover:text-foreground">
        <GripVertical className="h-3 w-3" />
      </KanbanItemHandle>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdate({ label: label.trim() || task.label });
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setLabel(task.label);
                  setEditing(false);
                }
              }}
              className="h-6 text-[11px] px-1.5"
            />
            <button
              onClick={() => {
                onUpdate({ label: label.trim() || task.label });
                setEditing(false);
              }}
              className="text-wj-green"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                setLabel(task.label);
                setEditing(false);
              }}
              className="text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-left text-[11px] leading-snug w-full hover:text-wj-green"
          >
            {task.label}
          </button>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <label
            className={cn(
              "inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full cursor-pointer",
              task.is_required
                ? "bg-wj-green/10 text-wj-green"
                : "bg-muted/30 text-muted-foreground",
            )}
          >
            Obrig.
            <Switch
              checked={task.is_required}
              onCheckedChange={(v) => onUpdate({ is_required: v })}
              className="scale-[0.55] -my-1"
            />
          </label>
          <button
            onClick={onDelete}
            className="ml-auto h-5 w-5 flex items-center justify-center text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ListChecks,
  GripVertical,
  Loader2,
  Star,
  Pencil,
  Check,
  X,
  Upload,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useQualityControl,
  type QcStage,
  type QcTask,
  type QcTemplate,
} from "@/hooks/qc/useQualityControl";
import QualityControlImportDialog from "./QualityControlImportDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function QualityControlManagerDialog({ open, onOpenChange }: Props) {
  const {
    loading,
    templates,
    stages,
    tasks,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createStage,
    updateStage,
    deleteStage,
    moveStage,
    createTask,
    updateTask,
    deleteTask,
    refetch,
  } = useQualityControl();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingTpl, setEditingTpl] = useState(false);
  const [tplDraft, setTplDraft] = useState<{ name: string; description: string }>({
    name: "",
    description: "",
  });
  const [phase, setPhase] = useState<"picker" | "editor">("picker");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (open) {
      refetch();
      setPhase("picker");
      setEditingTpl(false);
    }
  }, [open, refetch]);

  useEffect(() => {
    if (activeId && !templates.some((t) => t.id === activeId)) {
      setActiveId(null);
      setPhase("picker");
    }
  }, [templates, activeId]);

  const active = useMemo<QcTemplate | null>(
    () => templates.find((t) => t.id === activeId) ?? null,
    [templates, activeId],
  );

  const activeStages = useMemo<QcStage[]>(
    () => stages.filter((s) => s.template_id === activeId).sort((a, b) => a.position - b.position),
    [stages, activeId],
  );

  const stageTasks = (stageId: string): QcTask[] =>
    tasks.filter((t) => t.stage_id === stageId).sort((a, b) => a.position - b.position);

  const startEditTpl = () => {
    if (!active) return;
    setTplDraft({ name: active.name, description: active.description ?? "" });
    setEditingTpl(true);
  };

  const saveTpl = async () => {
    if (!active) return;
    await updateTemplate(active.id, {
      name: tplDraft.name.trim() || active.name,
      description: tplDraft.description.trim() || null,
    });
    setEditingTpl(false);
  };

  const openTemplate = (id: string) => {
    setActiveId(id);
    setPhase("editor");
    setEditingTpl(false);
  };

  const handleCreateNew = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const tpl = await createTemplate({ name });
    setCreating(false);
    setNewName("");
    if (tpl) openTemplate(tpl.id);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-background/95 backdrop-blur-xl border-border/40 p-0 overflow-hidden",
          phase === "picker" ? "max-w-xl" : "max-w-4xl",
        )}
      >
        <DialogHeader className="px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-light flex items-center gap-2">
              {phase === "editor" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 -ml-1"
                  onClick={() => setPhase("picker")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <ListChecks className="h-4 w-4 text-wj-green" />
              Controlo de Qualidade
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {phase === "picker"
              ? "Selecione um modelo existente, crie um novo ou importe."
              : "Configure as etapas e tarefas executadas em cada agendamento."}
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-border/30 mt-3">
          {phase === "picker" ? (
            <div className="p-5 space-y-5">
              {loading && templates.length === 0 ? (
                <div className="py-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> A carregar modelos…
                </div>
              ) : (
                <>
                  {templates.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Selecionar modelo existente
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={activeId ?? ""}
                          onValueChange={(v) => setActiveId(v)}
                        >
                          <SelectTrigger className="h-10 text-sm flex-1">
                            <SelectValue placeholder="Escolha um modelo…" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((t) => {
                              const count = stages.filter((s) => s.template_id === t.id).length;
                              return (
                                <SelectItem key={t.id} value={t.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{t.name}</span>
                                    {t.is_default && (
                                      <Badge className="text-[9px] h-4 bg-wj-green/15 text-wj-green border-wj-green/30 px-1.5">
                                        Padrão
                                      </Badge>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">
                                      · {count} etapa(s)
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-10 bg-wj-green hover:bg-wj-green/90"
                          disabled={!activeId}
                          onClick={() => activeId && openTemplate(activeId)}
                        >
                          Gerir etapas
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="bg-background px-2">
                        {templates.length > 0 ? "ou criar novo" : "criar primeiro modelo"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      Novo modelo
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
                        placeholder="Ex.: Revisão Completa, Entrega de bicicleta…"
                        className="h-10 text-sm flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10"
                        onClick={handleCreateNew}
                        disabled={!newName.trim() || creating}
                      >
                        {creating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Criar e abrir
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <button
                      onClick={() => setImportOpen(true)}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-dashed border-border/40 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-md bg-wj-green/10 text-wj-green flex items-center justify-center">
                          <Upload className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">Importar via CSV ou JSON</div>
                          <div className="text-[10px] text-muted-foreground">
                            Pré-visualize antes de importar · Download de template incluído
                          </div>
                        </div>
                      </div>
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <section className="p-4 max-h-[70vh] overflow-hidden flex flex-col">
              {!active ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                  Modelo não encontrado.
                </div>
              ) : (
                <>
                {/* Template header */}
                <div className="space-y-2 pb-3">
                  {editingTpl ? (
                    <div className="space-y-2">
                      <Input
                        value={tplDraft.name}
                        onChange={(e) => setTplDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="Nome do modelo"
                        className="text-sm h-8"
                      />
                      <Textarea
                        value={tplDraft.description}
                        onChange={(e) =>
                          setTplDraft((d) => ({ ...d, description: e.target.value }))
                        }
                        placeholder="Descrição (opcional)"
                        className="text-xs min-h-12"
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-[10px]" onClick={saveTpl}>
                          <Check className="h-3 w-3 mr-1" /> Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px]"
                          onClick={() => setEditingTpl(false)}
                        >
                          <X className="h-3 w-3 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium truncate">{active.name}</h3>
                        {active.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {active.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px]"
                          onClick={startEditTpl}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 px-2 text-[10px]",
                            active.is_default && "text-wj-green",
                          )}
                          onClick={() => updateTemplate(active.id, { is_default: !active.is_default })}
                          title="Definir como padrão"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-red-400 hover:text-red-300"
                          onClick={() => {
                            if (confirm("Remover este modelo e todas as etapas?")) {
                              deleteTemplate(active.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>
                      {activeStages.length} etapa(s) ·{" "}
                      {activeStages.reduce((acc, s) => acc + stageTasks(s.id).length, 0)} tarefa(s)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={active.is_active}
                        onCheckedChange={(v) => updateTemplate(active.id, { is_active: v })}
                      />
                      <span>Ativo</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stages */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sequência de etapas
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => createStage(active.id, { name: "Nova etapa" })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Etapa
                  </Button>
                </div>

                <ScrollArea className="flex-1 pr-2">
                  {activeStages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg">
                      Sem etapas. Adicione a primeira etapa do controlo de qualidade.
                    </div>
                  ) : (
                    <ol className="space-y-2">
                      {activeStages.map((s, idx) => (
                        <StageEditor
                          key={s.id}
                          index={idx}
                          stage={s}
                          tasks={stageTasks(s.id)}
                          isFirst={idx === 0}
                          isLast={idx === activeStages.length - 1}
                          onUpdate={(p) => updateStage(s.id, p)}
                          onDelete={() => deleteStage(s.id)}
                          onMoveUp={() => moveStage(s.id, -1)}
                          onMoveDown={() => moveStage(s.id, 1)}
                          onAddTask={() => createTask(s.id, { label: "Nova tarefa" })}
                          onUpdateTask={(id, p) => updateTask(id, p)}
                          onDeleteTask={(id) => deleteTask(id)}
                        />
                      ))}
                    </ol>
                  )}
                </ScrollArea>
                </>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
    <QualityControlImportDialog
      open={importOpen}
      onOpenChange={setImportOpen}
      onImported={(id) => openTemplate(id)}
    />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage editor                                                        */
/* ------------------------------------------------------------------ */

function StageEditor({
  index,
  stage,
  tasks,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: {
  index: number;
  stage: QcStage;
  tasks: QcTask[];
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (p: Partial<QcStage>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddTask: () => void;
  onUpdateTask: (id: string, p: Partial<QcTask>) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [name, setName] = useState(stage.name);
  const [desc, setDesc] = useState(stage.description ?? "");

  useEffect(() => setName(stage.name), [stage.name]);
  useEffect(() => setDesc(stage.description ?? ""), [stage.description]);

  return (
    <li className="border border-border/30 rounded-lg bg-muted/10 overflow-hidden">
      <div className="flex items-start gap-2 p-2.5">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="w-6 h-6 rounded-full bg-wj-green/15 text-wj-green text-[10px] font-semibold flex items-center justify-center">
            {index + 1}
          </span>
          <button
            disabled={isFirst}
            onClick={onMoveUp}
            className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            disabled={isLast}
            onClick={onMoveDown}
            className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name !== stage.name && onUpdate({ name: name.trim() || stage.name })}
            placeholder="Nome da etapa"
            className="text-sm h-8"
          />
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() =>
              (desc || "") !== (stage.description ?? "") &&
              onUpdate({ description: desc.trim() || null })
            }
            placeholder="Descrição da etapa (opcional)"
            className="text-xs min-h-10"
          />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
              <Switch
                checked={stage.requires_photo}
                onCheckedChange={(v) => onUpdate({ requires_photo: v })}
              />
              <Camera className="h-3 w-3" />
              Exige fotografia
            </label>
            {stage.requires_photo && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground">Mín. fotos</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={stage.photo_min_count}
                  onChange={(e) =>
                    onUpdate({ photo_min_count: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="h-7 w-14 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-red-400 hover:text-red-300"
          onClick={() => {
            if (confirm("Remover esta etapa?")) onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Tasks */}
      <div className="border-t border-border/20 bg-background/40 px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Tarefas ({tasks.length})
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px]"
            onClick={onAddTask}
          >
            <Plus className="h-3 w-3 mr-1" /> Tarefa
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic py-1">Sem tarefas.</p>
        ) : (
          <ul className="space-y-1">
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onUpdate={(p) => onUpdateTask(t.id, p)}
                onDelete={() => onDeleteTask(t.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function TaskRow({
  task,
  onUpdate,
  onDelete,
}: {
  task: QcTask;
  onUpdate: (p: Partial<QcTask>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(task.label);
  useEffect(() => setLabel(task.label), [task.label]);

  return (
    <li className="flex items-center gap-1.5 group">
      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== task.label && onUpdate({ label: label.trim() || task.label })}
        className="h-7 text-xs"
      />
      <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
        <Switch
          checked={task.is_required}
          onCheckedChange={(v) => onUpdate({ is_required: v })}
        />
        Obrig.
      </label>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 text-red-400/70 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </li>
  );
}
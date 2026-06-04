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
  Maximize2,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useQualityControl,
  type QcStage,
  type QcTask,
  type QcTemplate,
} from "@/hooks/qc/useQualityControl";
import QualityControlImportDialog from "./QualityControlImportDialog";
import QualityControlKanbanDialog from "./QualityControlKanbanDialog";

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
  const [importAppendOpen, setImportAppendOpen] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const toggleStage = (id: string) =>
    setCollapsedStages((prev) => ({ ...prev, [id]: !prev[id] }));

  const allCollapsed =
    activeId != null &&
    stages.filter((s) => s.template_id === activeId).every((s) => collapsedStages[s.id]);
  const toggleAllStages = () => {
    if (!activeId) return;
    const ids = stages.filter((s) => s.template_id === activeId).map((s) => s.id);
    if (ids.length === 0) return;
    const next = { ...collapsedStages };
    const shouldCollapse = !allCollapsed;
    ids.forEach((id) => (next[id] = shouldCollapse));
    setCollapsedStages(next);
  };

  // Map current stages → import payload shape (for "Usar exemplo" pre-fill)
  const currentStagesForImport = useMemo(() => {
    if (!activeId) return [];
    return stages
      .filter((s) => s.template_id === activeId)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        name: s.name,
        description: s.description ?? null,
        requires_photo: !!s.requires_photo,
        photo_min_count: s.photo_min_count ?? 1,
        tasks: tasks
          .filter((t) => t.stage_id === s.id)
          .sort((a, b) => a.position - b.position)
          .map((t) => ({
            label: t.label,
            description: t.description ?? null,
            is_required: !!t.is_required,
          })),
      }));
  }, [activeId, stages, tasks]);

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
          phase === "picker" ? "max-w-3xl" : "max-w-4xl",
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
            <div className="p-5 space-y-4">
              {loading && templates.length === 0 ? (
                <div className="py-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> A carregar modelos…
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Modelos disponíveis ({templates.length})
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      Clique para gerir as etapas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {templates.map((t, i) => {
                      const tplStages = stages.filter((s) => s.template_id === t.id);
                      const tplTasks = tasks.filter((k) =>
                        tplStages.some((s) => s.id === k.stage_id),
                      );
                      return (
                        <button
                          key={t.id}
                          onClick={() => openTemplate(t.id)}
                          className={cn(
                            "group relative text-left rounded-xl border bg-background/40 hover:bg-wj-green/[0.04]",
                            "border-border/40 hover:border-wj-green/50 transition-all p-3 flex flex-col gap-2 min-h-[112px]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="h-6 w-6 rounded-md bg-wj-green/15 text-wj-green text-[10px] font-semibold flex items-center justify-center shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {t.is_default && (
                              <Badge className="text-[9px] h-4 bg-wj-green/15 text-wj-green border-wj-green/30 px-1.5">
                                <Star className="h-2.5 w-2.5 mr-0.5" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium leading-tight line-clamp-2">
                              {t.name}
                            </p>
                            {t.description && (
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                {t.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                            <span>
                              {tplStages.length} etapa(s) · {tplTasks.length} tarefa(s)
                            </span>
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                t.is_active ? "bg-wj-green" : "bg-muted-foreground/40",
                              )}
                            />
                          </div>
                        </button>
                      );
                    })}

                    {/* Always-present "Add new" card */}
                    <button
                      onClick={() => {
                        const el = document.getElementById("qc-new-name-input");
                        el?.focus();
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className={cn(
                        "rounded-xl border border-dashed border-border/40 hover:border-wj-green/60",
                        "bg-background/20 hover:bg-wj-green/[0.04] transition-all p-3",
                        "flex flex-col items-center justify-center gap-1.5 min-h-[112px] text-muted-foreground hover:text-wj-green",
                      )}
                    >
                      <div className="h-9 w-9 rounded-full border border-dashed border-current flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-medium">Adicionar novo</span>
                      <span className="text-[10px] opacity-70">Criar modelo personalizado</span>
                    </button>
                  </div>

                  {/* Inline create */}
                  <div className="space-y-1.5 pt-1">
                    <Label
                      htmlFor="qc-new-name-input"
                      className="text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      Criar novo modelo
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="qc-new-name-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
                        placeholder="Ex.: Revisão Completa, Entrega de bicicleta…"
                        className="h-10 text-sm flex-1"
                      />
                      <Button
                        size="sm"
                        className="h-10 bg-wj-green hover:bg-wj-green/90"
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
            <section className="p-5 max-h-[72vh] overflow-hidden flex flex-col">
              {!active ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                  Modelo não encontrado.
                </div>
              ) : (
                <>
                {/* Template header */}
                <div className="space-y-3 pb-4">
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
                        <h3 className="text-base font-light tracking-tight truncate">{active.name}</h3>
                        {active.description ? (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {active.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/60 mt-1 italic">
                            Sem descrição
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px]"
                          onClick={startEditTpl}
                          title="Editar"
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
                          title="Remover"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Stat chips */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/30 text-[10px] text-muted-foreground">
                        <ListChecks className="h-2.5 w-2.5" />
                        {activeStages.length} etapas
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/30 text-[10px] text-muted-foreground">
                        {activeStages.reduce((acc, s) => acc + stageTasks(s.id).length, 0)} tarefas
                      </span>
                      {active.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-wj-green/10 text-[10px] text-wj-green">
                          <Star className="h-2.5 w-2.5" /> Padrão
                        </span>
                      )}
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                      <Switch
                        checked={active.is_active}
                        onCheckedChange={(v) => updateTemplate(active.id, { is_active: v })}
                      />
                      Ativo
                    </label>
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* Stages toolbar */}
                <div className="flex items-center justify-between py-3">
                  <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Sequência
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setKanbanOpen(true)}
                      title="Abrir Kanban em ecrã cheio"
                    >
                      <Maximize2 className="h-3 w-3 mr-1" /> Kanban
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={toggleAllStages}
                      disabled={activeStages.length === 0}
                      title={allCollapsed ? "Expandir todas" : "Fechar todas"}
                    >
                      {allCollapsed ? (
                        <>
                          <ChevronsUpDown className="h-3 w-3 mr-1" /> Expandir
                        </>
                      ) : (
                        <>
                          <ChevronsDownUp className="h-3 w-3 mr-1" /> Fechar tudo
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setImportAppendOpen(true)}
                      title="Importar etapas via CSV ou JSON"
                    >
                      <Upload className="h-3 w-3 mr-1" /> Importar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-2.5 text-[10px] bg-wj-green hover:bg-wj-green/90"
                      onClick={() => createStage(active.id, { name: "Nova etapa" })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Etapa
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 pr-2 -mr-2">
                  {activeStages.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                      <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2">
                        <ListChecks className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <p className="text-xs text-muted-foreground">Sem etapas ainda</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        Adicione manualmente ou importe uma sequência
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => setImportAppendOpen(true)}
                        >
                          <Upload className="h-3 w-3 mr-1" /> Importar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-[10px] bg-wj-green hover:bg-wj-green/90"
                          onClick={() => createStage(active.id, { name: "Nova etapa" })}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Nova etapa
                        </Button>
                      </div>
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
                          collapsed={!!collapsedStages[s.id]}
                          onToggleCollapsed={() => toggleStage(s.id)}
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
      onImported={async (id) => {
        await refetch();
        openTemplate(id);
      }}
    />
    <QualityControlImportDialog
      open={importAppendOpen}
      onOpenChange={setImportAppendOpen}
      appendToTemplateId={active?.id}
      appendTemplateName={active?.name}
      currentStages={currentStagesForImport}
      onImported={async () => {
        await refetch();
        setImportAppendOpen(false);
      }}
    />
    <QualityControlKanbanDialog
      open={kanbanOpen}
      onOpenChange={setKanbanOpen}
      templateId={active?.id ?? null}
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
  collapsed,
  onToggleCollapsed,
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
  collapsed: boolean;
  onToggleCollapsed: () => void;
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
    <li className="group/stage border border-border/20 rounded-xl bg-background/30 hover:bg-background/50 hover:border-border/40 transition-colors overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="flex flex-col items-center gap-1 pt-1.5">
          <span className="w-7 h-7 rounded-full bg-wj-green/10 text-wj-green text-[11px] font-medium flex items-center justify-center ring-1 ring-wj-green/20">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col items-center opacity-0 group-hover/stage:opacity-100 transition-opacity">
            <button
              disabled={isFirst}
              onClick={onMoveUp}
              className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 p-0.5"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              disabled={isLast}
              onClick={onMoveDown}
              className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 p-0.5"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapsed}
              className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              title={collapsed ? "Expandir" : "Recolher"}
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  !collapsed && "rotate-90",
                )}
              />
            </button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name !== stage.name && onUpdate({ name: name.trim() || stage.name })}
            placeholder="Nome da etapa"
              className="text-sm h-8 bg-transparent border-transparent hover:border-border/40 focus:border-border/60 px-2 font-medium flex-1"
          />
            {collapsed && (
              <span className="text-[10px] text-muted-foreground bg-muted/30 rounded-full px-2 py-0.5 shrink-0">
                {tasks.length} tarefa(s)
              </span>
            )}
          </div>

          {!collapsed && (
            <>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() =>
              (desc || "") !== (stage.description ?? "") &&
              onUpdate({ description: desc.trim() || null })
            }
            placeholder="Descrição (opcional)"
            className="text-xs min-h-9 bg-transparent border-transparent hover:border-border/40 focus:border-border/60 px-2 resize-none"
          />
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <label
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full cursor-pointer transition-colors",
                stage.requires_photo
                  ? "bg-wj-green/10 text-wj-green"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Camera className="h-3 w-3" />
              Fotografia
              <Switch
                checked={stage.requires_photo}
                onCheckedChange={(v) => onUpdate({ requires_photo: v })}
                className="scale-75 -my-1"
              />
            </label>
            {stage.requires_photo && (
              <div className="inline-flex items-center gap-1.5 text-[10px] bg-muted/30 rounded-full pl-2 pr-1 py-0.5">
                <span className="text-muted-foreground">Mín.</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={stage.photo_min_count}
                  onChange={(e) =>
                    onUpdate({ photo_min_count: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="h-5 w-10 text-[10px] text-center px-1 bg-background/50 border-border/30"
                />
              </div>
            )}
          </div>
            </>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-red-400 opacity-0 group-hover/stage:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm("Remover esta etapa?")) onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Tasks */}
      {!collapsed && (
      <div className="border-t border-border/15 bg-muted/[0.03] px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Tarefas · {tasks.length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={onAddTask}
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic py-1">Sem tarefas.</p>
        ) : (
          <ul className="space-y-0.5">
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
      )}
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
    <li className="flex items-center gap-1.5 group rounded-md hover:bg-background/50 px-1 py-0.5 transition-colors">
      <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0 cursor-grab" />
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== task.label && onUpdate({ label: label.trim() || task.label })}
        className="h-7 text-xs bg-transparent border-transparent hover:border-border/30 focus:border-border/50 px-2"
      />
      <label
        className={cn(
          "inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full shrink-0 cursor-pointer transition-colors",
          task.is_required
            ? "bg-wj-green/10 text-wj-green"
            : "bg-muted/20 text-muted-foreground/70",
        )}
      >
        Obrig.
        <Switch
          checked={task.is_required}
          onCheckedChange={(v) => onUpdate({ is_required: v })}
          className="scale-[0.6] -my-1"
        />
      </label>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </li>
  );
}
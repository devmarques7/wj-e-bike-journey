import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type QcTemplate = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type QcStage = {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  position: number;
  requires_photo: boolean;
  photo_min_count: number;
};

export type QcTask = {
  id: string;
  stage_id: string;
  label: string;
  description: string | null;
  position: number;
  is_required: boolean;
};

export function useQualityControl() {
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [stages, setStages] = useState<QcStage[]>([]);
  const [tasks, setTasks] = useState<QcTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes, kRes] = await Promise.all([
        supabase.from("qc_templates").select("*").order("created_at", { ascending: true }),
        supabase.from("qc_stages").select("*").order("position", { ascending: true }),
        supabase.from("qc_tasks").select("*").order("position", { ascending: true }),
      ]);
      if (tRes.error) throw tRes.error;
      if (sRes.error) throw sRes.error;
      if (kRes.error) throw kRes.error;
      setTemplates((tRes.data ?? []) as QcTemplate[]);
      setStages((sRes.data ?? []) as QcStage[]);
      setTasks((kRes.data ?? []) as QcTask[]);
    } catch (e: any) {
      console.error("[qc] fetch", e);
      toast.error(e.message ?? "Falha a carregar Quality Control");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------- Templates ---------- */
  const createTemplate = async (input: Partial<QcTemplate>) => {
    const { data, error } = await supabase
      .from("qc_templates")
      .insert({
        name: input.name ?? "Novo modelo",
        description: input.description ?? null,
        is_default: input.is_default ?? false,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success("Modelo criado");
    await fetchAll();
    return data as QcTemplate;
  };

  const updateTemplate = async (id: string, patch: Partial<QcTemplate>) => {
    const { error } = await supabase.from("qc_templates").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Modelo atualizado");
    fetchAll();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("qc_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Modelo removido");
    fetchAll();
  };

  /* ---------- Stages ---------- */
  const createStage = async (template_id: string, input: Partial<QcStage>) => {
    const next =
      Math.max(0, ...stages.filter((s) => s.template_id === template_id).map((s) => s.position)) + 1;
    const { error } = await supabase.from("qc_stages").insert({
      template_id,
      name: input.name ?? "Nova etapa",
      description: input.description ?? null,
      position: input.position ?? next,
      requires_photo: input.requires_photo ?? false,
      photo_min_count: input.photo_min_count ?? 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Etapa criada");
    fetchAll();
  };

  const updateStage = async (id: string, patch: Partial<QcStage>) => {
    const { error } = await supabase.from("qc_stages").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const deleteStage = async (id: string) => {
    const { error } = await supabase.from("qc_stages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Etapa removida");
    fetchAll();
  };

  const moveStage = async (id: string, dir: -1 | 1) => {
    const stage = stages.find((s) => s.id === id);
    if (!stage) return;
    const sibling = stages
      .filter((s) => s.template_id === stage.template_id)
      .sort((a, b) => a.position - b.position);
    const idx = sibling.findIndex((s) => s.id === id);
    const target = sibling[idx + dir];
    if (!target) return;
    await Promise.all([
      supabase.from("qc_stages").update({ position: target.position }).eq("id", stage.id),
      supabase.from("qc_stages").update({ position: stage.position }).eq("id", target.id),
    ]);
    fetchAll();
  };

  /* ---------- Tasks ---------- */
  const createTask = async (stage_id: string, input: Partial<QcTask>) => {
    const next =
      Math.max(0, ...tasks.filter((t) => t.stage_id === stage_id).map((t) => t.position)) + 1;
    const { error } = await supabase.from("qc_tasks").insert({
      stage_id,
      label: input.label ?? "Nova tarefa",
      description: input.description ?? null,
      position: input.position ?? next,
      is_required: input.is_required ?? true,
    });
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const updateTask = async (id: string, patch: Partial<QcTask>) => {
    const { error } = await supabase.from("qc_tasks").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("qc_tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  /* ---------- Import ---------- */
  type ImportPayload = {
    name: string;
    description?: string | null;
    is_default?: boolean;
    is_active?: boolean;
    stages?: Array<{
      name: string;
      description?: string | null;
      requires_photo?: boolean;
      photo_min_count?: number;
      tasks?: Array<{ label: string; description?: string | null; is_required?: boolean }>;
    }>;
  };

  const importTemplate = async (payload: ImportPayload) => {
    if (!payload?.name?.trim()) {
      toast.error("O modelo importado precisa de um nome.");
      return null;
    }
    const { data: tpl, error: tplErr } = await supabase
      .from("qc_templates")
      .insert({
        name: payload.name.trim(),
        description: payload.description ?? null,
        is_default: payload.is_default ?? false,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();
    if (tplErr || !tpl) {
      toast.error(tplErr?.message ?? "Falha a criar modelo");
      return null;
    }

    const stagesPayload = (payload.stages ?? []).map((s, i) => ({
      template_id: tpl.id,
      name: s.name,
      description: s.description ?? null,
      position: i + 1,
      requires_photo: !!s.requires_photo,
      photo_min_count: s.photo_min_count ?? 1,
    }));

    if (stagesPayload.length) {
      const { data: insertedStages, error: sErr } = await supabase
        .from("qc_stages")
        .insert(stagesPayload)
        .select();
      if (sErr) {
        toast.error(sErr.message);
      } else if (insertedStages) {
        const tasksPayload: any[] = [];
        insertedStages
          .sort((a: any, b: any) => a.position - b.position)
          .forEach((st: any, idx: number) => {
            const src = payload.stages?.[idx];
            (src?.tasks ?? []).forEach((t, j) => {
              if (!t?.label) return;
              tasksPayload.push({
                stage_id: st.id,
                label: t.label,
                description: t.description ?? null,
                position: j + 1,
                is_required: t.is_required ?? true,
              });
            });
          });
        if (tasksPayload.length) {
          const { error: kErr } = await supabase.from("qc_tasks").insert(tasksPayload);
          if (kErr) toast.error(kErr.message);
        }
      }
    }

    toast.success("Modelo importado");
    await fetchAll();
    return tpl as QcTemplate;
  };

  const importStagesIntoTemplate = async (
    templateId: string,
    payloadStages: ImportPayload["stages"],
  ) => {
    if (!payloadStages || payloadStages.length === 0) {
      toast.error("Nenhuma etapa para importar");
      return false;
    }
    const basePos =
      Math.max(0, ...stages.filter((s) => s.template_id === templateId).map((s) => s.position)) + 1;
    const stagesPayload = payloadStages.map((s, i) => ({
      template_id: templateId,
      name: s.name,
      description: s.description ?? null,
      position: basePos + i,
      requires_photo: !!s.requires_photo,
      photo_min_count: s.photo_min_count ?? 1,
    }));
    const { data: inserted, error: sErr } = await supabase
      .from("qc_stages")
      .insert(stagesPayload)
      .select();
    if (sErr || !inserted) {
      toast.error(sErr?.message ?? "Falha a importar etapas");
      return false;
    }
    const tasksPayload: any[] = [];
    inserted
      .sort((a: any, b: any) => a.position - b.position)
      .forEach((st: any, idx: number) => {
        const src = payloadStages[idx];
        (src?.tasks ?? []).forEach((t, j) => {
          if (!t?.label) return;
          tasksPayload.push({
            stage_id: st.id,
            label: t.label,
            description: t.description ?? null,
            position: j + 1,
            is_required: t.is_required ?? true,
          });
        });
      });
    if (tasksPayload.length) {
      const { error: kErr } = await supabase.from("qc_tasks").insert(tasksPayload);
      if (kErr) toast.error(kErr.message);
    }
    toast.success(`${inserted.length} etapa(s) importada(s)`);
    await fetchAll();
    return true;
  };

  return {
    loading,
    templates,
    stages,
    tasks,
    refetch: fetchAll,
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
    importTemplate,
    importStagesIntoTemplate,
  };
}
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
    if (error) return toast.error(error.message);
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
  };
}
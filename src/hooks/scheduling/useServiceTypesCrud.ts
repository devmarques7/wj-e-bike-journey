import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceTypeRow = {
  id: string;
  name: string;
  name_en: string | null;
  name_nl: string | null;
  slug: string;
  description: string | null;
  duration_minutes: number;
  base_price: number | null;
  color: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  is_emergency: boolean;
  priority_score: number;
  covered_by_plan_levels: number[] | null;
  required_specializations: string[] | null;
  buffer_minutes_override: number | null;
  created_at?: string;
};

export function useServiceTypesCrud() {
  const [rows, setRows] = useState<ServiceTypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_types")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      toast.error(error.message);
    } else {
      setRows((data ?? []) as ServiceTypeRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upsert = useCallback(
    async (input: Partial<ServiceTypeRow>) => {
      const payload: any = { ...input };
      const { data, error } = await supabase
        .from("service_types")
        .upsert(payload)
        .select("*")
        .single();
      if (error) {
        toast.error(error.message);
        return null;
      }
      toast.success(input.id ? "Serviço atualizado" : "Serviço criado");
      await fetchAll();
      return data as ServiceTypeRow;
    },
    [fetchAll],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("service_types").delete().eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Serviço removido");
      await fetchAll();
      return true;
    },
    [fetchAll],
  );

  const toggleActive = useCallback(
    async (id: string, is_active: boolean) => {
      const { error } = await supabase
        .from("service_types")
        .update({ is_active })
        .eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await fetchAll();
      return true;
    },
    [fetchAll],
  );

  return { rows, loading, refetch: fetchAll, upsert, remove, toggleActive };
}
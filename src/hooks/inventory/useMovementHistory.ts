import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MovementHistoryRow = {
  id: string;
  variant_id: string;
  location_id: string;
  movement_type: string;
  qty_delta: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  variant?: {
    sku: string;
    name: string;
    product?: { id: string; name: string; product_type?: string };
  } | null;
  location?: { id: string; name: string; location_type?: string } | null;
  actor?: { user_id: string; full_name: string | null; email: string | null } | null;
};

export interface MovementFilters {
  search?: string;
  movementType?: string; // "all" | enum
  locationId?: string; // "all" | id
  actorId?: string; // "all" | user_id
  from?: string | null; // ISO date
  to?: string | null; // ISO date
  limit?: number;
}

/**
 * Full Inventory History — flexible movements log with who/where/when/how.
 * Pulls movements then enriches with profile (full_name, email) for the actor.
 */
export function useMovementHistory(filters: MovementFilters = {}) {
  const [rows, setRows] = useState<MovementHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    search = "",
    movementType = "all",
    locationId = "all",
    actorId = "all",
    from = null,
    to = null,
    limit = 500,
  } = filters;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("inventory_movements")
      .select(
        `id, variant_id, location_id, movement_type, qty_delta, reference_type,
         reference_id, notes, created_by, created_at,
         variant:product_variants(sku, name, product:products(id, name, product_type)),
         location:locations(id, name, location_type)`
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (movementType && movementType !== "all") q = q.eq("movement_type", movementType as any);
    if (locationId && locationId !== "all") q = q.eq("location_id", locationId);
    if (actorId && actorId !== "all") q = q.eq("created_by", actorId);
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }

    const { data, error } = await q;
    if (error) {
      setError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const base = (data as unknown as MovementHistoryRow[]) ?? [];
    const actorIds = Array.from(new Set(base.map((r) => r.created_by).filter(Boolean) as string[]));
    let actorMap = new Map<string, { user_id: string; full_name: string | null; email: string | null }>();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", actorIds);
      (profiles ?? []).forEach((p: any) =>
        actorMap.set(p.user_id, { user_id: p.user_id, full_name: p.full_name, email: p.email })
      );
    }

    let enriched = base.map((r) => ({
      ...r,
      actor: r.created_by ? actorMap.get(r.created_by) ?? null : null,
    }));

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      enriched = enriched.filter((r) => {
        const hay = [
          r.variant?.sku,
          r.variant?.name,
          r.variant?.product?.name,
          r.location?.name,
          r.notes,
          r.actor?.full_name,
          r.actor?.email,
          r.reference_type,
          r.reference_id,
          r.movement_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(s);
      });
    }

    setRows(enriched);
    setError(null);
    setLoading(false);
  }, [search, movementType, locationId, actorId, from, to, limit]);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("movement-history-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inventory_movements" },
        fetchAll
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll]);

  const summary = useMemo(() => {
    let inQty = 0;
    let outQty = 0;
    const actors = new Set<string>();
    const types = new Set<string>();
    for (const r of rows) {
      if (r.qty_delta >= 0) inQty += r.qty_delta;
      else outQty += Math.abs(r.qty_delta);
      if (r.created_by) actors.add(r.created_by);
      types.add(r.movement_type);
    }
    return { total: rows.length, inQty, outQty, actors: actors.size, types: types.size };
  }, [rows]);

  return { rows, loading, error, refetch: fetchAll, summary };
}
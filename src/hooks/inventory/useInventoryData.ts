import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type InventoryRow = {
  id: string;
  variant_id: string;
  location_id: string;
  qty_available: number;
  qty_reserved: number;
  qty_incoming: number;
  low_stock_threshold: number;
  reorder_point: number;
  updated_at: string;
  variant: {
    sku: string;
    name: string;
    price_override: number | null;
    is_active: boolean;
    product: {
      id: string;
      name: string;
      slug: string;
      base_price: number;
      product_type: string;
      category_id: string;
    };
  };
  location: { id: string; name: string; location_type: string };
};

export type MovementRow = {
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
  variant?: { sku: string; name: string; product?: { id: string; name: string } };
  location?: { name: string };
};

/** Fetch full inventory rows with variant + product + location joined. */
export function useInventoryRows() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select(
        `id, variant_id, location_id, qty_available, qty_reserved, qty_incoming,
         low_stock_threshold, reorder_point, updated_at,
         variant:product_variants!inner(sku, name, price_override, is_active,
           product:products!inner(id, name, slug, base_price, product_type, category_id)
         ),
         location:locations!inner(id, name, location_type)`
      )
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data as unknown as InventoryRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("inventory-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return { rows, loading, error, refetch: fetchAll };
}

/** KPIs computed from the joined inventory rows. */
export function useInventoryKPIs(rows: InventoryRow[]) {
  return useMemo(() => {
    const skus = new Set(rows.map((r) => r.variant_id)).size;
    let lowStock = 0;
    let incoming = 0;
    let reserved = 0;
    let value = 0;
    for (const r of rows) {
      const real = r.qty_available - r.qty_reserved;
      if (real <= r.low_stock_threshold) lowStock += 1;
      incoming += r.qty_incoming;
      reserved += r.qty_reserved;
      const unitPrice = r.variant.price_override ?? r.variant.product.base_price ?? 0;
      value += r.qty_available * Number(unitPrice);
    }
    return { skus, lowStock, incoming, reserved, value };
  }, [rows]);
}

/** Recent movements log. */
export function useMovements(limit = 50) {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("inventory_movements")
      .select(
        `id, variant_id, location_id, movement_type, qty_delta, reference_type,
         reference_id, notes, created_by, created_at,
         variant:product_variants(sku, name, product:products(id, name)),
         location:locations(name)`
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    setMovements((data as unknown as MovementRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("movements-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inventory_movements" },
        fetchAll
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [limit]);

  return { movements, loading, refetch: fetchAll };
}

/** Mutation: transactional stock adjust via RPC. */
export async function adjustStock(args: {
  variantId: string;
  locationId: string;
  delta: number;
  movementType:
    | "sale"
    | "return"
    | "adjustment"
    | "transfer"
    | "incoming"
    | "reservation"
    | "reservation_release";
  notes?: string;
}) {
  const { data, error } = await supabase.rpc("fn_adjust_stock", {
    p_variant_id: args.variantId,
    p_location_id: args.locationId,
    p_delta: args.delta,
    p_movement_type: args.movementType,
    p_reference_type: null,
    p_reference_id: null,
    p_notes: args.notes ?? null,
  });
  if (error) throw error;
  return data;
}
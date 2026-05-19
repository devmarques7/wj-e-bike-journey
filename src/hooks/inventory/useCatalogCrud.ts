import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  type: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
};

export type Location = {
  id: string;
  name: string;
  location_type: string;
  address: string | null;
  is_active: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  base_price: number;
  sale_price: number | null;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  short_description: string | null;
  description: string | null;
  sku_prefix: string | null;
  color_hex: string | null;
};

export type Variant = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price_override: number | null;
  attributes: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  weight_grams: number | null;
};

/* -------------------- CATEGORIES -------------------- */
export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, type, parent_id, display_order, is_active")
      .order("display_order", { ascending: true });
    setData((data as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

export async function upsertCategory(c: Partial<Category> & { name: string; slug: string; type: string }) {
  const { error, data } = await supabase.from("categories").upsert(c as any).select().single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- LOCATIONS -------------------- */
export function useLocations() {
  const [data, setData] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("id, name, location_type, address, is_active")
      .order("name");
    setData((data as Location[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

export async function upsertLocation(l: Partial<Location> & { name: string; location_type: string }) {
  const { error, data } = await supabase.from("locations").upsert(l as any).select().single();
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(id: string) {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- PRODUCTS -------------------- */
export function useProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, product_type, base_price, sale_price, category_id, is_active, is_featured, short_description, description, sku_prefix, color_hex",
      )
      .order("created_at", { ascending: false });
    setData((data as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

export function useProduct(productId: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from("products").select("*").eq("id", productId).maybeSingle(),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("is_default", { ascending: false }),
    ]);
    setProduct((p as Product) ?? null);
    setVariants((v as Variant[]) ?? []);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { product, variants, loading, refetch };
}

export async function upsertProduct(p: Partial<Product> & { name: string; slug: string; product_type: string; base_price: number; category_id: string }) {
  const { error, data } = await supabase.from("products").upsert(p as any).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- VARIANTS -------------------- */
export async function upsertVariant(v: Partial<Variant> & { product_id: string; sku: string; name: string }) {
  const { error, data } = await supabase.from("product_variants").upsert(v as any).select().single();
  if (error) throw error;
  return data as Variant;
}

export async function deleteVariant(id: string) {
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) throw error;
}
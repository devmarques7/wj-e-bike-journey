
-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN CREATE TYPE product_type_enum AS ENUM ('bike','accessory','service','bundle','subscription_addon','insurance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE category_type_enum AS ENUM ('bike','accessory','service','insurance','part'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE location_type_enum AS ENUM ('warehouse','store_floor','virtual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE movement_type_enum AS ENUM ('sale','return','adjustment','transfer','incoming','reservation','reservation_release'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tag_type_enum AS ENUM ('use_case','terrain','rider_level','feature','style'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TIMESTAMP HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============================================================
-- CATEGORIES + CLOSURE
-- ============================================================
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_nl text, name_en text, name_pt text,
  type category_type_enum NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE public.category_closure (
  ancestor_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  descendant_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  depth int NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE OR REPLACE FUNCTION public.fn_insert_category_closure()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  INSERT INTO public.category_closure (ancestor_id, descendant_id, depth) VALUES (NEW.id, NEW.id, 0);
  IF NEW.parent_id IS NOT NULL THEN
    INSERT INTO public.category_closure (ancestor_id, descendant_id, depth)
    SELECT ancestor_id, NEW.id, depth + 1 FROM public.category_closure WHERE descendant_id = NEW.parent_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_category_closure AFTER INSERT ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_insert_category_closure();

INSERT INTO public.categories (slug, name, name_nl, name_en, name_pt, type, display_order) VALUES
  ('bikes','Bikes','Fietsen','Bikes','Bicicletas','bike',1),
  ('accessories','Accessories','Accessoires','Accessories','Acessórios','accessory',2),
  ('services','Services','Services','Services','Serviços','service',3),
  ('insurance','Insurance','Verzekering','Insurance','Seguros','insurance',4),
  ('parts','Parts','Onderdelen','Parts','Peças','part',5);

-- ============================================================
-- PRODUCTS / VARIANTS / IMAGES / SPECS / TAGS
-- ============================================================
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  sku_prefix text,
  name text NOT NULL,
  name_nl text, name_en text, name_pt text,
  slug text NOT NULL UNIQUE,
  description text, description_nl text, description_en text, short_description text,
  product_type product_type_enum NOT NULL,
  base_price numeric(10,2) NOT NULL,
  sale_price numeric(10,2),
  currency text NOT NULL DEFAULT 'EUR',
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_subscription_exclusive boolean NOT NULL DEFAULT false,
  weight_grams int,
  meta_title text, meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_type ON public.products(product_type);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE public.product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_override numeric(10,2),
  weight_grams int,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pv_product ON public.product_variants(product_id);
CREATE UNIQUE INDEX idx_pv_default ON public.product_variants(product_id) WHERE is_default = true;

CREATE TABLE public.product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  url text NOT NULL, alt text,
  display_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);

CREATE TABLE public.product_specifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_group text NOT NULL, spec_key text NOT NULL, spec_value text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_specs_product ON public.product_specifications(product_id);

CREATE TABLE public.tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  tag_type tag_type_enum NOT NULL
);
CREATE TABLE public.product_tag_map (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

INSERT INTO public.tags (name, tag_type) VALUES
  ('commuter','use_case'),('recreational','use_case'),('cargo','use_case'),
  ('mountain','terrain'),('urban','terrain'),('mixed','terrain'),
  ('beginner','rider_level'),('intermediate','rider_level'),('advanced','rider_level'),
  ('long_range','feature'),('lightweight','feature'),('integrated_lights','feature'),
  ('suspension','feature'),('mid_drive','feature'),('hub_drive','feature');

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE public.locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location_type location_type_enum NOT NULL,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.locations (name, location_type) VALUES
  ('Rotterdam Main Warehouse','warehouse'),
  ('Store Floor Stock','store_floor'),
  ('Virtual Services','virtual');

CREATE TABLE public.inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id),
  qty_available int NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
  qty_reserved int NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  qty_incoming int NOT NULL DEFAULT 0 CHECK (qty_incoming >= 0),
  low_stock_threshold int NOT NULL DEFAULT 3,
  reorder_point int NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, location_id)
);
CREATE INDEX idx_inventory_variant ON public.inventory(variant_id);
CREATE INDEX idx_inventory_location ON public.inventory(location_id);
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE public.inventory_movements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  movement_type movement_type_enum NOT NULL,
  qty_delta int NOT NULL,
  reference_type text, reference_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_mov_variant ON public.inventory_movements(variant_id);
CREATE INDEX idx_inv_mov_ref ON public.inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inv_mov_created ON public.inventory_movements(created_at DESC);

-- ============================================================
-- VIEW: stock per product/variant
-- ============================================================
CREATE OR REPLACE VIEW public.v_product_stock AS
SELECT
  p.id AS product_id, p.name AS product_name, p.slug, p.category_id, p.product_type,
  pv.id AS variant_id, pv.sku, pv.name AS variant_name, pv.attributes,
  COALESCE(SUM(i.qty_available),0)::int AS total_available,
  COALESCE(SUM(i.qty_reserved),0)::int AS total_reserved,
  COALESCE(SUM(i.qty_incoming),0)::int AS total_incoming,
  BOOL_OR(COALESCE(i.qty_available,0) - COALESCE(i.qty_reserved,0) <= COALESCE(i.low_stock_threshold,3)) AS is_low_stock
FROM public.products p
JOIN public.product_variants pv ON pv.product_id = p.id
LEFT JOIN public.inventory i ON i.variant_id = pv.id
GROUP BY p.id, p.name, p.slug, p.category_id, p.product_type, pv.id, pv.sku, pv.name, pv.attributes;

-- ============================================================
-- RPC: transactional stock adjustment
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_adjust_stock(
  p_variant_id uuid,
  p_location_id uuid,
  p_delta int,
  p_movement_type movement_type_enum,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.inventory
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_row public.inventory;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'staff'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.inventory (variant_id, location_id, qty_available)
  VALUES (p_variant_id, p_location_id, GREATEST(p_delta,0))
  ON CONFLICT (variant_id, location_id) DO UPDATE
    SET qty_available = public.inventory.qty_available + p_delta,
        updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO public.inventory_movements (variant_id, location_id, movement_type, qty_delta, reference_type, reference_id, notes, created_by)
  VALUES (p_variant_id, p_location_id, p_movement_type, p_delta, p_reference_type, p_reference_id, p_notes, auth.uid());

  RETURN v_row;
END $$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_closure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Public read for catalog
CREATE POLICY "catalog_read_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "closure_read_all" ON public.category_closure FOR SELECT USING (true);
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "variants_read_all" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "images_read_all" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "specs_read_all" ON public.product_specifications FOR SELECT USING (true);
CREATE POLICY "tags_read_all" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tagmap_read_all" ON public.product_tag_map FOR SELECT USING (true);
CREATE POLICY "locations_read_all" ON public.locations FOR SELECT USING (true);

-- Admin/staff full management
CREATE POLICY "categories_manage" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "closure_manage" ON public.category_closure FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "products_manage" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "variants_manage" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "images_manage" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "specs_manage" ON public.product_specifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "tags_manage" ON public.tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "tagmap_manage" ON public.product_tag_map FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "locations_manage" ON public.locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- Inventory: admin/staff read+write
CREATE POLICY "inventory_read" ON public.inventory FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "inventory_write" ON public.inventory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- Movements: append-only
CREATE POLICY "movements_read" ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "movements_insert" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;

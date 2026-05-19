import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertProduct, useCategories, type Product } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import FieldLabel from "./FieldLabel";
import ProductImagesManager from "./ProductImagesManager";

const TYPES = ["bike", "accessory", "service", "insurance", "bundle", "subscription_addon"];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductEditDialog({ product, open, onClose, onSaved }: Props) {
  const { data: categories } = useCategories();
  const [form, setForm] = useState<Partial<Product>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(
      product ?? {
        name: "",
        slug: "",
        product_type: "accessory",
        base_price: 0,
        category_id: categories[0]?.id ?? "",
        is_active: true,
        is_featured: false,
        color_hex: null,
      },
    );
  }, [product, open, categories]);

  const update = <K extends keyof Product>(k: K, v: Product[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.category_id) {
      toast({ title: "Name and category required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const saved = await upsertProduct({
        ...(form as any),
        slug: form.slug || slugify(form.name!),
        base_price: Number(form.base_price ?? 0),
      });
      toast({ title: product ? "Product updated" : "Product created" });
      onSaved();
      // Keep dialog open the first time so user can upload photos
      if (product) onClose();
      else setForm(saved as any);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light">{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FieldLabel
              label="Name"
              required
              hint="Public commercial name shown to customers across the site, cart and invoices. Keep it short, descriptive and brand-consistent (e.g. 'WJ Vision One — Black')."
            />
            <Input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} className="bg-background/60" />
          </div>
          <div>
            <FieldLabel
              label="Slug"
              hint="URL identifier (e.g. /products/wj-vision-one). Use lowercase letters, numbers and dashes only. Leave empty to auto-generate from the name."
            />
            <Input value={form.slug ?? ""} onChange={(e) => update("slug", e.target.value)} placeholder="auto from name" className="bg-background/60" />
          </div>
          <div>
            <FieldLabel
              label="Type"
              required
              hint="Defines how the product behaves: bike (with frame, ID and service), accessory (physical add-on), service (workshop work), insurance (subscription), bundle (combo) or subscription_addon."
            />
            <Select value={form.product_type} onValueChange={(v) => update("product_type", v)}>
              <SelectTrigger className="bg-background/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel
              label="Category"
              required
              hint="Catalog category for navigation and filtering. Manage categories under Inventory → Categories."
            />
            <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
              <SelectTrigger className="bg-background/60"><SelectValue placeholder="Pick category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel
              label="Base price (EUR)"
              required
              hint="Default sales price in euros, used when a variant doesn't define its own price override. Include VAT if your store displays prices including tax."
            />
            <Input type="number" step="0.01" value={form.base_price ?? 0} onChange={(e) => update("base_price", Number(e.target.value))} className="bg-background/60" />
          </div>
          <div>
            <FieldLabel
              label="SKU prefix"
              hint="Short code (e.g. 'VIS', 'ACC-HLM') used to auto-generate variant SKUs and group products in reports. Letters and dashes only, keep it under 8 characters."
            />
            <Input value={form.sku_prefix ?? ""} onChange={(e) => update("sku_prefix", e.target.value)} className="bg-background/60" />
          </div>
          {form.product_type === "bike" && (
            <div className="col-span-2">
              <FieldLabel
                label="Bike color"
                hint="Primary frame color of this bike. Used to render color swatches, the 3D bike preview tint and to match V-ID identity. Choose a hex value or pick from the palette."
              />
              <div className="flex items-center gap-3 bg-background/60 border border-input rounded-md px-3 py-2">
                <input
                  type="color"
                  value={form.color_hex ?? "#058c42"}
                  onChange={(e) => update("color_hex", e.target.value)}
                  className="h-8 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <Input
                  value={form.color_hex ?? ""}
                  onChange={(e) => update("color_hex", e.target.value)}
                  placeholder="#058c42"
                  className="bg-transparent border-0 h-8 px-0 focus-visible:ring-0"
                />
                {form.color_hex && (
                  <Button type="button" size="sm" variant="ghost" className="text-[10px] h-7" onClick={() => update("color_hex", null as any)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="col-span-2">
            <FieldLabel
              label="Short description"
              hint="One-line teaser shown in catalog cards and search results. Aim for under 80 characters and highlight the main benefit."
            />
            <Input value={form.short_description ?? ""} onChange={(e) => update("short_description", e.target.value)} className="bg-background/60" />
          </div>
          <div className="col-span-2">
            <FieldLabel
              label="Description"
              hint="Full product description used on the PDP. Supports plain text — focus on materials, features, what's included and care instructions."
            />
            <Textarea rows={3} value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} className="bg-background/60" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_active} onCheckedChange={(v) => update("is_active", v)} />
            <FieldLabel label="Active" hint="When off, the product is hidden from the public catalog and search, but remains in inventory and historical orders." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_featured} onCheckedChange={(v) => update("is_featured", v)} />
            <FieldLabel label="Featured" hint="Pin this product to the homepage hero / 'Featured' carousel and prioritize it in suggestions." />
          </div>
          {form.id && <ProductImagesManager productId={form.id} />}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="bg-wj-green hover:bg-wj-green/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
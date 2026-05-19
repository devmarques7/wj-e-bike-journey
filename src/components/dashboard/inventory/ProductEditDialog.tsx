import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertProduct, useCategories, type Product } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
      await upsertProduct({
        ...(form as any),
        slug: form.slug || slugify(form.name!),
        base_price: Number(form.base_price ?? 0),
      });
      toast({ title: product ? "Product updated" : "Product created" });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-light">{product ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Name</Label>
            <Input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={form.slug ?? ""} onChange={(e) => update("slug", e.target.value)} placeholder="auto from name" className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={form.product_type} onValueChange={(v) => update("product_type", v)}>
              <SelectTrigger className="bg-background/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
              <SelectTrigger className="bg-background/60"><SelectValue placeholder="Pick category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Base price (EUR)</Label>
            <Input type="number" step="0.01" value={form.base_price ?? 0} onChange={(e) => update("base_price", Number(e.target.value))} className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">SKU prefix</Label>
            <Input value={form.sku_prefix ?? ""} onChange={(e) => update("sku_prefix", e.target.value)} className="bg-background/60" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Short description</Label>
            <Input value={form.short_description ?? ""} onChange={(e) => update("short_description", e.target.value)} className="bg-background/60" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} className="bg-background/60" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_active} onCheckedChange={(v) => update("is_active", v)} />
            <Label className="text-xs">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_featured} onCheckedChange={(v) => update("is_featured", v)} />
            <Label className="text-xs">Featured</Label>
          </div>
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
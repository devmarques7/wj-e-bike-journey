import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { upsertVariant, type Variant } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  productId: string;
  variant: Variant | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function VariantEditDialog({ productId, variant, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Variant>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(
      variant ?? {
        product_id: productId,
        sku: "",
        name: "",
        attributes: {},
        is_active: true,
        is_default: false,
      },
    );
  }, [variant, open, productId]);

  const save = async () => {
    if (!form.sku || !form.name) {
      toast({ title: "SKU and name required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await upsertVariant({ ...(form as any), product_id: productId });
      toast({ title: variant ? "Variant updated" : "Variant created" });
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
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="font-light">{variant ? "Edit variant" : "New variant"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">SKU</Label>
            <Input value={form.sku ?? ""} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">Price override (EUR)</Label>
            <Input type="number" step="0.01" value={form.price_override ?? ""} onChange={(e) => setForm((f) => ({ ...f, price_override: e.target.value ? Number(e.target.value) : null }))} className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">Weight (g)</Label>
            <Input type="number" value={form.weight_grams ?? ""} onChange={(e) => setForm((f) => ({ ...f, weight_grams: e.target.value ? Number(e.target.value) : null }))} className="bg-background/60" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <Label className="text-xs">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_default} onCheckedChange={(v) => setForm((f) => ({ ...f, is_default: v }))} />
            <Label className="text-xs">Default variant</Label>
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
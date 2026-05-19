import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adjustStock, type InventoryRow } from "@/hooks/inventory/useInventoryData";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import FieldLabel from "./FieldLabel";

interface Props {
  row: InventoryRow | null;
  onClose: () => void;
}

const TYPES = [
  { v: "adjustment", l: "Manual adjustment" },
  { v: "incoming", l: "Incoming stock" },
  { v: "sale", l: "Sale" },
  { v: "return", l: "Return" },
  { v: "transfer", l: "Transfer" },
] as const;

export default function AdjustStockModal({ row, onClose }: Props) {
  const [delta, setDelta] = useState(0);
  const [type, setType] = useState<(typeof TYPES)[number]["v"]>("adjustment");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  if (!row) return null;

  const submit = async () => {
    if (delta === 0) {
      toast({ title: "Delta cannot be zero", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await adjustStock({
        variantId: row.variant_id,
        locationId: row.location_id,
        delta,
        movementType: type,
        notes: notes || undefined,
      });
      toast({ title: "Stock updated", description: `${row.variant.sku}: ${delta > 0 ? "+" : ""}${delta}` });
      onClose();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="font-light">Adjust Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-sm text-foreground">{row.variant.product.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.variant.name} · SKU {row.variant.sku} · {row.location.name}
          </p>
          <p className="text-xs text-muted-foreground">
            Available: <span className="text-foreground">{row.qty_available}</span> · Reserved:{" "}
            {row.qty_reserved} · Incoming: {row.qty_incoming}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <FieldLabel label="Delta (+/-)" required hint="Quantity to add or subtract. Use a positive number to add stock and a negative number to remove (e.g. -2 for shrinkage)." />
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="bg-background/60"
            />
          </div>
          <div>
            <FieldLabel label="Movement Type" required hint="Reason for the change. Adjustment = manual correction, Incoming = supplier delivery, Sale = customer purchase, Return = customer return, Transfer = inter-location move. Picked here for the audit log." />
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.v} value={t.v}>
                    {t.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel label="Notes (optional)" hint="Short context attached to the movement — e.g. 'Damaged box', 'Counted during stocktake'. Visible in the audit trail." />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="bg-background/60"
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} className="bg-wj-green hover:bg-wj-green/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
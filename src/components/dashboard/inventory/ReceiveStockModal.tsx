import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adjustStock, type InventoryRow } from "@/hooks/inventory/useInventoryData";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowDownToLine } from "lucide-react";

interface Props {
  row: InventoryRow | null;
  onClose: () => void;
}

export default function ReceiveStockModal({ row, onClose }: Props) {
  const [qty, setQty] = useState(0);
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  if (!row) return null;

  const submit = async () => {
    if (qty <= 0) {
      toast({ title: "Quantity must be positive", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await adjustStock({
        variantId: row.variant_id,
        locationId: row.location_id,
        delta: qty,
        movementType: "incoming",
        notes: [poRef && `PO: ${poRef}`, notes].filter(Boolean).join(" — ") || undefined,
      });
      toast({ title: "Stock received", description: `+${qty} → ${row.variant.sku}` });
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
          <DialogTitle className="font-light flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-wj-green" /> Receive Stock
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm">{row.variant.product.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.variant.name} · SKU {row.variant.sku} · {row.location.name}
          </p>
          <p className="text-xs text-muted-foreground">
            Available: {row.qty_available} · Incoming: {row.qty_incoming}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Qty received</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="bg-background/60" />
          </div>
          <div>
            <Label className="text-xs">PO reference</Label>
            <Input value={poRef} onChange={(e) => setPoRef(e.target.value)} className="bg-background/60" placeholder="PO-2026-0001" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-background/60" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-wj-green hover:bg-wj-green/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Receive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
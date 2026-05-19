import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustStock, type InventoryRow } from "@/hooks/inventory/useInventoryData";
import { useLocations } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import { ArrowLeftRight, Loader2 } from "lucide-react";

interface Props {
  row: InventoryRow | null;
  onClose: () => void;
}

export default function TransferStockModal({ row, onClose }: Props) {
  const { data: locations } = useLocations();
  const [destLoc, setDestLoc] = useState<string>("");
  const [qty, setQty] = useState(0);
  const [busy, setBusy] = useState(false);

  if (!row) return null;
  const validDest = locations.filter((l) => l.id !== row.location_id && l.is_active);

  const submit = async () => {
    if (qty <= 0 || qty > row.qty_available) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return;
    }
    if (!destLoc) {
      toast({ title: "Pick a destination", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await adjustStock({
        variantId: row.variant_id,
        locationId: row.location_id,
        delta: -qty,
        movementType: "transfer",
        notes: `Transfer → ${locations.find((l) => l.id === destLoc)?.name}`,
      });
      await adjustStock({
        variantId: row.variant_id,
        locationId: destLoc,
        delta: qty,
        movementType: "transfer",
        notes: `Transfer ← ${row.location.name}`,
      });
      toast({ title: "Transfer complete", description: `${qty} units moved` });
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
            <ArrowLeftRight className="h-4 w-4 text-wj-green" /> Transfer Stock
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm">{row.variant.product.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.variant.sku} · From <span className="text-foreground">{row.location.name}</span> · Available {row.qty_available}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Destination</Label>
            <Select value={destLoc} onValueChange={setDestLoc}>
              <SelectTrigger className="bg-background/60"><SelectValue placeholder="Choose location" /></SelectTrigger>
              <SelectContent>
                {validDest.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Qty</Label>
            <Input type="number" min={1} max={row.qty_available} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="bg-background/60" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-wj-green hover:bg-wj-green/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Transfer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
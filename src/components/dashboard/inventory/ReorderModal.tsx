import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download } from "lucide-react";
import type { InventoryRow } from "@/hooks/inventory/useInventoryData";
import { downloadCSV } from "@/lib/csv";

interface Props {
  open: boolean;
  rows: InventoryRow[];
  onClose: () => void;
}

export default function ReorderModal({ open, rows, onClose }: Props) {
  const suggestions = useMemo(
    () =>
      rows
        .filter((r) => r.qty_available - r.qty_reserved <= r.low_stock_threshold)
        .map((r) => ({
          sku: r.variant.sku,
          product: r.variant.product.name,
          variant: r.variant.name,
          location: r.location.name,
          available: r.qty_available,
          reserved: r.qty_reserved,
          reorder_point: r.reorder_point,
          suggested_qty: Math.max(r.reorder_point - (r.qty_available - r.qty_reserved), 1),
        })),
    [rows],
  );

  const exportCsv = () =>
    downloadCSV(`reorder-${new Date().toISOString().slice(0, 10)}.csv`, suggestions);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-light flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-wj-green" /> Suggested Reorder
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {suggestions.length} items below their reorder point.
        </p>
        <div className="max-h-[60vh] overflow-auto rounded-xl border border-border/30">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 sticky top-0">
              <tr className="text-left text-muted-foreground">
                <th className="p-2">SKU</th>
                <th className="p-2">Product</th>
                <th className="p-2">Location</th>
                <th className="p-2 text-right">Avail.</th>
                <th className="p-2 text-right">Reorder pt</th>
                <th className="p-2 text-right text-wj-green">Suggested</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">All stock above thresholds 🎉</td></tr>
              )}
              {suggestions.map((s) => (
                <tr key={s.sku + s.location} className="border-t border-border/30">
                  <td className="p-2 text-muted-foreground">{s.sku}</td>
                  <td className="p-2">{s.product}<div className="text-[10px] text-muted-foreground">{s.variant}</div></td>
                  <td className="p-2 text-muted-foreground">{s.location}</td>
                  <td className="p-2 text-right">{s.available}</td>
                  <td className="p-2 text-right">{s.reorder_point}</td>
                  <td className="p-2 text-right text-wj-green font-medium">+{s.suggested_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={exportCsv} disabled={!suggestions.length} className="bg-wj-green hover:bg-wj-green/90">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
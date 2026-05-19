import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { MovementRow } from "@/hooks/inventory/useInventoryData";

interface Props {
  movement: MovementRow | null;
  onClose: () => void;
}

export default function MovementDetailDrawer({ movement, onClose }: Props) {
  return (
    <Sheet open={!!movement} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-background/95 backdrop-blur-xl border-border/40">
        <SheetHeader>
          <SheetTitle className="font-light">Movement detail</SheetTitle>
        </SheetHeader>
        {movement && (
          <div className="mt-6 space-y-4 text-sm">
            <Row k="Type"><Badge variant="outline" className="capitalize">{movement.movement_type}</Badge></Row>
            <Row k="Δ"><span className={movement.qty_delta > 0 ? "text-wj-green" : "text-red-400"}>
              {movement.qty_delta > 0 ? `+${movement.qty_delta}` : movement.qty_delta}</span></Row>
            <Row k="When">{new Date(movement.created_at).toLocaleString()}</Row>
            <Row k="Product">{movement.variant?.product?.name ?? "—"}</Row>
            <Row k="Variant">{movement.variant?.name ?? "—"}</Row>
            <Row k="SKU">{movement.variant?.sku ?? "—"}</Row>
            <Row k="Location">{movement.location?.name ?? "—"}</Row>
            <Row k="Reference">
              {movement.reference_type ? `${movement.reference_type} · ${movement.reference_id ?? ""}` : "—"}
            </Row>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{movement.notes ?? "—"}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-border/20 pb-2">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
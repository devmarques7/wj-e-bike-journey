import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adjustStock } from "@/hooks/inventory/useInventoryData";
import { useLocations, useProducts } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldLabel from "./FieldLabel";

interface Props {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}

type VariantOption = {
  id: string;
  sku: string;
  name: string;
  product_id: string;
  is_default: boolean;
};

export default function QuickStockModal({ open, onClose, onDone }: Props) {
  const { data: products } = useProducts();
  const { data: locations } = useLocations();

  const [productId, setProductId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [movementType, setMovementType] =
    useState<"incoming" | "adjustment">("incoming");
  const [notes, setNotes] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setProductId("");
      setVariantId("");
      setLocationId("");
      setQty(1);
      setMovementType("incoming");
      setNotes("");
      setProductSearch("");
      setVariants([]);
    }
  }, [open]);

  // Default to single location
  useEffect(() => {
    if (open && locations.length === 1 && !locationId) {
      setLocationId(locations[0].id);
    }
  }, [open, locations, locationId]);

  // Load variants when product changes
  useEffect(() => {
    if (!productId) {
      setVariants([]);
      setVariantId("");
      return;
    }
    let active = true;
    (async () => {
      setVariantsLoading(true);
      const { data } = await supabase
        .from("product_variants")
        .select("id, sku, name, product_id, is_default, is_active")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      if (!active) return;
      const list = (data ?? []) as VariantOption[];
      setVariants(list);
      const def = list.find((v) => v.is_default) ?? list[0];
      setVariantId(def?.id ?? "");
      setVariantsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  const selectedProduct = useMemo(
    () => products.find((p: any) => p.id === productId),
    [products, productId],
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return (products as any[]).filter((p) =>
      `${p.name} ${p.sku_prefix ?? ""} ${p.product_type}`
        .toLowerCase()
        .includes(q),
    );
  }, [products, productSearch]);

  const canSubmit =
    !!productId && !!variantId && !!locationId && qty > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await adjustStock({
        variantId,
        locationId,
        delta: qty,
        movementType,
        notes: notes || undefined,
      });
      toast({
        title: "Stock registered",
        description: `+${qty} → ${selectedProduct?.name ?? "variant"}`,
      });
      onDone?.();
      onClose();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light flex items-center gap-2">
            <Zap className="h-4 w-4 text-wj-green" /> Quick Stock
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Register available units of a catalog product or variant in seconds.
        </p>

        {/* Product picker */}
        <div>
          <FieldLabel
            label="Product"
            required
            hint="Search and pick a product from the catalog."
          />
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-background/60 font-normal"
              >
                {selectedProduct ? (
                  <span className="flex items-center gap-2 truncate">
                    {selectedProduct.color_hex && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: selectedProduct.color_hex }}
                      />
                    )}
                    <span className="truncate">{selectedProduct.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {selectedProduct.product_type}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Select a product…
                  </span>
                )}
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0 bg-background/95 backdrop-blur-xl border-border/40"
              align="start"
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search product…"
                  value={productSearch}
                  onValueChange={setProductSearch}
                />
                <CommandList>
                  <CommandEmpty>No product found.</CommandEmpty>
                  <CommandGroup>
                    {filteredProducts.map((p: any) => (
                      <CommandItem
                        key={p.id}
                        value={p.id}
                        onSelect={() => {
                          setProductId(p.id);
                          setProductOpen(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5",
                            productId === p.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {p.color_hex && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: p.color_hex }}
                          />
                        )}
                        <span className="truncate">{p.name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground uppercase">
                          {p.product_type}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Variant + Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel
              label="Variant"
              required
              hint="Specific SKU/variant to receive."
            />
            <Select
              value={variantId}
              onValueChange={setVariantId}
              disabled={!productId || variantsLoading}
            >
              <SelectTrigger className="bg-background/60">
                <SelectValue
                  placeholder={
                    !productId
                      ? "Pick product first"
                      : variantsLoading
                        ? "Loading…"
                        : variants.length === 0
                          ? "No variants"
                          : "Select variant"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40">
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="flex items-center gap-2">
                      <span>{v.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {v.sku}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel
              label="Location"
              required
              hint="Warehouse or store location where these units land."
            />
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="bg-background/60">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40">
                {locations.map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Qty + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel
              label="Quantity"
              required
              hint="Units to add to current stock."
            />
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="bg-background/60"
            />
          </div>
          <div>
            <FieldLabel
              label="Movement type"
              hint="Incoming = supplier delivery. Adjustment = inventory correction."
            />
            <Select
              value={movementType}
              onValueChange={(v) => setMovementType(v as any)}
            >
              <SelectTrigger className="bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40">
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel
            label="Notes"
            hint="Optional — supplier, PO, lot, comments. Stored in audit log."
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="bg-background/60"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-wj-green hover:bg-wj-green/90"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Register Stock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
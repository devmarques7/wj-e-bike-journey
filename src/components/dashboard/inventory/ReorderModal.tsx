import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  ShoppingCart,
  Download,
  Zap,
  Upload,
  FileSpreadsheet,
  FileJson,
  Eye,
  Copy,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { adjustStock, type InventoryRow } from "@/hooks/inventory/useInventoryData";
import { useLocations, useProducts } from "@/hooks/inventory/useCatalogCrud";
import { downloadCSV, triggerDownload } from "@/lib/csv";
import { parseCsv } from "@/lib/parseCsv";
import { toast } from "@/hooks/use-toast";
import FieldLabel from "./FieldLabel";

interface Props {
  open: boolean;
  rows: InventoryRow[];
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

const MOVEMENT_TYPES = ["incoming", "adjustment", "return", "sale"] as const;
type MType = (typeof MOVEMENT_TYPES)[number];

/* ---------------- Import schema ---------------- */
const importRowSchema = z.object({
  sku: z.string().trim().min(1, "sku is required").max(64),
  location: z.string().trim().min(1, "location is required").max(120),
  qty: z.coerce
    .number({ invalid_type_error: "qty must be a number" })
    .int("qty must be integer")
    .refine((n) => n !== 0, "qty cannot be 0"),
  movement_type: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? v.toLowerCase() : "incoming"))
    .refine(
      (v) => MOVEMENT_TYPES.includes(v as MType),
      `movement_type must be one of: ${MOVEMENT_TYPES.join(", ")}`
    ),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type ParsedImportRow = z.infer<typeof importRowSchema>;

interface ImportRowResult {
  rowIndex: number;
  raw: Record<string, unknown>;
  data?: ParsedImportRow;
  errors: { field: string; message: string }[];
  resolved?: { variant_id: string; location_id: string };
  status?: "pending" | "ok" | "failed";
  remoteError?: string;
}

const REQUIRED_HEADERS = ["sku", "location", "qty"];

/* ---------------- Component ---------------- */
export default function ReorderModal({ open, rows, onClose, onDone }: Props) {
  const { data: products } = useProducts();
  const { data: locations } = useLocations();

  const [tab, setTab] = useState<"quick" | "suggested" | "import">("quick");

  /* ===== QUICK STOCK state ===== */
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [qsLocationId, setQsLocationId] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [movementType, setMovementType] = useState<"incoming" | "adjustment">("incoming");
  const [notes, setNotes] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  /* ===== IMPORT state ===== */
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<ImportRowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFmt, setPreviewFmt] = useState<"csv" | "json">("csv");
  const [copied, setCopied] = useState(false);

  /* Reset all state when modal closes */
  useEffect(() => {
    if (!open) {
      setTab("quick");
      setProductId("");
      setVariantId("");
      setQsLocationId("");
      setQty(1);
      setMovementType("incoming");
      setNotes("");
      setProductSearch("");
      setVariants([]);
      setBusy(false);
      setImportRows([]);
      setFileName(null);
      setFileError(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  /* Default to single location */
  useEffect(() => {
    if (open && locations.length === 1 && !qsLocationId) {
      setQsLocationId(locations[0].id);
    }
  }, [open, locations, qsLocationId]);

  /* Load variants when product changes */
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

  /* ============ QUICK STOCK ============ */
  const selectedProduct = useMemo(
    () => products.find((p: any) => p.id === productId),
    [products, productId]
  );
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return (products as any[]).filter((p) =>
      `${p.name} ${p.sku_prefix ?? ""} ${p.product_type}`.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const canSubmitQuick =
    !!productId && !!variantId && !!qsLocationId && qty > 0 && !busy;

  const submitQuick = async () => {
    if (!canSubmitQuick) return;
    setBusy(true);
    try {
      await adjustStock({
        variantId,
        locationId: qsLocationId,
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
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  /* ============ SUGGESTED REORDER ============ */
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
          suggested_qty: Math.max(
            r.reorder_point - (r.qty_available - r.qty_reserved),
            1
          ),
        })),
    [rows]
  );

  const exportSuggestedCsv = () =>
    downloadCSV(
      `reorder-${new Date().toISOString().slice(0, 10)}.csv`,
      suggestions
    );

  /* ============ IMPORT ============ */
  // Lookup maps for validation
  const locLookup = useMemo(() => {
    const m = new Map<string, string>();
    (locations as any[]).forEach((l) => {
      m.set(l.id, l.id);
      m.set(String(l.name).toLowerCase(), l.id);
    });
    return m;
  }, [locations]);

  const buildImportTemplate = (): Record<string, string>[] => {
    const loc = (locations as any[])[0]?.name ?? "Main Warehouse";
    return [
      { sku: "VIS-001-BLK", location: loc, qty: "10", movement_type: "incoming", notes: "PO #1024" },
      { sku: "HLM-LRG", location: loc, qty: "5", movement_type: "incoming", notes: "" },
      { sku: "VIS-001-BLK", location: loc, qty: "-1", movement_type: "adjustment", notes: "damaged unit" },
    ];
  };

  const renderTemplateText = (fmt: "csv" | "json") => {
    const rs = buildImportTemplate();
    if (fmt === "json") return JSON.stringify(rs, null, 2);
    const headers = Object.keys(rs[0]);
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    return [
      headers.join(","),
      ...rs.map((r) => headers.map((h) => esc((r as any)[h])).join(",")),
    ].join("\n");
  };

  const downloadTemplate = (fmt: "csv" | "json") => {
    const rs = buildImportTemplate();
    if (fmt === "csv") {
      downloadCSV("stock-import-template.csv", rs);
    } else {
      const blob = new Blob([JSON.stringify(rs, null, 2)], {
        type: "application/json",
      });
      triggerDownload(blob, "stock-import-template.json");
    }
    setTimeout(() => setTemplateOpen(false), 250);
    toast({ title: "Template downloaded", description: fmt.toUpperCase() });
  };

  const previewText = useMemo(
    () => renderTemplateText(previewFmt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewFmt, locations]
  );

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const validateImport = async (
    raw: Record<string, unknown>[]
  ): Promise<ImportRowResult[]> => {
    // Pre-fetch needed variants in a single query
    const skus = Array.from(
      new Set(
        raw
          .map((r) => String((r as any).sku ?? "").trim())
          .filter(Boolean)
      )
    );
    let variantMap = new Map<string, string>();
    if (skus.length > 0) {
      const { data } = await supabase
        .from("product_variants")
        .select("id, sku, is_active")
        .in("sku", skus);
      (data ?? []).forEach((v: any) => {
        if (v.is_active !== false) variantMap.set(v.sku, v.id);
      });
    }

    return raw.map((r, idx) => {
      const parsed = importRowSchema.safeParse(r);
      const errors: { field: string; message: string }[] = [];
      let resolved: ImportRowResult["resolved"] | undefined;

      if (!parsed.success) {
        parsed.error.issues.forEach((i) =>
          errors.push({
            field: String(i.path[0] ?? "row"),
            message: i.message,
          })
        );
      } else {
        const skuKey = parsed.data.sku;
        const locKey = parsed.data.location.toLowerCase();
        const vId = variantMap.get(skuKey);
        const lId = locLookup.get(locKey);
        if (!vId)
          errors.push({
            field: "sku",
            message: `unknown sku "${skuKey}" — variant not found or inactive`,
          });
        if (!lId)
          errors.push({
            field: "location",
            message: `unknown location "${parsed.data.location}" — use existing name or id`,
          });
        if (vId && lId) resolved = { variant_id: vId, location_id: lId };
      }

      return {
        rowIndex: idx + 2,
        raw: r,
        data: parsed.success ? parsed.data : undefined,
        errors,
        resolved,
        status: "pending",
      };
    });
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    setImportRows([]);
    setFileName(file.name);

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File exceeds 5MB limit.");
      return;
    }

    try {
      const text = await file.text();
      let parsed: Record<string, unknown>[] = [];

      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        if (!Array.isArray(json))
          throw new Error("JSON root must be an array of objects.");
        parsed = json;
      } else {
        parsed = parseCsv(text);
        if (parsed.length === 0)
          throw new Error("CSV is empty or missing data rows.");
        const headers = Object.keys(parsed[0]);
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length)
          throw new Error(`Missing required columns: ${missing.join(", ")}`);
      }

      if (parsed.length === 0) {
        setFileError("No rows found.");
        return;
      }
      if (parsed.length > 500) {
        setFileError("Maximum 500 rows per import.");
        return;
      }

      const validated = await validateImport(parsed);
      setImportRows(validated);
    } catch (e: any) {
      setFileError(e.message ?? "Failed to parse file");
    }
  };

  const validImportRows = importRows.filter(
    (r) => r.errors.length === 0 && r.resolved
  );
  const invalidImportRows = importRows.filter((r) => r.errors.length > 0);

  const runImport = async () => {
    if (validImportRows.length === 0) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;
    const next = [...importRows];
    for (let i = 0; i < next.length; i++) {
      const row = next[i];
      if (row.errors.length > 0 || !row.resolved || !row.data) continue;
      try {
        await adjustStock({
          variantId: row.resolved.variant_id,
          locationId: row.resolved.location_id,
          delta: row.data.qty,
          movementType: row.data.movement_type as MType,
          notes: row.data.notes || undefined,
        });
        next[i] = { ...row, status: "ok" };
        ok++;
      } catch (e: any) {
        next[i] = { ...row, status: "failed", remoteError: e.message };
        fail++;
      }
      setImportRows([...next]);
    }
    setImporting(false);
    toast({
      title: `Import done: ${ok} ok · ${fail} failed`,
      description: fail
        ? "Some rows failed — check the table below."
        : "All movements registered.",
      variant: fail ? "destructive" : "default",
    });
    onDone?.();
  };

  /* ============ RENDER ============ */
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-light flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-wj-green" /> Stock Operations
          </DialogTitle>
          <DialogDescription className="text-xs">
            Register single units, review suggested reorders, or bulk-import via CSV / JSON.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
          <TabsList className="bg-muted/40">
            <TabsTrigger value="quick" className="text-xs">
              <Zap className="h-3 w-3 mr-1" /> Quick
            </TabsTrigger>
            <TabsTrigger value="suggested" className="text-xs">
              <ShoppingCart className="h-3 w-3 mr-1" /> Suggested
              {suggestions.length > 0 && (
                <span className="ml-1 text-[10px] text-amber-400">·{suggestions.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="import" className="text-xs">
              <Upload className="h-3 w-3 mr-1" /> Import
            </TabsTrigger>
          </TabsList>

          {/* ========== QUICK ========== */}
          <TabsContent value="quick" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Register available units of a catalog product or variant in seconds.
            </p>

            <div>
              <FieldLabel label="Product" required hint="Search and pick a product from the catalog." />
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between bg-background/60 font-normal">
                    {selectedProduct ? (
                      <span className="flex items-center gap-2 truncate">
                        {selectedProduct.color_hex && (
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedProduct.color_hex }} />
                        )}
                        <span className="truncate">{selectedProduct.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{selectedProduct.product_type}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select a product…</span>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background/95 backdrop-blur-xl border-border/40" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search product…" value={productSearch} onValueChange={setProductSearch} />
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
                            <Check className={cn("h-3.5 w-3.5", productId === p.id ? "opacity-100" : "opacity-0")} />
                            {p.color_hex && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color_hex }} />}
                            <span className="truncate">{p.name}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground uppercase">{p.product_type}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Variant" required hint="Specific SKU/variant to receive." />
                <Select value={variantId} onValueChange={setVariantId} disabled={!productId || variantsLoading}>
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
                          <span className="text-[10px] text-muted-foreground">{v.sku}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel label="Location" required hint="Where these units land." />
                <Select value={qsLocationId} onValueChange={setQsLocationId}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40">
                    {(locations as any[]).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Quantity" required hint="Units to add to current stock." />
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
                <Select value={movementType} onValueChange={(v) => setMovementType(v as any)}>
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
              <FieldLabel label="Notes" hint="Optional — supplier, PO, lot, comments." />
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-background/60" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submitQuick} disabled={!canSubmitQuick} className="bg-wj-green hover:bg-wj-green/90">
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Register Stock
              </Button>
            </div>
          </TabsContent>

          {/* ========== SUGGESTED ========== */}
          <TabsContent value="suggested" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              {suggestions.length} item(s) below their reorder point.
            </p>
            <div className="max-h-[55vh] overflow-auto rounded-xl border border-border/30">
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
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        All stock above thresholds 🎉
                      </td>
                    </tr>
                  )}
                  {suggestions.map((s) => (
                    <tr key={s.sku + s.location} className="border-t border-border/30">
                      <td className="p-2 text-muted-foreground">{s.sku}</td>
                      <td className="p-2">
                        {s.product}
                        <div className="text-[10px] text-muted-foreground">{s.variant}</div>
                      </td>
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
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={exportSuggestedCsv}
                disabled={!suggestions.length}
                className="bg-wj-green hover:bg-wj-green/90"
              >
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
          </TabsContent>

          {/* ========== IMPORT ========== */}
          <TabsContent value="import" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Bulk register stock movements. Required columns:{" "}
              <code className="text-wj-green">sku, location, qty</code>. Optional:{" "}
              <code>movement_type, notes</code>. Use negative <code>qty</code> with{" "}
              <code>adjustment</code> to remove units.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
                <Download className="h-3 w-3 mr-1" /> Download template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-3 w-3 mr-1" /> Preview template
              </Button>
              <div className="ml-auto">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="bg-wj-green hover:bg-wj-green/90"
                >
                  <Upload className="h-3 w-3 mr-1" /> Choose file
                </Button>
              </div>
            </div>

            {fileName && (
              <div className="flex items-center gap-2 text-xs bg-background/60 border border-border/30 rounded-lg p-2">
                <FileSpreadsheet className="h-3.5 w-3.5 text-wj-green" />
                <span className="truncate">{fileName}</span>
                <button
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFileName(null);
                    setImportRows([]);
                    setFileError(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  type="button"
                  aria-label="Clear file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {importRows.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Badge variant="outline" className="bg-wj-green/10 text-wj-green border-wj-green/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {validImportRows.length} valid
                  </Badge>
                  {invalidImportRows.length > 0 && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" /> {invalidImportRows.length} invalid
                    </Badge>
                  )}
                </div>

                <div className="max-h-[40vh] overflow-auto rounded-xl border border-border/30">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr className="text-left text-muted-foreground">
                        <th className="p-2">#</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Location</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r) => (
                        <tr key={r.rowIndex} className="border-t border-border/30 align-top">
                          <td className="p-2 text-muted-foreground">{r.rowIndex}</td>
                          <td className="p-2">{String((r.raw as any).sku ?? "—")}</td>
                          <td className="p-2">{String((r.raw as any).location ?? "—")}</td>
                          <td className="p-2 text-right tabular-nums">
                            {String((r.raw as any).qty ?? "—")}
                          </td>
                          <td className="p-2 capitalize text-muted-foreground">
                            {String((r.raw as any).movement_type ?? "incoming")}
                          </td>
                          <td className="p-2">
                            {r.errors.length > 0 ? (
                              <div className="text-red-400">
                                {r.errors.map((e, i) => (
                                  <div key={i}>
                                    <span className="font-medium">{e.field}:</span> {e.message}
                                  </div>
                                ))}
                              </div>
                            ) : r.status === "ok" ? (
                              <span className="text-wj-green flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> ok
                              </span>
                            ) : r.status === "failed" ? (
                              <span className="text-red-400">{r.remoteError ?? "failed"}</span>
                            ) : (
                              <span className="text-muted-foreground">ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose} disabled={importing}>
                Close
              </Button>
              <Button
                onClick={runImport}
                disabled={validImportRows.length === 0 || importing}
                className="bg-wj-green hover:bg-wj-green/90"
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Import {validImportRows.length} row(s)
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Template DOWNLOAD picker */}
        <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-light">Download template</DialogTitle>
              <DialogDescription className="text-xs">
                Pre-filled with your first location and example SKUs. Edit then re-import.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}>
                <FileJson className="h-3 w-3 mr-1" /> JSON
              </Button>
              <Button
                size="sm"
                onClick={() => downloadTemplate("csv")}
                className="bg-wj-green hover:bg-wj-green/90"
              >
                <FileSpreadsheet className="h-3 w-3 mr-1" /> CSV
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Template PREVIEW */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="font-light">Preview template</DialogTitle>
              <DialogDescription className="text-xs">
                Copy this content into a <code>.csv</code> or <code>.json</code> file.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={previewFmt} onValueChange={(v) => setPreviewFmt(v as any)}>
                <SelectTrigger className="bg-background/60 w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/40">
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleCopyPreview}>
                {copied ? (
                  <Check className="h-3 w-3 mr-1 text-wj-green" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => downloadTemplate(previewFmt)}
              >
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            </div>

            <pre className="bg-background/60 border border-border/30 rounded-lg p-3 text-[11px] leading-relaxed overflow-auto max-h-[55vh] whitespace-pre-wrap break-all">
              {previewText}
            </pre>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
import { useRef, useState, useMemo } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/inventory/useCatalogCrud";
import { parseCsv } from "@/lib/parseCsv";
import { downloadCSV } from "@/lib/csv";

const TYPES = ["bike", "accessory", "service", "insurance", "bundle", "subscription_addon"] as const;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ---------- schema ---------- */
const rowSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  product_type: z.enum(TYPES, { errorMap: () => ({ message: `must be one of: ${TYPES.join(", ")}` }) }),
  category: z.string().trim().min(1, "category is required (name or slug)"),
  base_price: z.coerce.number({ invalid_type_error: "must be a number" }).nonnegative("must be ≥ 0"),
  sale_price: z.coerce.number().nonnegative().optional().nullable(),
  sku_prefix: z.string().trim().max(12).optional().or(z.literal("")),
  short_description: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  color_hex: z
    .string()
    .trim()
    .regex(/^#?[0-9a-fA-F]{6}$/, "must be a hex color like #058c42")
    .optional()
    .or(z.literal("")),
  is_active: z.string().trim().optional(),
  is_featured: z.string().trim().optional(),
});

type ParsedRow = z.infer<typeof rowSchema>;

interface RowResult {
  rowIndex: number;
  raw: Record<string, unknown>;
  data?: ParsedRow;
  errors: { field: string; message: string }[];
}

const REQUIRED_HEADERS = ["name", "product_type", "category", "base_price"];

const TEMPLATE: Record<string, string>[] = [
  {
    name: "WJ Vision One — Black",
    slug: "wj-vision-one-black",
    product_type: "bike",
    category: "bikes",
    base_price: "2999",
    sale_price: "",
    sku_prefix: "VIS",
    short_description: "Flagship urban e-bike",
    description: "Hand-built aluminium frame, smart connectivity, 90km range.",
    color_hex: "#058c42",
    is_active: "true",
    is_featured: "true",
  },
  {
    name: "Carbon Helmet L",
    slug: "",
    product_type: "accessory",
    category: "helmets",
    base_price: "149",
    sale_price: "129",
    sku_prefix: "HLM",
    short_description: "Lightweight certified carbon helmet",
    description: "",
    color_hex: "",
    is_active: "true",
    is_featured: "false",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportProductsDialog({ open, onClose, onImported }: Props) {
  const { data: categories } = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);

  /* ----- category lookup (by id, slug or name, case-insensitive) ----- */
  const catLookup = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      map.set(c.id, c.id);
      map.set(c.slug.toLowerCase(), c.id);
      map.set(c.name.toLowerCase(), c.id);
    });
    return map;
  }, [categories]);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const reset = () => {
    setRows([]);
    setFileName(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const validateRows = (raw: Record<string, unknown>[]): RowResult[] => {
    return raw.map((r, idx) => {
      const result = rowSchema.safeParse(r);
      const errors: { field: string; message: string }[] = [];

      if (!result.success) {
        result.error.issues.forEach((iss) =>
          errors.push({ field: String(iss.path[0] ?? "row"), message: iss.message }),
        );
      }

      // category resolution check
      const catRaw = String((r as any).category ?? "").trim().toLowerCase();
      if (catRaw && !catLookup.has(catRaw)) {
        errors.push({
          field: "category",
          message: `unknown category "${(r as any).category}" — create it first or use existing name/slug`,
        });
      }

      return {
        rowIndex: idx + 2, // +2: header row + 1-based
        raw: r,
        data: result.success ? result.data : undefined,
        errors,
      };
    });
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    setRows([]);
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
        if (!Array.isArray(json)) throw new Error("JSON root must be an array of objects.");
        parsed = json;
      } else {
        parsed = parseCsv(text);
        if (parsed.length === 0) throw new Error("CSV is empty or missing data rows.");
        const headers = Object.keys(parsed[0]);
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}`);
      }

      if (parsed.length === 0) {
        setFileError("No rows found.");
        return;
      }
      if (parsed.length > 1000) {
        setFileError("Maximum 1000 rows per import.");
        return;
      }

      setRows(validateRows(parsed));
    } catch (e: any) {
      setFileError(e.message ?? "Failed to parse file");
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const payload = validRows.map((r) => {
        const d = r.data!;
        const cat = catLookup.get(String((r.raw as any).category).trim().toLowerCase())!;
        const color = d.color_hex ? (d.color_hex.startsWith("#") ? d.color_hex : `#${d.color_hex}`) : null;
        return {
          name: d.name,
          slug: d.slug || slugify(d.name),
          product_type: d.product_type,
          category_id: cat,
          base_price: d.base_price,
          sale_price: d.sale_price ?? null,
          sku_prefix: d.sku_prefix || null,
          short_description: d.short_description || null,
          description: d.description || null,
          color_hex: color,
          is_active: !["false", "0", "no"].includes((d.is_active ?? "").toLowerCase()),
          is_featured: ["true", "1", "yes"].includes((d.is_featured ?? "").toLowerCase()),
        };
      });

      const { error, data } = await supabase.from("products").insert(payload as any).select("id");
      if (error) throw error;
      toast({ title: "Import complete", description: `${data?.length ?? 0} products created` });
      onImported();
      reset();
      onClose();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (fmt: "csv" | "json") => {
    if (fmt === "csv") {
      downloadCSV("products-template.csv", TEMPLATE);
    } else {
      const blob = new Blob([JSON.stringify(TEMPLATE, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products-template.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light flex items-center gap-2">
            <Upload className="h-4 w-4 text-wj-green" /> Bulk import products
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a CSV or JSON file. Required columns:{" "}
            <code className="text-wj-green">name, product_type, category, base_price</code>. Optional:{" "}
            <code>slug, sale_price, sku_prefix, short_description, description, color_hex, is_active, is_featured</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>
            <Download className="h-3 w-3 mr-1" /> CSV template
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}>
            <Download className="h-3 w-3 mr-1" /> JSON template
          </Button>
        </div>

        {/* Dropzone */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="w-full rounded-xl border-2 border-dashed border-border/40 hover:border-wj-green hover:bg-wj-green/5 transition-colors p-8 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <FileText className="h-6 w-6" />
          <p className="text-sm">{fileName ?? "Drop CSV / JSON here or click to browse"}</p>
          <p className="text-[10px]">Max 5MB · up to 1000 rows</p>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {fileError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {fileError}
          </div>
        )}

        {rows.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-background/60 border border-border/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Total rows</p>
                <p className="text-lg font-light">{rows.length}</p>
              </div>
              <div className="rounded-lg bg-wj-green/10 border border-wj-green/30 p-3">
                <p className="text-[10px] uppercase text-wj-green">Ready</p>
                <p className="text-lg font-light text-wj-green">{validRows.length}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-[10px] uppercase text-red-300">With errors</p>
                <p className="text-lg font-light text-red-300">{invalidRows.length}</p>
              </div>
            </div>

            {/* Errors list */}
            {invalidRows.length > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 max-h-56 overflow-y-auto">
                <div className="sticky top-0 bg-background/95 backdrop-blur px-3 py-2 border-b border-red-500/30 text-xs font-medium text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> Issues found ({invalidRows.length} rows)
                </div>
                <ul className="divide-y divide-red-500/10 text-[11px]">
                  {invalidRows.map((r) => (
                    <li key={r.rowIndex} className="px-3 py-2">
                      <p className="text-red-200 mb-1">
                        Row {r.rowIndex}
                        {(r.raw as any).name && <span className="text-muted-foreground"> · {(r.raw as any).name}</span>}
                      </p>
                      <ul className="space-y-0.5 ml-3">
                        {r.errors.map((err, i) => (
                          <li key={i} className="text-muted-foreground">
                            <Badge variant="outline" className="text-[9px] mr-1 border-red-500/30 text-red-300">
                              {err.field}
                            </Badge>
                            {err.message}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Valid preview */}
            {validRows.length > 0 && (
              <div className="rounded-lg border border-wj-green/20 max-h-56 overflow-y-auto">
                <div className="sticky top-0 bg-background/95 backdrop-blur px-3 py-2 border-b border-wj-green/20 text-xs font-medium text-wj-green flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Preview of valid rows
                </div>
                <table className="w-full text-[11px]">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/20">
                      <th className="text-left px-3 py-1.5 font-normal">Name</th>
                      <th className="text-left px-3 py-1.5 font-normal">Type</th>
                      <th className="text-left px-3 py-1.5 font-normal">Category</th>
                      <th className="text-right px-3 py-1.5 font-normal">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 50).map((r) => (
                      <tr key={r.rowIndex} className="border-b border-border/10">
                        <td className="px-3 py-1.5">{r.data!.name}</td>
                        <td className="px-3 py-1.5 capitalize text-muted-foreground">{r.data!.product_type}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{String((r.raw as any).category)}</td>
                        <td className="px-3 py-1.5 text-right">€{r.data!.base_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validRows.length > 50 && (
                  <p className="text-[10px] text-muted-foreground text-center py-2">
                    Showing first 50 of {validRows.length} valid rows
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-border/30">
          <Button variant="ghost" size="sm" onClick={reset} disabled={rows.length === 0 || importing}>
            <X className="h-3 w-3 mr-1" /> Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={importing}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="bg-wj-green hover:bg-wj-green/90"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Import {validRows.length > 0 ? `${validRows.length} product${validRows.length === 1 ? "" : "s"}` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useRef, useState, useMemo } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  X,
  FileSpreadsheet,
  FileJson,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/inventory/useCatalogCrud";
import { parseCsv } from "@/lib/parseCsv";
import { downloadCSV, triggerDownload } from "@/lib/csv";

const TYPES = ["bike", "accessory", "service", "part", "insurance"] as const;
type CategoryType = typeof TYPES[number];

const TYPE_LABELS: Record<CategoryType, string> = {
  bike: "Bike",
  accessory: "Accessory",
  service: "Service",
  part: "Part",
  insurance: "Insurance",
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ---------- schema ---------- */
const rowSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  type: z.enum(TYPES, { errorMap: () => ({ message: `must be one of: ${TYPES.join(", ")}` }) }),
  parent: z.string().trim().max(120).optional().or(z.literal("")),
  display_order: z.coerce.number({ invalid_type_error: "must be a number" }).int("must be an integer").optional(),
  is_active: z.string().trim().optional(),
});

type ParsedRow = z.infer<typeof rowSchema>;

interface RowResult {
  rowIndex: number;
  raw: Record<string, unknown>;
  data?: ParsedRow;
  errors: { field: string; message: string }[];
}

const REQUIRED_HEADERS = ["name", "type"];

/* Example seed rows per category type. */
const TEMPLATE_SEEDS: Record<CategoryType, Record<string, string>[]> = {
  bike: [
    {
      name: "Urban Bikes",
      slug: "urban-bikes",
      type: "bike",
      parent: "",
      display_order: "10",
      is_active: "true",
    },
  ],
  accessory: [
    {
      name: "Helmets",
      slug: "helmets",
      type: "accessory",
      parent: "",
      display_order: "10",
      is_active: "true",
    },
  ],
  service: [
    {
      name: "Maintenance",
      slug: "maintenance",
      type: "service",
      parent: "",
      display_order: "10",
      is_active: "true",
    },
  ],
  part: [
    {
      name: "Brake Pads",
      slug: "brake-pads",
      type: "part",
      parent: "",
      display_order: "10",
      is_active: "true",
    },
  ],
  insurance: [
    {
      name: "Theft Cover",
      slug: "theft-cover",
      type: "insurance",
      parent: "",
      display_order: "10",
      is_active: "true",
    },
  ],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportCategoriesDialog({ open, onClose, onImported }: Props) {
  const { data: categories } = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateType, setTemplateType] = useState<CategoryType>("bike");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<CategoryType>("bike");
  const [previewFmt, setPreviewFmt] = useState<"csv" | "json">("csv");
  const [copied, setCopied] = useState(false);

  /* ----- parent lookup (by id, slug or name, case-insensitive) ----- */
  const parentLookup = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      map.set(c.id, c.id);
      map.set(c.slug.toLowerCase(), c.id);
      map.set(c.name.toLowerCase(), c.id);
    });
    return map;
  }, [categories]);

  /* ----- existing-slug set, used to flag duplicates ----- */
  const existingSlugs = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c.slug.toLowerCase()));
    return set;
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
    const seenSlugs = new Set<string>();
    return raw.map((r, idx) => {
      const result = rowSchema.safeParse(r);
      const errors: { field: string; message: string }[] = [];

      if (!result.success) {
        result.error.issues.forEach((iss) =>
          errors.push({ field: String(iss.path[0] ?? "row"), message: iss.message }),
        );
      }

      // parent resolution check
      const parentRaw = String((r as any).parent ?? "").trim().toLowerCase();
      if (parentRaw && !parentLookup.has(parentRaw)) {
        errors.push({
          field: "parent",
          message: `unknown parent "${(r as any).parent}" — must match an existing category id, slug or name`,
        });
      }

      // slug duplicate checks (against DB + within file)
      const name = String((r as any).name ?? "").trim();
      const rawSlug = String((r as any).slug ?? "").trim();
      const finalSlug = (rawSlug || (name ? slugify(name) : "")).toLowerCase();
      if (finalSlug) {
        if (existingSlugs.has(finalSlug)) {
          errors.push({ field: "slug", message: `slug "${finalSlug}" already exists in database` });
        } else if (seenSlugs.has(finalSlug)) {
          errors.push({ field: "slug", message: `slug "${finalSlug}" duplicated within this file` });
        }
        seenSlugs.add(finalSlug);
      }

      return {
        rowIndex: idx + 2,
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
        const parentRaw = String((r.raw as any).parent ?? "").trim().toLowerCase();
        const parent_id = parentRaw ? parentLookup.get(parentRaw) ?? null : null;
        return {
          name: d.name,
          slug: d.slug || slugify(d.name),
          type: d.type,
          parent_id,
          display_order: d.display_order ?? 0,
          is_active: !["false", "0", "no"].includes((d.is_active ?? "").toLowerCase()),
        };
      });

      const { error, data } = await supabase
        .from("categories")
        .insert(payload as any)
        .select("id");
      if (error) throw error;
      toast({ title: "Import complete", description: `${data?.length ?? 0} categories created` });
      onImported();
      reset();
      onClose();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  /** Build a template tailored to one category type. Uses a real existing
   *  category (matching that type when possible) as the parent example. */
  const buildTemplate = (type: CategoryType): Record<string, string>[] => {
    const seeds = TEMPLATE_SEEDS[type];
    const match =
      categories.find((c) => c.type === type && c.is_active) ??
      categories.find((c) => c.is_active) ??
      categories[0];
    const parentSlug = match?.slug ?? "";
    return seeds.map((r) => ({ ...r, parent: parentSlug }));
  };

  const downloadTemplate = (fmt: "csv" | "json") => {
    const rowsOut = buildTemplate(templateType);
    if (rowsOut.length === 0) {
      toast({ title: "Template unavailable", variant: "destructive" });
      return;
    }
    const base = `categories-template-${templateType}`;
    if (fmt === "csv") {
      downloadCSV(`${base}.csv`, rowsOut);
    } else {
      const blob = new Blob([JSON.stringify(rowsOut, null, 2)], { type: "application/json" });
      triggerDownload(blob, `${base}.json`);
    }
    setTimeout(() => setTemplateOpen(false), 300);
    toast({
      title: "Template downloaded",
      description: `${TYPE_LABELS[templateType]} · ${fmt.toUpperCase()}`,
    });
  };

  const renderTemplateText = (type: CategoryType, fmt: "csv" | "json"): string => {
    const rowsOut = buildTemplate(type);
    if (rowsOut.length === 0) return "";
    if (fmt === "json") return JSON.stringify(rowsOut, null, 2);
    const headers = Object.keys(rowsOut[0]);
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    return [
      headers.join(","),
      ...rowsOut.map((r) => headers.map((h) => esc((r as any)[h])).join(",")),
    ].join("\n");
  };

  const previewText = useMemo(
    () => renderTemplateText(previewType, previewFmt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewType, previewFmt, categories],
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light flex items-center gap-2">
            <Upload className="h-4 w-4 text-wj-green" /> Bulk import categories
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a CSV or JSON file. Required columns:{" "}
            <code className="text-wj-green">name, type</code>. Optional:{" "}
            <code>slug, parent, display_order, is_active</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
            <Download className="h-3 w-3 mr-1" /> Download template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-3 w-3 mr-1" /> Preview template
          </Button>
        </div>

        {/* Template download picker */}
        <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-light">Generate template</DialogTitle>
              <DialogDescription className="text-xs">
                Choose the category type. The template will use a real existing
                category as the parent example when available.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Category type</p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => {
                  const active = templateType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplateType(t)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? "border-wj-green bg-wj-green/10 text-wj-green"
                          : "border-border/40 hover:border-wj-green/40 text-foreground/80"
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg bg-background/60 border border-border/30 p-2 text-[11px] text-muted-foreground">
                Existing categories: <span className="text-foreground">{categories.length}</span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-border/30">
              <Button variant="ghost" size="sm" onClick={() => setTemplateOpen(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Template PREVIEW */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="font-light">Preview template</DialogTitle>
              <DialogDescription className="text-xs">
                Choose a category type and format. The content below is ready to be
                copied straight into a file.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 min-w-0">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Category type</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TYPES.map((t) => {
                    const active = previewType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPreviewType(t)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          active
                            ? "border-wj-green bg-wj-green/10 text-wj-green"
                            : "border-border/40 hover:border-wj-green/40 text-foreground/80"
                        }`}
                      >
                        {TYPE_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-border/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewFmt("csv")}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      previewFmt === "csv" ? "bg-wj-green text-background" : "text-foreground/70"
                    }`}
                  >
                    <FileSpreadsheet className="h-3 w-3 inline mr-1" /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFmt("json")}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      previewFmt === "json" ? "bg-wj-green text-background" : "text-foreground/70"
                    }`}
                  >
                    <FileJson className="h-3 w-3 inline mr-1" /> JSON
                  </button>
                </div>

                <Button variant="outline" size="sm" onClick={handleCopyPreview} disabled={!previewText}>
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-wj-green" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-lg border border-border/30 bg-background/60 max-h-[50vh] sm:max-h-80 overflow-auto">
                <pre className="p-3 text-[11px] leading-relaxed font-mono whitespace-pre min-w-max">
{previewText || "// No template available."}
                </pre>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-border/30">
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setTemplateType(previewType);
                  setPreviewOpen(false);
                  setTimeout(() => downloadTemplate(previewFmt), 50);
                }}
                disabled={!previewText}
                className="bg-wj-green hover:bg-wj-green/90 w-full sm:w-auto"
              >
                <Download className="h-3 w-3 mr-1" /> Download this template
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                        {(r.raw as any).name && (
                          <span className="text-muted-foreground"> · {(r.raw as any).name}</span>
                        )}
                      </p>
                      <ul className="space-y-0.5 ml-3">
                        {r.errors.map((err, i) => (
                          <li key={i} className="text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="text-[9px] mr-1 border-red-500/30 text-red-300"
                            >
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

            {validRows.length > 0 && (
              <div className="rounded-lg border border-wj-green/20 max-h-56 overflow-y-auto">
                <div className="sticky top-0 bg-background/95 backdrop-blur px-3 py-2 border-b border-wj-green/20 text-xs font-medium text-wj-green flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Preview of valid rows
                </div>
                <table className="w-full text-[11px]">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/20">
                      <th className="text-left px-3 py-1.5 font-normal">Name</th>
                      <th className="text-left px-3 py-1.5 font-normal">Slug</th>
                      <th className="text-left px-3 py-1.5 font-normal">Type</th>
                      <th className="text-left px-3 py-1.5 font-normal">Parent</th>
                      <th className="text-right px-3 py-1.5 font-normal">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 50).map((r) => (
                      <tr key={r.rowIndex} className="border-b border-border/10">
                        <td className="px-3 py-1.5">{r.data!.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {r.data!.slug || slugify(r.data!.name)}
                        </td>
                        <td className="px-3 py-1.5 capitalize text-muted-foreground">{r.data!.type}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {String((r.raw as any).parent ?? "")}
                        </td>
                        <td className="px-3 py-1.5 text-right">{r.data!.display_order ?? 0}</td>
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
              Import{" "}
              {validRows.length > 0
                ? `${validRows.length} categor${validRows.length === 1 ? "y" : "ies"}`
                : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
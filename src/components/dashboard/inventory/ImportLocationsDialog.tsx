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
import { useLocations } from "@/hooks/inventory/useCatalogCrud";
import { parseCsv } from "@/lib/parseCsv";
import { downloadCSV, triggerDownload } from "@/lib/csv";

const TYPES = ["warehouse", "store_floor", "virtual"] as const;
type LocationType = typeof TYPES[number];

const TYPE_LABELS: Record<LocationType, string> = {
  warehouse: "Warehouse",
  store_floor: "Store floor",
  virtual: "Virtual",
};

const rowSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  location_type: z.enum(TYPES, { errorMap: () => ({ message: `must be one of: ${TYPES.join(", ")}` }) }),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  is_active: z.string().trim().optional(),
});

type ParsedRow = z.infer<typeof rowSchema>;

interface RowResult {
  rowIndex: number;
  raw: Record<string, unknown>;
  data?: ParsedRow;
  errors: { field: string; message: string }[];
}

const REQUIRED_HEADERS = ["name", "location_type"];

const TEMPLATE_SEEDS: Record<LocationType, Record<string, string>[]> = {
  warehouse: [
    {
      name: "Rotterdam Main Warehouse",
      location_type: "warehouse",
      address: "Havenstraat 12, 3011 Rotterdam, NL",
      is_active: "true",
    },
  ],
  store_floor: [
    {
      name: "Amsterdam Flagship — Store Floor",
      location_type: "store_floor",
      address: "Prinsengracht 100, 1015 Amsterdam, NL",
      is_active: "true",
    },
  ],
  virtual: [
    {
      name: "Virtual Services",
      location_type: "virtual",
      address: "",
      is_active: "true",
    },
  ],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportLocationsDialog({ open, onClose, onImported }: Props) {
  const { data: locations } = useLocations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateType, setTemplateType] = useState<LocationType>("warehouse");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<LocationType>("warehouse");
  const [previewFmt, setPreviewFmt] = useState<"csv" | "json">("csv");
  const [copied, setCopied] = useState(false);

  const existingNames = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => set.add(l.name.trim().toLowerCase()));
    return set;
  }, [locations]);

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
    const seenNames = new Set<string>();
    return raw.map((r, idx) => {
      const result = rowSchema.safeParse(r);
      const errors: { field: string; message: string }[] = [];

      if (!result.success) {
        result.error.issues.forEach((iss) =>
          errors.push({ field: String(iss.path[0] ?? "row"), message: iss.message }),
        );
      }

      const name = String((r as any).name ?? "").trim().toLowerCase();
      if (name) {
        if (existingNames.has(name)) {
          errors.push({ field: "name", message: `location "${(r as any).name}" already exists in database` });
        } else if (seenNames.has(name)) {
          errors.push({ field: "name", message: `name "${(r as any).name}" duplicated within this file` });
        }
        seenNames.add(name);
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
        return {
          name: d.name,
          location_type: d.location_type,
          address: d.address || null,
          is_active: !["false", "0", "no"].includes((d.is_active ?? "").toLowerCase()),
        };
      });

      const { error, data } = await supabase
        .from("locations")
        .insert(payload as any)
        .select("id");
      if (error) throw error;
      toast({ title: "Import complete", description: `${data?.length ?? 0} locations created` });
      onImported();
      reset();
      onClose();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const buildTemplate = (type: LocationType): Record<string, string>[] => TEMPLATE_SEEDS[type];

  const downloadTemplate = (fmt: "csv" | "json") => {
    const rowsOut = buildTemplate(templateType);
    const base = `locations-template-${templateType}`;
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

  const renderTemplateText = (type: LocationType, fmt: "csv" | "json"): string => {
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
    [previewType, previewFmt],
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
            <Upload className="h-4 w-4 text-wj-green" /> Bulk import locations
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a CSV or JSON file. Required columns:{" "}
            <code className="text-wj-green">name, location_type</code>. Optional:{" "}
            <code>address, is_active</code>.
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
                Choose the location type. The template gives a ready-to-edit example
                row for the chosen type.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Location type</p>
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
                Existing locations: <span className="text-foreground">{locations.length}</span>
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
                Choose a location type and format. The content below can be copied
                straight into a file.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 min-w-0">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Location type</p>
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
                      <th className="text-left px-3 py-1.5 font-normal">Type</th>
                      <th className="text-left px-3 py-1.5 font-normal">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 50).map((r) => (
                      <tr key={r.rowIndex} className="border-b border-border/10">
                        <td className="px-3 py-1.5">{r.data!.name}</td>
                        <td className="px-3 py-1.5 capitalize text-muted-foreground">
                          {r.data!.location_type.replace("_", " ")}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.data!.address || "—"}</td>
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
                ? `${validRows.length} location${validRows.length === 1 ? "" : "s"}`
                : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadCSV, triggerDownload } from "@/lib/csv";

type TableName = "products" | "categories" | "locations";

interface Props {
  table: TableName;
  /** Comma-separated select string. Defaults to "*". */
  select?: string;
  /** Filename prefix without extension. */
  filename?: string;
  label?: string;
}

export default function ExportDataButton({
  table,
  select = "*",
  filename,
  label = "Export",
}: Props) {
  const [busy, setBusy] = useState(false);

  const fetchAll = async (): Promise<Record<string, unknown>[]> => {
    const rows: Record<string, unknown>[] = [];
    const pageSize = 1000;
    let from = 0;
    // paginate in case the table is larger than the default 1000-row limit
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const chunk = (data ?? []) as Record<string, unknown>[];
      rows.push(...chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }
    return rows;
  };

  /** Flatten arrays / objects so CSV cells stay scalar-readable. */
  const flattenForCsv = (rows: Record<string, unknown>[]): Record<string, unknown>[] => {
    if (rows.length === 0) return rows;
    const headers = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => headers.add(k)));
    return rows.map((r) => {
      const out: Record<string, unknown> = {};
      headers.forEach((h) => {
        const v = r[h];
        if (v === null || v === undefined) out[h] = "";
        else if (typeof v === "object") out[h] = JSON.stringify(v);
        else out[h] = v;
      });
      return out;
    });
  };

  const handleExport = async (fmt: "csv" | "json") => {
    setBusy(true);
    try {
      const rows = await fetchAll();
      if (rows.length === 0) {
        toast({ title: "Nothing to export", description: `No rows in ${table}.` });
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const base = `${filename ?? table}-${stamp}`;
      if (fmt === "csv") {
        downloadCSV(`${base}.csv`, flattenForCsv(rows));
      } else {
        const blob = new Blob([JSON.stringify(rows, null, 2)], {
          type: "application/json",
        });
        triggerDownload(blob, `${base}.json`);
      }
      toast({
        title: "Export ready",
        description: `${rows.length} row${rows.length === 1 ? "" : "s"} · ${fmt.toUpperCase()}`,
      });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border/40">
        <DropdownMenuItem onClick={() => handleExport("csv")} className="text-xs">
          <FileSpreadsheet className="h-3 w-3 mr-2" /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")} className="text-xs">
          <FileJson className="h-3 w-3 mr-2" /> Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
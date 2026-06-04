import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Wrench,
  Zap,
  Copy,
  Eye,
  EyeOff,
  ClipboardPaste,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  SERVICE_TYPES_CSV_TEMPLATE,
  SERVICE_TYPES_JSON_TEMPLATE,
  downloadFile,
  parseServiceTypesCsv,
  parseServiceTypesJson,
  type ServiceTypesImportPayload,
} from "./serviceTypesImport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}

export default function ServiceTypesImportDialog({ open, onOpenChange, onImported }: Props) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showExample, setShowExample] = useState(true);

  const exampleText = useMemo(
    () =>
      format === "json"
        ? JSON.stringify(SERVICE_TYPES_JSON_TEMPLATE, null, 2)
        : SERVICE_TYPES_CSV_TEMPLATE,
    [format],
  );

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleText);
      toast.success("Exemplo copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const useExample = () => {
    setText(exampleText);
    toast.success("Exemplo carregado");
  };

  const parsed = useMemo<{ ok: boolean; data?: ServiceTypesImportPayload; error?: string }>(() => {
    if (!text.trim()) return { ok: false };
    try {
      const data = format === "json" ? parseServiceTypesJson(text) : parseServiceTypesCsv(text);
      if (!data.services?.length) return { ok: false, error: "Nenhum serviço encontrado" };
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Conteúdo inválido" };
    }
  }, [text, format]);

  const handleFile = async (file: File) => {
    const t = await file.text();
    setText(t);
    if (file.name.endsWith(".csv")) setFormat("csv");
    else if (file.name.endsWith(".json")) setFormat("json");
  };

  const handleImport = async () => {
    if (!parsed.ok || !parsed.data) {
      toast.error(parsed.error ?? "Cole ou envie um ficheiro válido");
      return;
    }
    setSubmitting(true);
    const payload = parsed.data.services.map((s, i) => ({
      ...s,
      display_order: s.display_order ?? i,
    }));
    const { error } = await supabase
      .from("service_types")
      .upsert(payload as any, { onConflict: "slug" });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${payload.length} serviço(s) importado(s)`);
    onImported?.();
    onOpenChange(false);
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-light flex items-center gap-2">
            <Upload className="h-4 w-4 text-wj-green" />
            Importar Catálogo de Serviços
          </DialogTitle>
          <DialogDescription className="text-xs">
            Importe vários serviços em lote via JSON ou CSV. Faça download do template para começar.
            Serviços com o mesmo <code>slug</code> são atualizados.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={format} onValueChange={(v) => setFormat(v as "json" | "csv")} className="mt-2">
          <div className="flex items-center justify-between gap-3">
            <TabsList className="h-8">
              <TabsTrigger value="json" className="text-xs gap-1">
                <FileJson className="h-3 w-3" /> JSON
              </TabsTrigger>
              <TabsTrigger value="csv" className="text-xs gap-1">
                <FileSpreadsheet className="h-3 w-3" /> CSV
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[11px]"
                onClick={() =>
                  format === "json"
                    ? downloadFile(
                        "service-types-template.json",
                        JSON.stringify(SERVICE_TYPES_JSON_TEMPLATE, null, 2),
                        "application/json",
                      )
                    : downloadFile(
                        "service-types-template.csv",
                        SERVICE_TYPES_CSV_TEMPLATE,
                        "text/csv",
                      )
                }
              >
                <Download className="h-3 w-3 mr-1" />
                Download template {format.toUpperCase()}
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept={format === "json" ? ".json,application/json" : ".csv,text/csv"}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <span className="inline-flex items-center text-[11px] h-8 px-3 rounded-md border border-border/40 hover:bg-muted/40 cursor-pointer">
                  <Upload className="h-3 w-3 mr-1" /> Enviar ficheiro
                </span>
              </label>
            </div>
          </div>

          <TabsContent value="json" className="mt-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Cole aqui o JSON. Ex.: { "services": [ { "name": "..." } ] }'
              className="font-mono text-[11px] min-h-44"
            />
          </TabsContent>
          <TabsContent value="csv" className="mt-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SERVICE_TYPES_CSV_TEMPLATE}
              className="font-mono text-[11px] min-h-44"
            />
          </TabsContent>
        </Tabs>

        {/* Template preview */}
        <div className="border border-border/30 rounded-lg bg-muted/10 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/20">
            <div className="flex items-center gap-2">
              {format === "json" ? (
                <FileJson className="h-3.5 w-3.5 text-wj-green" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-wj-green" />
              )}
              <span className="text-[11px] font-medium">Exemplo {format.toUpperCase()}</span>
              <Badge className="text-[9px] h-4 bg-muted/40 border-border/40">somente leitura</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={useExample}>
                <ClipboardPaste className="h-3 w-3" /> Usar exemplo
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={copyExample}>
                <Copy className="h-3 w-3" /> Copiar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] gap-1"
                onClick={() => setShowExample((v) => !v)}
              >
                {showExample ? (
                  <>
                    <EyeOff className="h-3 w-3" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Mostrar
                  </>
                )}
              </Button>
            </div>
          </div>
          {showExample && (
            <pre className="text-[10.5px] leading-relaxed font-mono p-3 max-h-44 overflow-auto bg-background/40 text-muted-foreground whitespace-pre">
              {exampleText}
            </pre>
          )}
        </div>

        {/* Preview */}
        <div className="border border-border/30 rounded-lg p-3 bg-muted/10 max-h-56 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-3.5 w-3.5 text-wj-green" />
            <span className="text-[11px] font-medium">Pré-visualização</span>
            {parsed.ok && parsed.data && (
              <Badge className="text-[9px] h-4 bg-wj-green/15 text-wj-green border-wj-green/30">
                {parsed.data.services.length} serviço(s)
              </Badge>
            )}
          </div>
          {!text.trim() ? (
            <p className="text-[11px] text-muted-foreground">Conteúdo vazio.</p>
          ) : parsed.error ? (
            <p className="text-[11px] text-red-400">{parsed.error}</p>
          ) : parsed.data ? (
            <ul className="space-y-1">
              {parsed.data.services.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-[11px] border-l-2 pl-2"
                  style={{ borderColor: s.color ?? "#058c42" }}
                >
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${s.color ?? "#058c42"}22` }}
                  >
                    {s.is_emergency ? (
                      <Zap className="h-3 w-3" style={{ color: s.color ?? "#ef4444" }} />
                    ) : (
                      <Wrench className="h-3 w-3" style={{ color: s.color ?? "#058c42" }} />
                    )}
                  </div>
                  <span className="font-medium truncate">{s.name}</span>
                  <span className="text-muted-foreground">· {s.duration_minutes} min</span>
                  <span className="text-muted-foreground">
                    · {s.base_price != null ? `€ ${Number(s.base_price).toFixed(2)}` : "—"}
                  </span>
                  <span className="text-muted-foreground truncate">/{s.slug}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={!parsed.ok || submitting}
            className="bg-wj-green hover:bg-wj-green/90 text-black"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            Importar serviços
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileJson, FileSpreadsheet, Camera, ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  QC_CSV_TEMPLATE,
  QC_JSON_TEMPLATE,
  downloadFile,
  parseQcCsv,
  parseQcJson,
  type QcImportPayload,
} from "./qcImport";
import { useQualityControl } from "@/hooks/qc/useQualityControl";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: (templateId: string) => void;
  /** When provided, the dialog imports stages/tasks INTO this template instead of creating a new one. */
  appendToTemplateId?: string;
  appendTemplateName?: string;
}

export default function QualityControlImportDialog({
  open,
  onOpenChange,
  onImported,
  appendToTemplateId,
  appendTemplateName,
}: Props) {
  const { importTemplate, importStagesIntoTemplate } = useQualityControl();
  const isAppend = !!appendToTemplateId;
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo<{ ok: boolean; data?: QcImportPayload; error?: string }>(() => {
    if (!text.trim()) return { ok: false };
    try {
      const data =
        format === "json"
          ? parseQcJson(text)
          : parseQcCsv(text, name.trim() || "Modelo importado");
      if (format === "json" && name.trim()) data.name = name.trim();
      return { ok: true, data };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Conteúdo inválido" };
    }
  }, [text, format, name]);

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
    if (isAppend && appendToTemplateId) {
      const ok = await importStagesIntoTemplate(appendToTemplateId, parsed.data.stages);
      setSubmitting(false);
      if (ok) {
        onImported?.(appendToTemplateId);
        onOpenChange(false);
        setText("");
        setName("");
      }
    } else {
      const tpl = await importTemplate(parsed.data);
      setSubmitting(false);
      if (tpl) {
        onImported?.(tpl.id);
        onOpenChange(false);
        setText("");
        setName("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-light flex items-center gap-2">
            <Upload className="h-4 w-4 text-wj-green" />
            {isAppend ? "Importar etapas" : "Importar Controlo de Qualidade"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isAppend
              ? `As etapas serão adicionadas ao modelo "${appendTemplateName ?? ""}". O nome do ficheiro é ignorado.`
              : "Importe um modelo completo via JSON ou CSV. Faça download do template para começar."}
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
                        "qc-template.json",
                        JSON.stringify(QC_JSON_TEMPLATE, null, 2),
                        "application/json",
                      )
                    : downloadFile("qc-template.csv", QC_CSV_TEMPLATE, "text/csv")
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

          <TabsContent value="json" className="mt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Cole aqui o JSON do modelo. Ex.: { "name": "...", "stages": [...] }'
                className="font-mono text-[11px] min-h-44"
              />
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nome (opcional)
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sobrescrever nome"
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Deixe em branco para usar o nome do ficheiro.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="mt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={QC_CSV_TEMPLATE}
                className="font-mono text-[11px] min-h-44"
              />
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nome do modelo
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Revisão Completa"
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  CSV não inclui o nome do modelo — defina-o aqui.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <div className="border border-border/30 rounded-lg p-3 bg-muted/10 max-h-56 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-3.5 w-3.5 text-wj-green" />
            <span className="text-[11px] font-medium">Pré-visualização</span>
            {parsed.ok && parsed.data && (
              <Badge className="text-[9px] h-4 bg-wj-green/15 text-wj-green border-wj-green/30">
                {parsed.data.stages?.length ?? 0} etapa(s) ·{" "}
                {parsed.data.stages?.reduce((a, s) => a + (s.tasks?.length ?? 0), 0) ?? 0} tarefa(s)
              </Badge>
            )}
          </div>
          {!text.trim() ? (
            <p className="text-[11px] text-muted-foreground">Conteúdo vazio.</p>
          ) : parsed.error ? (
            <p className="text-[11px] text-red-400">{parsed.error}</p>
          ) : parsed.data ? (
            <div className="space-y-2">
              <div className="text-xs font-medium">{parsed.data.name}</div>
              {parsed.data.description && (
                <div className="text-[11px] text-muted-foreground">{parsed.data.description}</div>
              )}
              <ol className="space-y-1.5">
                {(parsed.data.stages ?? []).map((s, i) => (
                  <li key={i} className="text-[11px] border-l-2 border-wj-green/30 pl-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {i + 1}. {s.name}
                      </span>
                      {s.requires_photo && (
                        <Badge className="text-[9px] h-4 bg-muted/40 border-border/40 px-1.5">
                          <Camera className="h-2.5 w-2.5 mr-0.5" /> {s.photo_min_count ?? 1}
                        </Badge>
                      )}
                    </div>
                    {s.tasks && s.tasks.length > 0 && (
                      <ul className="ml-3 mt-0.5 text-muted-foreground">
                        {s.tasks.map((t, j) => (
                          <li key={j}>· {t.label}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
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
            className="bg-wj-green hover:bg-wj-green/90"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Importar modelo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
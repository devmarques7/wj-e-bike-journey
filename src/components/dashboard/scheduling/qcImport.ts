export type QcImportPayload = {
  name: string;
  description?: string | null;
  stages?: Array<{
    name: string;
    description?: string | null;
    requires_photo?: boolean;
    photo_min_count?: number;
    tasks?: Array<{ label: string; description?: string | null; is_required?: boolean }>;
  }>;
};

export const QC_JSON_TEMPLATE: QcImportPayload = {
  name: "Controlo de Qualidade — Modelo",
  description: "Descrição opcional do modelo",
  stages: [
    {
      name: "Receção da bicicleta",
      description: "Inspeção visual e registo de estado",
      requires_photo: true,
      photo_min_count: 2,
      tasks: [
        { label: "Confirmar n.º de série", is_required: true },
        { label: "Registar acessórios entregues", is_required: true },
      ],
    },
    {
      name: "Diagnóstico técnico",
      requires_photo: false,
      photo_min_count: 1,
      tasks: [
        { label: "Testar travões", is_required: true },
        { label: "Testar motor e bateria", is_required: true },
      ],
    },
    {
      name: "Entrega final",
      requires_photo: true,
      photo_min_count: 1,
      tasks: [{ label: "Foto final da bicicleta", is_required: true }],
    },
  ],
};

export const QC_CSV_TEMPLATE = `stage,stage_description,requires_photo,photo_min_count,task,task_description,is_required
Receção da bicicleta,Inspeção visual e estado,true,2,Confirmar n.º de série,,true
Receção da bicicleta,,true,2,Registar acessórios entregues,,true
Diagnóstico técnico,,false,1,Testar travões,,true
Diagnóstico técnico,,false,1,Testar motor e bateria,,true
Entrega final,,true,1,Foto final da bicicleta,,true
`;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const truthy = (v: string) => /^(true|1|sim|yes|y|s)$/i.test(v.trim());

export function parseQcCsv(csv: string, fallbackName = "Modelo importado"): QcImportPayload {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new Error("CSV vazio");
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const iStage = idx("stage");
  const iStageDesc = idx("stage_description");
  const iReqPhoto = idx("requires_photo");
  const iPhotoMin = idx("photo_min_count");
  const iTask = idx("task");
  const iTaskDesc = idx("task_description");
  const iReq = idx("is_required");
  if (iStage < 0) throw new Error('Coluna "stage" em falta');

  const stagesMap = new Map<string, QcImportPayload["stages"][number]>();
  for (let r = 1; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    const stageName = row[iStage];
    if (!stageName) continue;
    let stage = stagesMap.get(stageName);
    if (!stage) {
      stage = {
        name: stageName,
        description: iStageDesc >= 0 ? row[iStageDesc] || null : null,
        requires_photo: iReqPhoto >= 0 ? truthy(row[iReqPhoto] ?? "") : false,
        photo_min_count: iPhotoMin >= 0 ? Number(row[iPhotoMin]) || 1 : 1,
        tasks: [],
      };
      stagesMap.set(stageName, stage);
    }
    const taskLabel = iTask >= 0 ? row[iTask] : "";
    if (taskLabel) {
      stage.tasks!.push({
        label: taskLabel,
        description: iTaskDesc >= 0 ? row[iTaskDesc] || null : null,
        is_required: iReq >= 0 ? truthy(row[iReq] ?? "true") : true,
      });
    }
  }
  return {
    name: fallbackName,
    stages: Array.from(stagesMap.values()),
  };
}

export function parseQcJson(text: string): QcImportPayload {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("JSON inválido");
  if (!data.name) data.name = "Modelo importado";
  if (!Array.isArray(data.stages)) data.stages = [];
  return data as QcImportPayload;
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
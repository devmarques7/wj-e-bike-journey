export type ServiceTypeImportItem = {
  name: string;
  slug?: string;
  description?: string | null;
  duration_minutes?: number;
  base_price?: number | null;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean;
  is_emergency?: boolean;
  priority_score?: number;
  buffer_minutes_override?: number | null;
  covered_by_plan_levels?: number[] | null;
  display_order?: number;
};

export type ServiceTypesImportPayload = { services: ServiceTypeImportItem[] };

export const SERVICE_TYPES_JSON_TEMPLATE: ServiceTypesImportPayload = {
  services: [
    {
      name: "Revisão Básica",
      slug: "basic-service",
      description: "Verificação geral e ajustes ligeiros",
      duration_minutes: 60,
      base_price: 49.99,
      color: "#058c42",
      icon: "wrench",
      is_active: true,
      is_emergency: false,
      priority_score: 1,
      buffer_minutes_override: 10,
      covered_by_plan_levels: [1, 2, 3],
    },
    {
      name: "Revisão Completa",
      slug: "full-service",
      description: "Manutenção completa multi-ponto",
      duration_minutes: 120,
      base_price: 89.99,
      color: "#058c42",
      icon: "wrench",
      is_active: true,
      is_emergency: false,
      priority_score: 2,
      buffer_minutes_override: 15,
      covered_by_plan_levels: [2, 3],
    },
    {
      name: "Urgência",
      slug: "emergency",
      description: "Intervenção urgente",
      duration_minutes: 60,
      base_price: 129.99,
      color: "#ef4444",
      icon: "zap",
      is_active: true,
      is_emergency: true,
      priority_score: 10,
      buffer_minutes_override: 5,
      covered_by_plan_levels: [3],
    },
  ],
};

export const SERVICE_TYPES_CSV_TEMPLATE = `name,slug,description,duration_minutes,base_price,color,icon,is_active,is_emergency,priority_score,buffer_minutes_override,covered_by_plan_levels
Revisão Básica,basic-service,Verificação geral e ajustes,60,49.99,#058c42,wrench,true,false,1,10,"1|2|3"
Revisão Completa,full-service,Manutenção completa multi-ponto,120,89.99,#058c42,wrench,true,false,2,15,"2|3"
Urgência,emergency,Intervenção urgente,60,129.99,#ef4444,zap,true,true,10,5,"3"
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

const truthy = (v: string) => /^(true|1|sim|yes|y|s)$/i.test((v ?? "").trim());
const num = (v: string) => {
  const n = Number((v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function parseServiceTypesCsv(csv: string): ServiceTypesImportPayload {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new Error("CSV vazio");
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const iName = idx("name");
  if (iName < 0) throw new Error('Coluna "name" em falta');
  const cols = {
    slug: idx("slug"),
    description: idx("description"),
    duration: idx("duration_minutes"),
    price: idx("base_price"),
    color: idx("color"),
    icon: idx("icon"),
    active: idx("is_active"),
    emergency: idx("is_emergency"),
    priority: idx("priority_score"),
    buffer: idx("buffer_minutes_override"),
    plans: idx("covered_by_plan_levels"),
  };

  const services: ServiceTypeImportItem[] = [];
  for (let r = 1; r < lines.length; r++) {
    const row = parseCsvLine(lines[r]);
    const name = row[iName];
    if (!name) continue;
    const plansRaw = cols.plans >= 0 ? row[cols.plans] : "";
    const plans = plansRaw
      ? plansRaw
          .split(/[|;]/)
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isFinite(v))
      : null;
    services.push({
      name,
      slug: cols.slug >= 0 && row[cols.slug] ? row[cols.slug] : slugify(name),
      description: cols.description >= 0 ? row[cols.description] || null : null,
      duration_minutes: cols.duration >= 0 ? num(row[cols.duration]) ?? 60 : 60,
      base_price: cols.price >= 0 ? num(row[cols.price]) ?? null : null,
      color: cols.color >= 0 ? row[cols.color] || null : null,
      icon: cols.icon >= 0 ? row[cols.icon] || null : null,
      is_active: cols.active >= 0 ? truthy(row[cols.active]) : true,
      is_emergency: cols.emergency >= 0 ? truthy(row[cols.emergency]) : false,
      priority_score: cols.priority >= 0 ? num(row[cols.priority]) ?? 0 : 0,
      buffer_minutes_override:
        cols.buffer >= 0 ? num(row[cols.buffer]) ?? null : null,
      covered_by_plan_levels: plans,
    });
  }
  return { services };
}

export function parseServiceTypesJson(text: string): ServiceTypesImportPayload {
  const data = JSON.parse(text);
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.services)
      ? data.services
      : null;
  if (!arr) throw new Error('JSON deve ser um array ou ter a chave "services"');
  const services: ServiceTypeImportItem[] = arr.map((s: any) => {
    if (!s?.name) throw new Error("Cada serviço requer um campo 'name'");
    return {
      name: String(s.name),
      slug: s.slug ? String(s.slug) : slugify(String(s.name)),
      description: s.description ?? null,
      duration_minutes: Number(s.duration_minutes ?? 60),
      base_price: s.base_price != null ? Number(s.base_price) : null,
      color: s.color ?? null,
      icon: s.icon ?? null,
      is_active: s.is_active ?? true,
      is_emergency: s.is_emergency ?? false,
      priority_score: Number(s.priority_score ?? 0),
      buffer_minutes_override:
        s.buffer_minutes_override != null ? Number(s.buffer_minutes_override) : null,
      covered_by_plan_levels: Array.isArray(s.covered_by_plan_levels)
        ? s.covered_by_plan_levels.map(Number)
        : null,
      display_order: s.display_order != null ? Number(s.display_order) : undefined,
    };
  });
  return { services };
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
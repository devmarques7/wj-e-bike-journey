/** Cores fixas do CRM (gráficos). Tudo o resto usa tokens semânticos. */
export const CRM_COLORS = {
  // Planos (tier)
  care: "#60a5fa",
  performance: "#a78bfa",
  prestige: "#f59e0b",
  // Health
  healthHigh: "#34d399",
  healthMid: "#fb923c",
  healthLow: "#f87171",
  // Lifecycle (stacked area)
  active: "#34d399",
  loyal: "#a78bfa",
  atRisk: "#fb923c",
  churned: "#f87171",
  // Accent
  accent: "#e8593c",
} as const;

export const LIFECYCLE_META: Record<
  string,
  { label: string; color: string }
> = {
  lead: { label: "Lead", color: "#94a3b8" },
  new: { label: "Novo", color: "#60a5fa" },
  active_subscriber: { label: "Activo", color: CRM_COLORS.active },
  loyal: { label: "Fiel", color: CRM_COLORS.loyal },
  at_risk: { label: "Em risco", color: CRM_COLORS.atRisk },
  churned: { label: "Churn", color: CRM_COLORS.churned },
};

export function healthColor(score: number) {
  if (score >= 70) return CRM_COLORS.healthHigh;
  if (score >= 40) return CRM_COLORS.healthMid;
  return CRM_COLORS.healthLow;
}

export function relativeTime(date: string | Date | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 30) return `há ${Math.floor(day / 30)} mês${day >= 60 ? "es" : ""}`;
  if (day > 0) return `há ${day} dia${day > 1 ? "s" : ""}`;
  if (hr > 0) return `há ${hr}h`;
  if (min > 0) return `há ${min}min`;
  return "agora";
}

export function initials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
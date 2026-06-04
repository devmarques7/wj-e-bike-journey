import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminKpis = {
  monthly_revenue: number;
  monthly_revenue_prev: number;
  active_members: number;
  active_members_prev: number;
  appointments_today: number;
  appointments_today_completed: number;
  workshop_load_pct: number;
};

export type PlanRanking = {
  plan_id: string;
  name: string;
  color_hex: string | null;
  tier_level: number;
  active_subs: number;
  mrr: number;
  pct: number;
};

export type WorkshopToday = {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  capacity: number;
  load_pct: number;
  last_end_time: string | null;
};

export type AdminAlertRow = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  created_at: string;
  severity: "info" | "success" | "warning" | "error";
};

const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

function severityFor(type: string): AdminAlertRow["severity"] {
  if (type.includes("error") || type.includes("failed") || type.includes("low_stock")) return "error";
  if (type.includes("warning") || type.includes("capacity")) return "warning";
  if (type.includes("created") || type.includes("paid") || type.includes("success")) return "success";
  return "info";
}

export function useAdminOverviewData() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<AdminKpis>({
    monthly_revenue: 0,
    monthly_revenue_prev: 0,
    active_members: 0,
    active_members_prev: 0,
    appointments_today: 0,
    appointments_today_completed: 0,
    workshop_load_pct: 0,
  });
  const [planRanking, setPlanRanking] = useState<PlanRanking[]>([]);
  const [workshop, setWorkshop] = useState<WorkshopToday>({
    total: 0, pending: 0, in_progress: 0, completed: 0,
    capacity: 0, load_pct: 0, last_end_time: null,
  });
  const [alerts, setAlerts] = useState<AdminAlertRow[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
    const today = now.toISOString().slice(0, 10);
    const todayDow = now.getUTCDay();

    const [
      paysRes, subsRes, plansRes, pvRes, apptsRes, bhRes, notifRes,
    ] = await Promise.all([
      supabase.from("payments").select("amount, paid_at, status").gte("paid_at", prevMonthStart),
      supabase.from("subscriptions").select("user_id, plan_version_id, status, started_at, canceled_at"),
      supabase.from("plans").select("id, name, color_hex, tier_level, is_active").eq("is_active", true),
      supabase.from("plan_versions").select("id, plan_id, price, interval, status"),
      supabase.from("appointments").select("status, scheduled_start_time, scheduled_end_time, duration_minutes").eq("scheduled_date", today),
      supabase.from("business_hours").select("day_of_week, is_open, max_parallel_services, open_time, close_time, valid_from, valid_until").eq("day_of_week", todayDow),
      supabase.from("notifications").select("id, type, title, message, link, created_at").order("created_at", { ascending: false }).limit(8),
    ]);

    // ---- Revenue ----
    const curKey = monthKey(now);
    const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const prevKey = monthKey(prevDate);
    let curRev = 0; let prevRev = 0;
    for (const p of paysRes.data ?? []) {
      if (p.status !== "succeeded") continue;
      const k = monthKey(new Date(p.paid_at as string));
      if (k === curKey) curRev += Number(p.amount ?? 0);
      else if (k === prevKey) prevRev += Number(p.amount ?? 0);
    }

    // ---- Subscriptions / Plans ----
    const subs = subsRes.data ?? [];
    const plans = plansRes.data ?? [];
    const pvs = pvRes.data ?? [];
    const pvById = new Map(pvs.map((v: any) => [v.id, v]));

    const activeSubs = subs.filter((s: any) => s.status === "active");
    const activeMembers = new Set(activeSubs.map((s: any) => s.user_id)).size;
    const prevActiveMembers = subs.filter((s: any) => {
      const started = s.started_at ? new Date(s.started_at) : null;
      const canceled = s.canceled_at ? new Date(s.canceled_at) : null;
      const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return started && started < cutoff && (!canceled || canceled >= cutoff);
    }).length;

    const intervalToMonths: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12, lifetime: 60 };
    const planAgg = new Map<string, { active_subs: number; mrr: number }>();
    for (const s of activeSubs) {
      const pv: any = pvById.get(s.plan_version_id);
      if (!pv) continue;
      const planId = pv.plan_id as string;
      const monthly = Number(pv.price ?? 0) / (intervalToMonths[pv.interval] ?? 1);
      const cur = planAgg.get(planId) ?? { active_subs: 0, mrr: 0 };
      cur.active_subs += 1;
      cur.mrr += monthly;
      planAgg.set(planId, cur);
    }
    const totalSubs = Array.from(planAgg.values()).reduce((a, b) => a + b.active_subs, 0) || 1;
    const ranking: PlanRanking[] = plans
      .map((p: any) => {
        const agg = planAgg.get(p.id) ?? { active_subs: 0, mrr: 0 };
        return {
          plan_id: p.id,
          name: p.name,
          color_hex: p.color_hex,
          tier_level: p.tier_level,
          active_subs: agg.active_subs,
          mrr: agg.mrr,
          pct: Math.round((agg.active_subs / totalSubs) * 100),
        };
      })
      .sort((a, b) => b.mrr - a.mrr);

    // ---- Workshop today ----
    const appts = apptsRes.data ?? [];
    const bh = (bhRes.data ?? []).filter((r: any) => r.valid_from <= today && (!r.valid_until || r.valid_until >= today));
    const cap = bh[0]?.max_parallel_services ?? 0;
    const open = bh[0]?.open_time as string | undefined;
    const close = bh[0]?.close_time as string | undefined;
    let dailyCapacity = 0;
    if (cap && open && close) {
      const [oh, om] = open.split(":").map(Number);
      const [ch, cm] = close.split(":").map(Number);
      const hours = ((ch * 60 + cm) - (oh * 60 + om)) / 60;
      dailyCapacity = Math.max(1, Math.round((hours / 1) * cap)); // ~1h per slot
    }
    const pending = appts.filter((a: any) => ["pending", "confirmed", "rescheduled"].includes(a.status)).length;
    const in_progress = appts.filter((a: any) => a.status === "in_progress").length;
    const completed = appts.filter((a: any) => a.status === "completed").length;
    const total = appts.length;
    const load_pct = dailyCapacity > 0 ? Math.min(100, Math.round((total / dailyCapacity) * 100)) : 0;
    const lastEnd = appts
      .map((a: any) => a.scheduled_end_time as string | null)
      .filter(Boolean)
      .sort()
      .pop() ?? null;

    setWorkshop({
      total, pending, in_progress, completed,
      capacity: dailyCapacity, load_pct, last_end_time: lastEnd,
    });

    // ---- Alerts ----
    const alertRows: AdminAlertRow[] = (notifRes.data ?? []).map((n: any) => ({
      id: n.id, type: n.type, title: n.title, message: n.message,
      link: n.link, created_at: n.created_at,
      severity: severityFor(n.type),
    }));
    setAlerts(alertRows);

    // ---- KPIs ----
    setKpis({
      monthly_revenue: curRev,
      monthly_revenue_prev: prevRev,
      active_members: activeMembers,
      active_members_prev: prevActiveMembers,
      appointments_today: total,
      appointments_today_completed: completed,
      workshop_load_pct: load_pct,
    });
    setPlanRanking(ranking);

    // total members = customer_profiles count (cheap header count)
    const { count } = await supabase
      .from("customer_profiles")
      .select("id", { count: "exact", head: true });
    setTotalMembers(count ?? 0);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  return { loading, kpis, planRanking, workshop, alerts, totalMembers, refetch: fetchAll };
}
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  tier_level: number;
  description: string | null;
  color_hex: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  stripe_product_id: string | null;
};

export type PlanVersion = {
  id: string;
  plan_id: string;
  version_number: number;
  price: number;
  currency: string;
  interval: "monthly" | "quarterly" | "yearly" | "lifetime";
  trial_days: number;
  features: string[];
  status: "draft" | "active" | "archived";
  effective_from: string;
  stripe_price_id: string | null;
};

export type PlanWithActiveVersion = Plan & { activeVersion: PlanVersion | null; activeSubs: number };

export type Subscription = {
  id: string;
  user_id: string;
  plan_version_id: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  payment_method: string | null;
  started_at: string;
  current_period_start: string;
  current_period_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
};

export type Payment = {
  id: string;
  subscription_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  method: string;
  paid_at: string;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  invoice_url: string | null;
};

/* ============ PLANS ============ */

export function usePlans() {
  const [plans, setPlans] = useState<PlanWithActiveVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: plansData } = await supabase
      .from("plans")
      .select("*")
      .order("display_order");
    const { data: versions } = await supabase
      .from("plan_versions")
      .select("*")
      .eq("status", "active");
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("plan_version_id")
      .eq("status", "active");

    const subCount = new Map<string, number>();
    (subs ?? []).forEach((s: any) => {
      subCount.set(s.plan_version_id, (subCount.get(s.plan_version_id) ?? 0) + 1);
    });

    const merged: PlanWithActiveVersion[] = (plansData ?? []).map((p: any) => {
      const av = (versions ?? []).find((v: any) => v.plan_id === p.id) ?? null;
      const active = av
        ? (subs ?? []).filter((s: any) => s.plan_version_id === av.id).length
        : 0;
      return {
        ...p,
        activeVersion: av ? { ...av, features: Array.isArray(av.features) ? av.features : [] } : null,
        activeSubs: active,
      };
    });
    setPlans(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { plans, loading, refetch };
}

export async function createPlan(input: {
  name: string;
  slug: string;
  tier_level: number;
  description?: string;
  color_hex?: string;
  display_order?: number;
  is_default?: boolean;
}) {
  return supabase.from("plans").insert(input).select().single();
}

export async function updatePlan(id: string, patch: Partial<Plan>) {
  return supabase.from("plans").update(patch).eq("id", id);
}

export async function createPlanVersion(input: {
  p_plan_id: string;
  p_price: number;
  p_currency?: string;
  p_interval?: PlanVersion["interval"];
  p_trial_days?: number;
  p_features?: string[];
  p_activate?: boolean;
}) {
  return supabase.rpc("fn_create_plan_version", {
    p_plan_id: input.p_plan_id,
    p_price: input.p_price,
    p_currency: input.p_currency ?? "EUR",
    p_interval: input.p_interval ?? "monthly",
    p_trial_days: input.p_trial_days ?? 0,
    p_features: (input.p_features ?? []) as any,
    p_activate: input.p_activate ?? true,
  });
}

/* ============ PLAN DETAIL ============ */

export function usePlanDetail(planId: string | undefined) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from("plans").select("*").eq("id", planId).maybeSingle(),
      supabase.from("plan_versions").select("*").eq("plan_id", planId).order("version_number", { ascending: false }),
    ]);
    setPlan(p as any);
    setVersions(
      ((v ?? []) as any[]).map((x) => ({ ...x, features: Array.isArray(x.features) ? x.features : [] }))
    );

    const versionIds = (v ?? []).map((x: any) => x.id);
    if (versionIds.length) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, profile:profiles!inner(full_name, email)")
        .in("plan_version_id", versionIds)
        .order("started_at", { ascending: false });
      setSubscribers((subs ?? []) as any[]);
    } else {
      setSubscribers([]);
    }
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { plan, versions, subscribers, loading, refetch };
}

/* ============ SUBSCRIPTIONS LIST ============ */

export function useSubscriptions() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select(`*,
        plan_version:plan_versions!inner(*, plan:plans!inner(name, slug, color_hex))`)
      .order("started_at", { ascending: false });
    let merged = (data ?? []) as any[];
    // No FK between subscriptions.user_id and profiles.user_id, so the embed
    // above may silently return null. Fetch profiles separately and merge.
    const userIds = Array.from(new Set(merged.map((r) => r.user_id).filter(Boolean)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const byId = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      merged = merged.map((r) => ({
        ...r,
        profile: r.profile ?? byId.get(r.user_id) ?? null,
      }));
    }
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, loading, refetch };
}

/* ============ KPIs ============ */

export function usePlansKPIs() {
  const [kpis, setKpis] = useState({
    mrr: 0,
    activeSubs: 0,
    churnRate: 0,
    arpu: 0,
    timeseries: [] as { month: string; revenue: number }[],
    perPlan: [] as { plan_id: string; name: string; active_subs: number; mrr: number }[],
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [{ data: perPlan }, { data: ts }] = await Promise.all([
      supabase.from("v_plan_kpis").select("*"),
      supabase.from("v_mrr_timeseries").select("*"),
    ]);
    const mrr = (perPlan ?? []).reduce((s: number, r: any) => s + Number(r.mrr ?? 0), 0);
    const activeSubs = (perPlan ?? []).reduce((s: number, r: any) => s + Number(r.active_subs ?? 0), 0);
    const churn30 = (perPlan ?? []).reduce((s: number, r: any) => s + Number(r.churn_30d ?? 0), 0);
    const churnRate = activeSubs > 0 ? (churn30 / (activeSubs + churn30)) * 100 : 0;
    const arpu = activeSubs > 0 ? mrr / activeSubs : 0;
    setKpis({
      mrr,
      activeSubs,
      churnRate,
      arpu,
      timeseries: ((ts ?? []) as any[]).map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
      perPlan: ((perPlan ?? []) as any[]).map((r) => ({
        plan_id: r.plan_id,
        name: r.name,
        active_subs: Number(r.active_subs ?? 0),
        mrr: Number(r.mrr ?? 0),
      })),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { kpis, loading, refetch };
}

/* ============ SUBSCRIBER DETAIL ============ */

export function useSubscriberDetail(subscriptionId: string | undefined) {
  const [data, setData] = useState<{
    subscription: any | null;
    payments: Payment[];
    events: any[];
    summary: any | null;
  }>({ subscription: null, payments: [], events: [], summary: null });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!subscriptionId) return;
    setLoading(true);
    const [{ data: sub }, { data: payments }, { data: events }, { data: summary }] = await Promise.all([
      supabase.from("subscriptions")
        .select(`*, plan_version:plan_versions!inner(*, plan:plans!inner(*)), profile:profiles(full_name, email, phone, avatar_url)`)
        .eq("id", subscriptionId).maybeSingle(),
      supabase.from("payments").select("*").eq("subscription_id", subscriptionId).order("paid_at", { ascending: false }),
      supabase.from("subscription_events").select("*").eq("subscription_id", subscriptionId).order("created_at", { ascending: false }),
      supabase.from("v_subscriber_summary").select("*").eq("subscription_id", subscriptionId).maybeSingle(),
    ]);
    setData({
      subscription: sub,
      payments: (payments ?? []) as any,
      events: (events ?? []) as any,
      summary,
    });
    setLoading(false);
  }, [subscriptionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...data, loading, refetch };
}

/* ============ MUTATIONS ============ */

export async function registerManualPayment(input: {
  subscription_id: string;
  amount: number;
  method: "cash" | "bank_transfer" | "pos_card" | "other";
  period_start?: string;
  period_end?: string;
  notes?: string;
}) {
  return supabase.rpc("fn_register_manual_payment", {
    p_subscription_id: input.subscription_id,
    p_amount: input.amount,
    p_method: input.method,
    p_period_start: input.period_start ?? null,
    p_period_end: input.period_end ?? null,
    p_notes: input.notes ?? null,
  });
}

export async function changeSubscriptionPlan(subscription_id: string, new_plan_version_id: string) {
  return supabase.rpc("fn_change_subscription_plan", {
    p_subscription_id: subscription_id,
    p_new_plan_version_id: new_plan_version_id,
  });
}

export async function cancelSubscription(subscription_id: string, at_period_end = true) {
  return supabase.rpc("fn_cancel_subscription", {
    p_subscription_id: subscription_id,
    p_at_period_end: at_period_end,
  });
}
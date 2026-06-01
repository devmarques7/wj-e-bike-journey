import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LifecycleStage =
  | "lead"
  | "new"
  | "active_subscriber"
  | "loyal"
  | "at_risk"
  | "churned";

export type CrmCustomer = {
  id: string;
  user_id: string;
  assigned_to: string | null;
  lifecycle_stage: LifecycleStage;
  health_score: number;
  churn_risk_score: number;
  ltv_estimated: number;
  total_spent: number;
  rfm_score: number;
  last_contact_at: string | null;
  tags: string[];
  notes_count: number;
  updated_at: string;
  // joined
  full_name: string | null;
  email: string | null;
  phone: string | null;
  plan_name: string | null;
  plan_tier: number | null;
};

export type CrmHealthSnapshot = {
  snapshot_date: string;
  lifecycle_stage: LifecycleStage;
  health_score: number;
};

export type CrmNote = {
  id: string;
  customer_id: string;
  note_type: string;
  content: string;
  is_pinned: boolean;
  followup_date: string | null;
  followup_done: boolean;
  created_by: string | null;
  created_at: string;
  customer_name?: string;
};

export type CrmInteraction = {
  id: string;
  customer_id: string;
  type: string;
  direction: string;
  duration_min: number | null;
  subject: string | null;
  summary: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
};

export type CrmSegment = {
  id: string;
  name: string;
  description: string | null;
  segment_type: "dynamic" | "static";
  conditions: any;
  color: string;
  member_count?: number;
};

export type CrmBike = {
  id: string;
  customer_id: string;
  model: string;
  serial: string | null;
  color: string | null;
  image_url: string | null;
  purchased_at: string | null;
  km: number;
  last_service_at: string | null;
  next_service_at: string | null;
  is_active: boolean;
};

/** Loads all customers with joined profile + plan. */
export function useCrmCustomers() {
  const [rows, setRows] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data: cps } = await supabase
      .from("customer_profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    const userIds = (cps ?? []).map((c) => c.user_id);
    if (userIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const [{ data: profiles }, { data: subs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds),
      supabase
        .from("subscriptions")
        .select("user_id, plan_version_id, status")
        .in("user_id", userIds)
        .eq("status", "active"),
    ]);

    const planVersionIds = (subs ?? []).map((s) => s.plan_version_id).filter(Boolean);
    let plans: any[] = [];
    if (planVersionIds.length > 0) {
      const { data: pvs } = await supabase
        .from("plan_versions")
        .select("id, plan_id")
        .in("id", planVersionIds);
      const planIds = (pvs ?? []).map((p) => p.plan_id);
      const { data: ps } = await supabase
        .from("plans")
        .select("id, name, tier_level")
        .in("id", planIds);
      plans = (pvs ?? []).map((pv) => {
        const p = (ps ?? []).find((x) => x.id === pv.plan_id);
        return {
          plan_version_id: pv.id,
          name: p?.name ?? null,
          tier_level: p?.tier_level ?? null,
        };
      });
    }

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const subMap = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
    const planMap = new Map(plans.map((p) => [p.plan_version_id, p]));

    const merged: CrmCustomer[] = (cps ?? []).map((c: any) => {
      const prof = profileMap.get(c.user_id);
      const sub = subMap.get(c.user_id);
      const plan = sub ? planMap.get(sub.plan_version_id) : null;
      return {
        ...c,
        full_name: prof?.full_name ?? "—",
        email: prof?.email ?? null,
        phone: prof?.phone ?? null,
        plan_name: plan?.name ?? null,
        plan_tier: plan?.tier_level ?? null,
      };
    });

    setRows(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("crm-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_profiles" },
        fetchAll,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return { rows, loading, refetch: fetchAll };
}

/** Aggregate KPIs for overview tab. */
export function useCrmKpis(rows: CrmCustomer[]) {
  return useMemo(() => {
    const total = rows.length;
    const avgHealth =
      total > 0
        ? Math.round(rows.reduce((s, r) => s + r.health_score, 0) / total)
        : 0;
    const churnRate =
      total > 0
        ? +(
            (rows.filter((r) => r.lifecycle_stage === "churned").length / total) *
            100
          ).toFixed(1)
        : 0;
    const avgLtv =
      total > 0
        ? Math.round(rows.reduce((s, r) => s + Number(r.ltv_estimated), 0) / total)
        : 0;
    const highRisk = rows.filter((r) => r.churn_risk_score >= 70).length;
    return { total, avgHealth, churnRate, avgLtv, highRisk };
  }, [rows]);
}

/** Monthly health snapshots aggregated by lifecycle stage for the area chart. */
export function useCrmEvolution() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: snaps } = await supabase
        .from("customer_health_snapshots")
        .select("snapshot_date, lifecycle_stage")
        .order("snapshot_date");
      const grouped: Record<string, any> = {};
      (snaps ?? []).forEach((s: any) => {
        const key = s.snapshot_date.slice(0, 7); // YYYY-MM
        if (!grouped[key])
          grouped[key] = {
            month: key,
            active_subscriber: 0,
            loyal: 0,
            at_risk: 0,
            churned: 0,
            new: 0,
            lead: 0,
          };
        grouped[key][s.lifecycle_stage] += 1;
      });
      setData(Object.values(grouped));
      setLoading(false);
    })();
  }, []);

  return { data, loading };
}

/** All segments with member count. */
export function useCrmSegments() {
  const [segments, setSegments] = useState<CrmSegment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [{ data: segs }, { data: members }] = await Promise.all([
      supabase
        .from("customer_segments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("customer_segment_members").select("segment_id"),
    ]);
    const counts: Record<string, number> = {};
    (members ?? []).forEach((m: any) => {
      counts[m.segment_id] = (counts[m.segment_id] ?? 0) + 1;
    });
    setSegments(
      (segs ?? []).map((s: any) => ({ ...s, member_count: counts[s.id] ?? 0 })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { segments, loading, refetch: fetchAll };
}

/** Notes with follow-up date <= today and not done. */
export function useOverdueFollowups() {
  const [items, setItems] = useState<CrmNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: notes } = await supabase
      .from("customer_notes")
      .select("*")
      .eq("followup_done", false)
      .lte("followup_date", today)
      .order("followup_date", { ascending: true })
      .limit(8);

    const customerIds = [...new Set((notes ?? []).map((n) => n.customer_id))];
    if (customerIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data: cps } = await supabase
      .from("customer_profiles")
      .select("id, user_id")
      .in("id", customerIds);
    const userIds = (cps ?? []).map((c) => c.user_id);
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);
    const userToName = new Map((profs ?? []).map((p: any) => [p.user_id, p.full_name]));
    const custToName = new Map(
      (cps ?? []).map((c: any) => [c.id, userToName.get(c.user_id) ?? "—"]),
    );

    setItems(
      (notes ?? []).map((n: any) => ({
        ...n,
        customer_name: custToName.get(n.customer_id) ?? "—",
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { items, loading, refetch: fetchAll };
}

// ===== Customer detail =====

export function useCustomerProfile(customerId: string | undefined) {
  const [customer, setCustomer] = useState<CrmCustomer | null>(null);
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [bikes, setBikes] = useState<CrmBike[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!customerId) return;
    setLoading(true);

    const { data: cp } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();
    if (!cp) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    const [
      { data: prof },
      { data: notesData },
      { data: interData },
      { data: bikesData },
      { data: subs },
      { data: paysData },
      { data: apptsData },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .eq("user_id", cp.user_id)
        .maybeSingle(),
      supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_interactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_bikes")
        .select("*")
        .eq("customer_id", customerId)
        .order("purchased_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("plan_version_id")
        .eq("user_id", cp.user_id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("payments")
        .select("*")
        .eq("user_id", cp.user_id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("id, scheduled_date, scheduled_start_time, status, notes")
        .eq("user_id", cp.user_id)
        .order("scheduled_date", { ascending: false }),
    ]);

    let planName: string | null = null;
    let planTier: number | null = null;
    if (subs?.plan_version_id) {
      const { data: pv } = await supabase
        .from("plan_versions")
        .select("plan_id")
        .eq("id", subs.plan_version_id)
        .maybeSingle();
      if (pv?.plan_id) {
        const { data: p } = await supabase
          .from("plans")
          .select("name, tier_level")
          .eq("id", pv.plan_id)
          .maybeSingle();
        planName = p?.name ?? null;
        planTier = p?.tier_level ?? null;
      }
    }

    setCustomer({
      ...(cp as any),
      full_name: prof?.full_name ?? "—",
      email: prof?.email ?? null,
      phone: prof?.phone ?? null,
      plan_name: planName,
      plan_tier: planTier,
    });
    setNotes((notesData ?? []) as any);
    setInteractions((interData ?? []) as any);
    setBikes((bikesData ?? []) as any);
    setPayments(paysData ?? []);
    setAppointments(apptsData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    if (!customerId) return;
    const ch = supabase
      .channel(`cust-${customerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_notes", filter: `customer_id=eq.${customerId}` },
        fetchAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_interactions", filter: `customer_id=eq.${customerId}` },
        fetchAll,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return {
    customer,
    notes,
    interactions,
    bikes,
    payments,
    appointments,
    loading,
    refetch: fetchAll,
  };
}

// ===== Mutations =====

export async function logContact(args: {
  customerId: string;
  type: "call" | "whatsapp" | "email" | "in_person" | "other";
  direction: "inbound" | "outbound";
  durationMin?: number;
  subject?: string;
  summary?: string;
  outcome?: string;
}) {
  const { error } = await supabase.rpc("fn_register_contact", {
    p_customer_id: args.customerId,
    p_type: args.type,
    p_direction: args.direction,
    p_duration_min: args.durationMin ?? null,
    p_subject: args.subject ?? null,
    p_summary: args.summary ?? null,
    p_outcome: args.outcome ?? null,
  });
  if (error) throw error;
}

export async function logNote(args: {
  customerId: string;
  content: string;
  noteType?: "general" | "complaint" | "compliment" | "followup" | "opportunity";
  isPinned?: boolean;
  followupDate?: string;
}) {
  const { error } = await supabase.rpc("fn_log_customer_note", {
    p_customer_id: args.customerId,
    p_content: args.content,
    p_note_type: args.noteType ?? "general",
    p_is_pinned: args.isPinned ?? false,
    p_followup_date: args.followupDate ?? null,
    p_linked_appointment_id: null,
    p_linked_order_id: null,
  });
  if (error) throw error;
}

export async function markFollowupDone(noteId: string) {
  const { error } = await supabase
    .from("customer_notes")
    .update({ followup_done: true })
    .eq("id", noteId);
  if (error) throw error;
}

export async function updateCustomerTags(customerId: string, tags: string[]) {
  const { error } = await supabase
    .from("customer_profiles")
    .update({ tags })
    .eq("id", customerId);
  if (error) throw error;
}
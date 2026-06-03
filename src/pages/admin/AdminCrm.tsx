import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users, Activity, TrendingDown, CreditCard, AlertTriangle, Bell,
  Plus, Wallet, UserCheck, Percent, Pencil, Trash2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Line, ResponsiveContainer, Tooltip as RTooltip,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useCrmCustomers, useCrmKpis, useCrmSegments, useOverdueFollowups,
  useCustomerRegistrationGrowth, deleteSegment, type CrmSegment,
} from "@/hooks/crm/useCrmData";
import CustomersTable from "@/components/dashboard/crm/CustomersTable";
import { CRM_COLORS, initials, relativeTime } from "@/components/dashboard/crm/colors";
import CreateCustomerDialog from "@/components/dashboard/crm/CreateCustomerDialog";
import SegmentDialog from "@/components/dashboard/crm/SegmentDialog";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function AdminCrm() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { rows, loading, refetch } = useCrmCustomers({ onlyActualCustomers: true });
  const kpis = useCrmKpis(rows);
  const { data: growth } = useCustomerRegistrationGrowth();
  const { segments, refetch: refetchSegments } = useCrmSegments();
  const { items: followups } = useOverdueFollowups();
  const [createOpen, setCreateOpen] = useState(false);
  const [segmentDialog, setSegmentDialog] = useState<{ open: boolean; seg: CrmSegment | null }>({ open: false, seg: null });
  const canEdit = can("crm.edit");

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("crm.view")) return <Navigate to="/dashboard" replace />;

  const growthConfig: ChartConfig = {
    count: { label: t("crm.growth.new"), color: "hsl(var(--primary))" },
    cumulative: { label: t("crm.growth.cumulative"), color: "hsl(var(--muted-foreground))" },
  };

  const riskCustomers = [...rows]
    .filter((r) => r.churn_risk_score >= 70)
    .sort((a, b) => b.churn_risk_score - a.churn_risk_score)
    .slice(0, 5);

  // Aggregate by plan for membership tab — only customers with a plan
  const planAgg = Object.values(
    rows.filter((r) => !!r.plan_name).reduce((acc: any, r) => {
      const k = r.plan_name as string;
      if (!acc[k]) acc[k] = { plan: k, active: 0, at_risk: 0, churned: 0, healthSum: 0, ltvSum: 0, n: 0 };
      if (r.lifecycle_stage === "active_subscriber" || r.lifecycle_stage === "loyal") acc[k].active += 1;
      if (r.lifecycle_stage === "at_risk") acc[k].at_risk += 1;
      if (r.lifecycle_stage === "churned") acc[k].churned += 1;
      acc[k].healthSum += r.health_score;
      acc[k].ltvSum += Number(r.ltv_estimated);
      acc[k].n += 1;
      return acc;
    }, {}),
  ).map((p: any) => ({
    ...p,
    avgHealth: p.n > 0 ? Math.round(p.healthSum / p.n) : 0,
    avgLtv: p.n > 0 ? Math.round(p.ltvSum / p.n) : 0,
  }));

  // Lifecycle distribution for pie
  const lifecycleAgg = ["new", "active_subscriber", "loyal", "at_risk", "churned"].map((stage) => ({
    stage,
    label: t(`crm.membership.stage.${stage}`),
    count: rows.filter((r) => r.lifecycle_stage === stage).length,
    color:
      stage === "active_subscriber" ? CRM_COLORS.active
      : stage === "loyal" ? CRM_COLORS.loyal
      : stage === "at_risk" ? CRM_COLORS.atRisk
      : stage === "churned" ? CRM_COLORS.churned
      : "#60a5fa",
  })).filter((s) => s.count > 0);

  // Membership KPIs (estimated MRR = sum of LTV / 12 as proxy; replace with real price when subs price is loaded)
  const subscribed = rows.filter((r) => !!r.plan_name);
  const activeMembers = subscribed.filter((r) => r.lifecycle_stage === "active_subscriber" || r.lifecycle_stage === "loyal").length;
  const mrr = Math.round(planAgg.reduce((s: number, p: any) => s + (p.avgLtv * p.n) / 12, 0));
  const arpu = subscribed.length > 0 ? Math.round(subscribed.reduce((s, r) => s + Number(r.ltv_estimated), 0) / subscribed.length) : 0;
  const retentionPct = subscribed.length > 0 ? Math.round((activeMembers / subscribed.length) * 100) : 0;

  const handleDeleteSegment = async (s: CrmSegment) => {
    if (!confirm(t("crm.segments.modal.confirm_delete", { name: s.name }))) return;
    try {
      await deleteSegment(s.id);
      toast.success(t("crm.segments.modal.deleted"));
      refetchSegments();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">{t("crm.title")}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t("crm.subtitle_count", { count: kpis.total })}
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="bg-wj-green hover:bg-wj-green/90 text-white gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> {t("crm.actions.new_customer")}
            </Button>
          )}
        </motion.div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-background/60 backdrop-blur-md border border-border/30">
            <TabsTrigger value="overview">{t("crm.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="customers">{t("crm.tabs.customers")}</TabsTrigger>
            <TabsTrigger value="segments">{t("crm.tabs.segments")}</TabsTrigger>
            <TabsTrigger value="membership">{t("crm.tabs.membership")}</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* KPIs (esquerda) + Crescimento de registos (direita) */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3">
                <MiniKpi icon={Users} label={t("crm.kpi.customers")} value={String(kpis.total)} hint={t("crm.kpi.new_this_period", { n: rows.filter((r) => r.lifecycle_stage === "new").length })} />
                <MiniKpi icon={Activity} label={t("crm.kpi.avg_health")} value={`${kpis.avgHealth}%`} hint={t("crm.kpi.health_hint")} tone={kpis.avgHealth >= 60 ? "good" : "warn"} />
                <MiniKpi icon={TrendingDown} label={t("crm.kpi.churn_rate")} value={`${kpis.churnRate}%`} hint={t("crm.kpi.churn_hint")} tone={kpis.churnRate <= 5 ? "good" : "bad"} />
                <MiniKpi icon={CreditCard} label={t("crm.kpi.avg_ltv")} value={`€${kpis.avgLtv}`} hint={t("crm.kpi.ltv_hint")} />
                <MiniKpi icon={AlertTriangle} label={t("crm.kpi.high_risk")} value={String(kpis.highRisk)} hint={t("crm.kpi.high_risk_hint")} tone="bad" />
                <MiniKpi icon={Bell} label={t("crm.kpi.followups")} value={String(followups.length)} hint={t("crm.kpi.followups_hint")} tone={followups.length === 0 ? "good" : "warn"} />
              </div>

              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h2 className="text-sm font-medium">{t("crm.growth.title")}</h2>
                    <p className="text-[11px] text-muted-foreground">{t("crm.growth.subtitle")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light leading-none">{growth.reduce((s, g) => s + g.count, 0)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{t("crm.growth.in_period")}</p>
                  </div>
                </div>
                <ChartContainer config={growthConfig} className="aspect-auto h-[220px] w-full mt-2">
                  <AreaChart data={growth} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={28} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#growthFill)" />
                    <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* Radar by plan */}
              <div className="col-span-12 lg:col-span-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-1">{t("crm.health_by_plan.title")}</h2>
                <p className="text-[11px] text-muted-foreground mb-4">{t("crm.health_by_plan.subtitle")}</p>
                {(() => {
                  const validPlans = (planAgg || []).filter((p: any) => p && p.plan);
                  if (validPlans.length === 0) {
                    return <p className="text-xs text-muted-foreground">—</p>;
                  }
                  return (
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={[
                        { dim: "Health", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, p.avgHealth ?? 0])) },
                        { dim: "LTV/10", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, Math.min(100, (p.avgLtv ?? 0) / 10)])) },
                        { dim: "Active", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, ((p.active ?? 0) / Math.max(1, p.n ?? 1)) * 100])) },
                        { dim: "Loyalty", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, 100 - ((p.churned ?? 0) / Math.max(1, p.n ?? 1)) * 100])) },
                        { dim: "Engagement", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, (p.avgHealth ?? 0) * 0.8])) },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                        {validPlans.map((p: any, i: number) => (
                          <Radar key={p.plan} name={p.plan} dataKey={p.plan} stroke={[CRM_COLORS.care, CRM_COLORS.performance, CRM_COLORS.prestige][i] ?? CRM_COLORS.accent} fill={[CRM_COLORS.care, CRM_COLORS.performance, CRM_COLORS.prestige][i] ?? CRM_COLORS.accent} fillOpacity={0.25} />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              {/* Risk list */}
              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-4">{t("crm.risk_list.title")}</h2>
                <div className="space-y-3">
                  {riskCustomers.length === 0 && <p className="text-xs text-muted-foreground">{t("crm.risk_list.empty")}</p>}
                  {riskCustomers.map((c) => (
                    <Link key={c.id} to={`/dashboard/admin/crm/${c.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-destructive/10 text-destructive text-[10px]">{initials(c.full_name)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                      </div>
                      {c.plan_name && <Badge variant="outline" className="text-[9px]">{c.plan_name}</Badge>}
                      <div className="flex items-center gap-2 w-24">
                        <Progress value={c.churn_risk_score} className="h-1.5" />
                        <span className="text-xs font-mono text-destructive w-6">{c.churn_risk_score}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-4">{t("crm.followups_panel.title")}</h2>
                <div className="space-y-3">
                  {followups.length === 0 && <p className="text-xs text-muted-foreground">{t("crm.followups_panel.empty")}</p>}
                  {followups.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Bell className="h-4 w-4 text-wj-green mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{n.customer_name}</p>
                          <span className="text-[10px] text-muted-foreground">{relativeTime(n.followup_date)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{n.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* === CUSTOMERS === */}
          <TabsContent value="customers" className="mt-6">
            <CustomersTable rows={rows} loading={loading} onMutate={refetch} />
          </TabsContent>

          {/* === SEGMENTS === */}
          <TabsContent value="segments" className="mt-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium">{t("crm.segments.title")}</h2>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSegmentDialog({ open: true, seg: null })}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> {t("crm.actions.new_segment")}
                    </Button>
                  )}
                </div>
                {segments.length === 0 && <p className="text-xs text-muted-foreground p-4">{t("crm.segments.empty")}</p>}
                <div className="space-y-2">
                  {segments.map((s) => (
                    <div key={s.id} className="group flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/30">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{t("crm.segments.members_short", { n: s.member_count ?? 0 })}</Badge>
                      <Badge variant="secondary" className="text-[9px]">{s.segment_type}</Badge>
                      {canEdit && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSegmentDialog({ open: true, seg: s })}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteSegment(s)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex items-center justify-center text-xs text-muted-foreground min-h-[300px]">
                {t("crm.segments.detail_placeholder")}
              </div>
            </div>
          </TabsContent>

          {/* === MEMBERSHIP === */}
          <TabsContent value="membership" className="space-y-6 mt-6">
            {/* Membership KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniKpi icon={UserCheck} label={t("crm.membership.kpi_active_members")} value={String(activeMembers)} hint={`${subscribed.length} total`} tone="good" />
              <MiniKpi icon={Wallet} label={t("crm.membership.kpi_mrr")} value={`€${mrr.toLocaleString()}`} hint={t("crm.kpi.mrr_hint")} />
              <MiniKpi icon={CreditCard} label={t("crm.membership.kpi_arpu")} value={`€${arpu}`} hint={t("crm.kpi.ltv_hint")} />
              <MiniKpi icon={Percent} label={t("crm.kpi.retention")} value={`${retentionPct}%`} hint={t("crm.kpi.retention_hint")} tone={retentionPct >= 80 ? "good" : retentionPct >= 60 ? "warn" : "bad"} />
            </div>

            {/* Distribution + Lifecycle */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium">{t("crm.membership.distribution_title")}</h2>
                <p className="text-[11px] text-muted-foreground mb-3">{t("crm.membership.distribution_subtitle")}</p>
                {planAgg.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">—</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={planAgg}
                        dataKey="n"
                        nameKey="plan"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {planAgg.map((_: any, i: number) => (
                          <Cell key={i} fill={[CRM_COLORS.care, CRM_COLORS.performance, CRM_COLORS.prestige, CRM_COLORS.accent][i % 4]} />
                        ))}
                      </Pie>
                      <RTooltip cursor={{ fill: "hsl(var(--muted) / 0.2)" }} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {planAgg.map((p: any, i: number) => (
                    <div key={p.plan} className="flex items-center gap-2 text-[11px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: [CRM_COLORS.care, CRM_COLORS.performance, CRM_COLORS.prestige, CRM_COLORS.accent][i % 4] }} />
                      <span className="flex-1 truncate text-muted-foreground">{p.plan}</span>
                      <span className="font-mono">{p.n}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium">{t("crm.membership.lifecycle_title")}</h2>
                <p className="text-[11px] text-muted-foreground mb-3">{t("crm.membership.lifecycle_subtitle")}</p>
                {lifecycleAgg.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">—</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <RadialBarChart innerRadius="25%" outerRadius="100%" data={lifecycleAgg} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="count" cornerRadius={6} background={{ fill: "hsl(var(--muted))", opacity: 0.15 }}>
                        {lifecycleAgg.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </RadialBar>
                      <RTooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {lifecycleAgg.map((s) => (
                    <div key={s.stage} className="flex items-center gap-1.5 text-[11px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-mono">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Health composition + LTV */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium">{t("crm.membership.health_title")}</h2>
                <p className="text-[11px] text-muted-foreground mb-3">{t("crm.membership.health_subtitle")}</p>
                {planAgg.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">—</p>
                ) : (
                  <ChartContainer
                    config={{
                      active: { label: t("crm.membership.stage.active_subscriber"), color: CRM_COLORS.active },
                      at_risk: { label: t("crm.membership.stage.at_risk"), color: CRM_COLORS.atRisk },
                      churned: { label: t("crm.membership.stage.churned"), color: CRM_COLORS.churned },
                      avgHealth: { label: t("crm.kpi.avg_health"), color: CRM_COLORS.accent },
                    }}
                    className="aspect-auto h-[260px] w-full"
                  >
                    <BarChart data={planAgg} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="plan" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={28} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="active" stackId="a" fill={CRM_COLORS.active} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="at_risk" stackId="a" fill={CRM_COLORS.atRisk} />
                      <Bar dataKey="churned" stackId="a" fill={CRM_COLORS.churned} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              <div className="col-span-12 lg:col-span-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium">{t("crm.membership.ltv_title")}</h2>
                <p className="text-[11px] text-muted-foreground mb-3">€ / {t("crm.kpi.customers").toLowerCase()}</p>
                {planAgg.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">—</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={planAgg} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="plan" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
                      <RTooltip cursor={{ fill: "hsl(var(--muted) / 0.2)" }} contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="avgLtv" fill={CRM_COLORS.accent} radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateCustomerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />
      <SegmentDialog
        open={segmentDialog.open}
        onClose={() => setSegmentDialog({ open: false, seg: null })}
        segment={segmentDialog.seg}
        onSaved={refetchSegments}
      />
    </AdminDashboardLayout>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-wj-green" : tone === "bad" ? "text-destructive" : tone === "warn" ? "text-orange-400" : "text-muted-foreground";
  return (
    <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {hint && <span className={`text-[10px] ${toneClass}`}>{hint}</span>}
      </div>
      <div>
        <p className="text-2xl font-light text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
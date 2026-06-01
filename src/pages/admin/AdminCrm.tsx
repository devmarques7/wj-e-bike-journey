import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Activity, TrendingDown, CreditCard, AlertTriangle, Bell, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
  ComposedChart, Bar, Line, BarChart,
} from "recharts";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useCrmCustomers, useCrmKpis, useCrmEvolution, useCrmSegments, useOverdueFollowups,
} from "@/hooks/crm/useCrmData";
import CustomersTable from "@/components/dashboard/crm/CustomersTable";
import { CRM_COLORS, LIFECYCLE_META, initials, relativeTime } from "@/components/dashboard/crm/colors";
import { Link } from "react-router-dom";

export default function AdminCrm() {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { rows, loading } = useCrmCustomers();
  const kpis = useCrmKpis(rows);
  const { data: evolution } = useCrmEvolution();
  const { segments } = useCrmSegments();
  const { items: followups, refetch: refetchFollow } = useOverdueFollowups();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("crm.view")) return <Navigate to="/dashboard" replace />;

  const riskCustomers = [...rows]
    .filter((r) => r.churn_risk_score >= 70)
    .sort((a, b) => b.churn_risk_score - a.churn_risk_score)
    .slice(0, 5);

  // Aggregate by plan for membership tab
  const planAgg = Object.values(
    rows.reduce((acc: any, r) => {
      const k = r.plan_name ?? "Sem plano";
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

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-light text-foreground">CRM & Membership</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise integrada de clientes e assinaturas</p>
        </motion.div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-background/60 backdrop-blur-md">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="segments">Segmentos</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <AdminKPICard label="Clientes" value={String(kpis.total)} change={`${rows.filter(r => r.lifecycle_stage === "new").length} novos`} trend="up" icon={Users} index={0} />
              <AdminKPICard label="Health Médio" value={`${kpis.avgHealth}%`} change="—" trend="up" icon={Activity} index={1} />
              <AdminKPICard label="Churn Rate" value={`${kpis.churnRate}%`} change="—" trend="down" icon={TrendingDown} index={2} />
              <AdminKPICard label="LTV Médio" value={`€${kpis.avgLtv}`} change="—" trend="up" icon={CreditCard} index={3} />
              <AdminKPICard label="Alto Risco" value={String(kpis.highRisk)} change="ver lista" trend="down" icon={AlertTriangle} index={4} />
              <AdminKPICard label="Follow-ups" value={String(followups.length)} change="em atraso" trend="down" icon={Bell} index={5} />
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* Evolution chart */}
              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-4">Evolução de Clientes</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Area type="monotone" dataKey="active_subscriber" stackId="1" stroke={CRM_COLORS.active} fill={CRM_COLORS.active} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="loyal" stackId="1" stroke={CRM_COLORS.loyal} fill={CRM_COLORS.loyal} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="at_risk" stackId="1" stroke={CRM_COLORS.atRisk} fill={CRM_COLORS.atRisk} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="churned" stackId="1" stroke={CRM_COLORS.churned} fill={CRM_COLORS.churned} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Radar by plan */}
              <div className="col-span-12 lg:col-span-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-4">Saúde por Plano</h2>
                {(() => {
                  const validPlans = (planAgg || []).filter((p: any) => p && p.plan);
                  if (validPlans.length === 0) {
                    return <p className="text-xs text-muted-foreground">Sem dados de planos.</p>;
                  }
                  return (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={[
                        { dim: "Health", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, p.avgHealth ?? 0])) },
                        { dim: "LTV/10", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, Math.min(100, (p.avgLtv ?? 0) / 10)])) },
                        { dim: "Activos", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, ((p.active ?? 0) / Math.max(1, p.n ?? 1)) * 100])) },
                        { dim: "Fidelidade", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, 100 - ((p.churned ?? 0) / Math.max(1, p.n ?? 1)) * 100])) },
                        { dim: "Engagement", ...Object.fromEntries(validPlans.map((p: any) => [p.plan, (p.avgHealth ?? 0) * 0.8])) },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                        {validPlans.map((p: any, i: number) => (
                          <Radar key={p.plan} name={p.plan} dataKey={p.plan} stroke={[CRM_COLORS.care, CRM_COLORS.performance, CRM_COLORS.prestige][i] ?? CRM_COLORS.accent} fill={[CRM_COLORS.care, CRM_COLORS.performance, CRM_COLORS.prestige][i] ?? CRM_COLORS.accent} fillOpacity={0.25} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* Risk list */}
              <div className="col-span-12 lg:col-span-6 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-4">Alto Risco de Churn</h2>
                <div className="space-y-3">
                  {riskCustomers.length === 0 && <p className="text-xs text-muted-foreground">Sem clientes em risco.</p>}
                  {riskCustomers.map((c) => (
                    <Link key={c.id} to={`/dashboard/admin/crm/${c.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-red-500/10 text-red-400 text-[10px]">{initials(c.full_name)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                      </div>
                      {c.plan_name && <Badge variant="outline" className="text-[9px]">{c.plan_name}</Badge>}
                      <div className="flex items-center gap-2 w-24">
                        <Progress value={c.churn_risk_score} className="h-1.5" />
                        <span className="text-xs font-mono text-red-400 w-6">{c.churn_risk_score}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Follow-ups */}
              <div className="col-span-12 lg:col-span-6 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <h2 className="text-sm font-medium mb-4">Follow-ups em Atraso</h2>
                <div className="space-y-3">
                  {followups.length === 0 && <p className="text-xs text-muted-foreground">Tudo em dia ✓</p>}
                  {followups.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <Bell className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
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
            <CustomersTable rows={rows} loading={loading} />
          </TabsContent>

          {/* === SEGMENTS === */}
          <TabsContent value="segments" className="mt-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-5 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium">Segmentos</h2>
                  <Button size="sm" variant="outline" disabled>+ Novo</Button>
                </div>
                {segments.length === 0 && <p className="text-xs text-muted-foreground p-4">Sem segmentos. Cria o primeiro para começar a agrupar clientes.</p>}
                <div className="space-y-2">
                  {segments.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/30 cursor-pointer">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{s.member_count} cli.</Badge>
                      <Badge variant="secondary" className="text-[9px]">{s.segment_type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-7 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex items-center justify-center text-xs text-muted-foreground min-h-[300px]">
                Selecciona um segmento para ver detalhes.
              </div>
            </div>
          </TabsContent>

          {/* === MEMBERSHIP === */}
          <TabsContent value="membership" className="space-y-6 mt-6">
            <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
              <h2 className="text-sm font-medium mb-4">Saúde da Base de Membership</h2>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={planAgg}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="active" fill={CRM_COLORS.active} name="Activos" />
                  <Bar yAxisId="left" dataKey="at_risk" fill={CRM_COLORS.atRisk} name="Em risco" />
                  <Bar yAxisId="left" dataKey="churned" fill={CRM_COLORS.churned} name="Churn" />
                  <Line yAxisId="right" type="monotone" dataKey="avgHealth" stroke={CRM_COLORS.accent} strokeWidth={2} name="Health médio" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
              <h2 className="text-sm font-medium mb-4">LTV Médio por Plano</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={planAgg} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="plan" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Bar dataKey="avgLtv" fill={CRM_COLORS.accent} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}
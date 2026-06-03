import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, TrendingUp, Users, Euro, CheckCircle2, XCircle, Clock, Award, Settings2 } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, Bar, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { usePlansKPIs, useSubscriptions } from "@/hooks/plans/usePlansData";
import { supabase } from "@/integrations/supabase/client";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>;
    case "trialing":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "past_due":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />Overdue</Badge>;
    case "canceled":
      return <Badge className="bg-zinc-700 text-zinc-300">Canceled</Badge>;
    case "paused":
      return <Badge className="bg-zinc-700 text-zinc-300">Paused</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPlanBadge = (name: string) => {
  if (name === "Black") return <Badge className="bg-zinc-800 text-white border-zinc-600">Black</Badge>;
  if (name === "Plus") return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30">Plus</Badge>;
  if (name === "Light") return <Badge variant="outline">Light</Badge>;
  return <Badge variant="outline">{name}</Badge>;
};

export default function AdminPlans() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { kpis, loading } = usePlansKPIs();
  const { rows: subs } = useSubscriptions();

  const [monthly, setMonthly] = useState<Array<Record<string, any>>>([]);
  const [planNames, setPlanNames] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      const { data } = await supabase
        .from("payments")
        .select("amount, paid_at, status, subscription:subscriptions!inner(plan_version:plan_versions!inner(plan:plans!inner(name)))")
        .gte("paid_at", since.toISOString())
        .eq("status", "succeeded");

      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString("en", { month: "short", year: "2-digit" }));
      }

      const planSet = new Set<string>();
      const map = new Map<string, Record<string, any>>();
      months.forEach((m) => map.set(m, { month: m, total_subs: 0 }));

      (data ?? []).forEach((p: any) => {
        const d = new Date(p.paid_at);
        const key = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const planName = p.subscription?.plan_version?.plan?.name ?? "Other";
        planSet.add(planName);
        const row = map.get(key);
        if (!row) return;
        row[planName] = (row[planName] ?? 0) + Number(p.amount ?? 0);
        row.total_subs = (row.total_subs ?? 0) + 1;
      });

      setPlanNames(Array.from(planSet));
      setMonthly(months.map((m) => map.get(m)!));
    })();
  }, []);

  const planColors: Record<string, string> = {
    Black: "hsl(0 0% 20%)",
    Plus: "hsl(var(--wj-green))",
    Light: "hsl(var(--muted-foreground))",
  };
  const fallbackColors = ["hsl(var(--wj-green))", "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];
  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {
      total_subs: { label: "Subscribers", color: "hsl(var(--foreground))" },
    };
    planNames.forEach((name, i) => {
      cfg[name] = { label: name, color: planColors[name] ?? fallbackColors[i % fallbackColors.length] };
    });
    return cfg;
  }, [planNames]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const totalSubs = kpis.perPlan.reduce((s, p) => s + p.active_subs, 0) || 1;

  const kpiCards = [
    { label: "Monthly Revenue", value: `€${kpis.mrr.toFixed(2)}`, change: loading ? "..." : "live", trend: "up" as const, icon: Euro },
    { label: "Active Subscribers", value: String(kpis.activeSubs), change: loading ? "..." : "live", trend: "up" as const, icon: Users },
    { label: "Churn Rate (30d)", value: `${kpis.churnRate.toFixed(1)}%`, change: loading ? "..." : "live", trend: kpis.churnRate > 5 ? "down" as const : "up" as const, icon: TrendingUp },
    { label: "Avg. Revenue/User", value: `€${kpis.arpu.toFixed(2)}`, change: loading ? "..." : "live", trend: "up" as const, icon: CreditCard },
  ];

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">Subscription Plans</h1>
            <p className="text-sm text-muted-foreground mt-1">Revenue analytics and subscriber management</p>
          </div>
          <Button onClick={() => navigate("/dashboard/admin/plans/manage")} className="bg-wj-green hover:bg-wj-green/90 gap-2">
            <Settings2 className="h-4 w-4" /> Manage Plans
          </Button>
        </motion.div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {kpiCards.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[340px]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Monthly Revenue per Plan</h3>
                  <p className="text-[11px] text-muted-foreground">Stacked revenue (€) + total active subscribers</p>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[270px] w-full aspect-auto">
                <ComposedChart data={monthly} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    {planNames.map((name) => (
                      <linearGradient key={name} id={`fill-${name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartConfig[name]?.color as string} stopOpacity={0.75} />
                        <stop offset="100%" stopColor={chartConfig[name]?.color as string} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => `€${v}`} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {planNames.map((name) => (
                    <Area
                      key={name}
                      yAxisId="left"
                      type="monotone"
                      dataKey={name}
                      stackId="rev"
                      stroke={chartConfig[name]?.color as string}
                      fill={`url(#fill-${name})`}
                      strokeWidth={2}
                    />
                  ))}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_subs"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </motion.div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[300px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Plan Adoption</h3>
              </div>
              <div className="space-y-4">
                {kpis.perPlan.map((p, index) => {
                  const pct = totalSubs > 0 ? (p.active_subs / totalSubs) * 100 : 0;
                  return (
                    <Link to={`/dashboard/admin/plans/${p.plan_id}`} key={p.plan_id} className="block space-y-1.5 hover:opacity-80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.active_subs} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-wj-green to-wj-green/60 rounded-full" />
                      </div>
                    </Link>
                  );
                })}
                {kpis.perPlan.length === 0 && (
                  <p className="text-xs text-muted-foreground">No plans yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="text-sm font-medium text-foreground">All Subscribers</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Email</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Plan</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Payment</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Period End</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      No subscribers yet. Create subscriptions to see them here.
                    </TableCell>
                  </TableRow>
                )}
                {subs.map((sub: any) => (
                  <TableRow key={sub.id} className="border-border/30 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/dashboard/admin/plans/subscriber/${sub.id}`)}>
                    <TableCell className="text-xs font-medium">{sub.profile?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sub.profile?.email ?? "—"}</TableCell>
                    <TableCell>{getPlanBadge(sub.plan_version?.plan?.name ?? "—")}</TableCell>
                    <TableCell className="text-xs">{sub.payment_method ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
}

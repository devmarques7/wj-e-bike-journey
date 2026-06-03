import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, TrendingUp, Users, Euro, CheckCircle2, XCircle, Clock, Award, Settings2, Layers } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const [series, setSeries] = useState<Array<Record<string, any>>>([]);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [planRows, setPlanRows] = useState<Array<{ name: string; price: number; interval: string; members: number; mrr: number }>>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("90d");

  useEffect(() => {
    (async () => {
      // Pull subscriptions + plan info; we compute the daily active member
      // count per plan from started_at/canceled_at over the last 90 days.
      const { data: subRows } = await supabase
        .from("subscriptions")
        .select("started_at, canceled_at, status, plan_version:plan_versions!inner(price, interval, plan:plans!inner(name, display_order))");

      // Also fetch full plan catalog so plans with zero members still appear in the table.
      const { data: allPlans } = await supabase
        .from("plans")
        .select("name, display_order, is_active, plan_versions!inner(price, interval, status)")
        .eq("plan_versions.status", "active")
        .eq("is_active", true)
        .order("display_order");

      // Build last 90 days timeline (daily buckets)
      const days: { key: string; date: Date }[] = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        days.push({ key: d.toISOString().slice(0, 10), date: d });
      }

      const planSet = new Set<string>();
      const planOrder = new Map<string, number>();
      const rowMap = new Map<string, Record<string, any>>();
      days.forEach((d) => rowMap.set(d.key, { date: d.key }));

      // Seed plan order from catalog so series order is stable.
      (allPlans ?? []).forEach((p: any) => {
        planSet.add(p.name);
        planOrder.set(p.name, p.display_order ?? 999);
      });

      // Member count per plan
      const memberCount = new Map<string, number>();

      (subRows ?? []).forEach((s: any) => {
        const planName: string = s.plan_version?.plan?.name ?? "Other";
        const order: number = s.plan_version?.plan?.display_order ?? 999;
        planSet.add(planName);
        planOrder.set(planName, order);

        const started = new Date(s.started_at);
        // Monthly subs honor a 1-month minimum — extend canceled_at by 1 month from start.
        const rawEnd = s.canceled_at ? new Date(s.canceled_at) : null;
        const minEnd = new Date(started);
        minEnd.setMonth(minEnd.getMonth() + 1);
        const effectiveEnd = rawEnd ? (rawEnd < minEnd ? minEnd : rawEnd) : null;

        if (s.status === "active" || s.status === "trialing" || s.status === "past_due") {
          memberCount.set(planName, (memberCount.get(planName) ?? 0) + 1);
        }

        days.forEach((d) => {
          const active = started <= d.date && (!effectiveEnd || effectiveEnd > d.date);
          if (!active) return;
          const row = rowMap.get(d.key)!;
          row[planName] = (row[planName] ?? 0) + 1;
        });
      });

      const ordered = Array.from(planSet).sort(
        (a, b) => (planOrder.get(a) ?? 999) - (planOrder.get(b) ?? 999),
      );
      setPlanNames(ordered);
      setSeries(days.map((d) => rowMap.get(d.key)!));

      // Plan rows for the table
      setPlanRows(
        (allPlans ?? []).map((p: any) => {
          const v = Array.isArray(p.plan_versions) ? p.plan_versions[0] : p.plan_versions;
          const price = Number(v?.price ?? 0);
          const interval: string = v?.interval ?? "monthly";
          const monthly =
            interval === "yearly" ? price / 12 :
            interval === "quarterly" ? price / 3 :
            interval === "lifetime" ? 0 : price;
          const members = memberCount.get(p.name) ?? 0;
          return { name: p.name, price, interval, members, mrr: monthly * members };
        }),
      );
    })();
  }, []);

  const filteredSeries = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return series.slice(-days);
  }, [series, timeRange]);

  // System token palette only — wj-green primary accent + neutral foreground tones
  const planColors: Record<string, string> = {
    Light: "hsl(var(--muted-foreground))",
    Plus: "hsl(var(--wj-green))",
    Black: "hsl(var(--foreground))",
  };
  const fallbackColors = [
    "hsl(var(--wj-green))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--foreground))",
    "hsl(var(--primary))",
  ];
  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {
      members: { label: "Members" },
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
                    stroke="hsl(var(--wj-green))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--wj-green))" }}
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

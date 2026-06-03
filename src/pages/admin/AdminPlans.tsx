import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, TrendingUp, Users, Euro, CheckCircle2, XCircle, Clock, Award, Settings2, Layers } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, LabelList, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlansKPIs, useSubscriptions } from "@/hooks/plans/usePlansData";
import { supabase } from "@/integrations/supabase/client";

const getStatusBadge = (status: string, t: (k: string) => string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 gap-1"><CheckCircle2 className="h-3 w-3" />{t("plans.status.active")}</Badge>;
    case "trialing":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="h-3 w-3" />{t("plans.status.trialing")}</Badge>;
    case "past_due":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />{t("plans.status.past_due")}</Badge>;
    case "canceled":
      return <Badge className="bg-zinc-700 text-zinc-300">{t("plans.status.canceled")}</Badge>;
    case "paused":
      return <Badge className="bg-zinc-700 text-zinc-300">{t("plans.status.paused")}</Badge>;
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
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-US";
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { kpis, loading } = usePlansKPIs();
  const { rows: subs } = useSubscriptions();

  const [planNames, setPlanNames] = useState<string[]>([]);
  const [planRows, setPlanRows] = useState<Array<{ name: string; price: number; interval: string; members: number; mrr: number }>>([]);
  const [forecastRange, setForecastRange] = useState<"3m" | "6m" | "12m" | "24m">("12m");
  // Assumed compound monthly growth rate applied to the current MRR baseline.
  // 3%/month is a conservative SaaS-style projection — visible curve without
  // overpromising. Surfaced in the subtitle so the user knows it's a forecast.
  const MONTHLY_GROWTH = 0.03;

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

      const planSet = new Set<string>();
      const planOrder = new Map<string, number>();
      const planPrice = new Map<string, number>(); // normalized monthly price

      // Seed plan order from catalog so series order is stable.
      (allPlans ?? []).forEach((p: any) => {
        planSet.add(p.name);
        planOrder.set(p.name, p.display_order ?? 999);
        const v = Array.isArray(p.plan_versions) ? p.plan_versions[0] : p.plan_versions;
        const price = Number(v?.price ?? 0);
        const interval: string = v?.interval ?? "monthly";
        const monthly =
          interval === "yearly" ? price / 12 :
          interval === "quarterly" ? price / 3 :
          interval === "lifetime" ? 0 : price;
        planPrice.set(p.name, monthly);
      });

      // Member count per plan
      const memberCount = new Map<string, number>();

      (subRows ?? []).forEach((s: any) => {
        const planName: string = s.plan_version?.plan?.name ?? "Other";
        const order: number = s.plan_version?.plan?.display_order ?? 999;
        planSet.add(planName);
        planOrder.set(planName, order);
        if (!planPrice.has(planName)) {
          const price = Number(s.plan_version?.price ?? 0);
          const interval: string = s.plan_version?.interval ?? "monthly";
          const monthly =
            interval === "yearly" ? price / 12 :
            interval === "quarterly" ? price / 3 :
            interval === "lifetime" ? 0 : price;
          planPrice.set(planName, monthly);
        }

        if (s.status === "active" || s.status === "trialing" || s.status === "past_due") {
          memberCount.set(planName, (memberCount.get(planName) ?? 0) + 1);
        }
      });

      // Order plans; exclude zero-price plans (e.g. Free) from the revenue chart
      // since they contribute €0 and would just sit on the axis.
      const ordered = Array.from(planSet)
        .filter((n) => (planPrice.get(n) ?? 0) > 0)
        .sort((a, b) => (planOrder.get(a) ?? 999) - (planOrder.get(b) ?? 999));
      setPlanNames(ordered);

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

  // Forecast cumulative cash accrued per plan over the chosen horizon.
  // Each month we add (active members for that plan) × (monthly price), with
  // the member base compounded by MONTHLY_GROWTH to project new registrations.
  // The series is monotonically increasing — it represents accumulated revenue
  // in the bank, not the recurring MRR snapshot.
  const filteredSeries = useMemo(() => {
    const months = forecastRange === "3m" ? 3 : forecastRange === "6m" ? 6 : forecastRange === "12m" ? 12 : 24;
    const baselineMrr = new Map<string, number>();
    planNames.forEach((n) => baselineMrr.set(n, planRows.find((p) => p.name === n)?.mrr ?? 0));
    const accrued = new Map<string, number>();
    planNames.forEach((n) => accrued.set(n, 0));
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const out: Array<Record<string, any>> = [];
    for (let i = 0; i <= months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const row: Record<string, any> = { date: d.toISOString().slice(0, 10) };
      const factor = Math.pow(1 + MONTHLY_GROWTH, i);
      planNames.forEach((n) => {
        // Month 0 = starting point (€0 accrued). From month 1 onward we add the
        // projected monthly cash-in for that plan to the running total.
        if (i > 0) {
          const monthly = (baselineMrr.get(n) ?? 0) * factor;
          accrued.set(n, (accrued.get(n) ?? 0) + monthly);
        }
        row[n] = accrued.get(n) ?? 0;
      });
      out.push(row);
    }
    return out;
  }, [planNames, planRows, forecastRange]);

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
  const hasOtherPlans = planRows.some((p) => p.members === 0);

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {
      members: { label: "Members" },
    };
    planNames.forEach((name, i) => {
      cfg[name] = { label: name, color: planColors[name] ?? fallbackColors[i % fallbackColors.length] };
    });
    if (hasOtherPlans) {
      cfg["Other"] = { label: "Other", color: "hsl(var(--border))" };
    }
    return cfg;
  }, [planNames, hasOtherPlans]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const totalSubs = kpis.perPlan.reduce((s, p) => s + p.active_subs, 0) || 1;

  const kpiCards = [
    { label: t("plans.kpi.monthly_revenue"), value: `€${kpis.mrr.toFixed(2)}`, change: loading ? t("plans.kpi.loading") : t("plans.kpi.live"), trend: "up" as const, icon: Euro },
    { label: t("plans.kpi.active_subscribers"), value: String(kpis.activeSubs), change: loading ? t("plans.kpi.loading") : t("plans.kpi.live"), trend: "up" as const, icon: Users },
    { label: t("plans.kpi.churn_rate"), value: `${kpis.churnRate.toFixed(1)}%`, change: loading ? t("plans.kpi.loading") : t("plans.kpi.live"), trend: kpis.churnRate > 5 ? "down" as const : "up" as const, icon: TrendingUp },
    { label: t("plans.kpi.arpu"), value: `€${kpis.arpu.toFixed(2)}`, change: loading ? t("plans.kpi.loading") : t("plans.kpi.live"), trend: "up" as const, icon: CreditCard },
  ];

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">{t("plans.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("plans.subtitle")}</p>
          </div>
          <Button onClick={() => navigate("/dashboard/admin/plans/manage")} className="bg-wj-green hover:bg-wj-green/90 gap-2">
            <Settings2 className="h-4 w-4" /> {t("plans.manage_btn")}
          </Button>
        </motion.div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {kpiCards.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6 items-stretch">
          <div className="col-span-12 lg:col-span-8 flex">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[460px] w-full flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{t("plans.forecast.title")}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {t("plans.forecast.subtitle", { horizon: t(`plans.forecast.horizon.${forecastRange}`) })}
                  </p>
                </div>
                <Select value={forecastRange} onValueChange={(v) => setForecastRange(v as any)}>
                  <SelectTrigger className="w-[170px] h-8 rounded-lg text-xs" aria-label={t("plans.forecast.aria")}>
                    <SelectValue placeholder={t("plans.forecast.placeholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="3m" className="rounded-lg text-xs">{t("plans.forecast.select.3m")}</SelectItem>
                    <SelectItem value="6m" className="rounded-lg text-xs">{t("plans.forecast.select.6m")}</SelectItem>
                    <SelectItem value="12m" className="rounded-lg text-xs">{t("plans.forecast.select.12m")}</SelectItem>
                    <SelectItem value="24m" className="rounded-lg text-xs">{t("plans.forecast.select.24m")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ChartContainer config={chartConfig} className="flex-1 min-h-0 w-full aspect-auto">
                <AreaChart data={filteredSeries} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    {planNames.map((name) => (
                      <linearGradient key={name} id={`fill-${name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig[name]?.color as string} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={chartConfig[name]?.color as string} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    minTickGap={32}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(locale, { month: "short", year: "2-digit" })
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    width={48}
                    tickFormatter={(v: number) => `€${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-muted-foreground">{name as string}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              €{Number(value).toFixed(2)}
                            </span>
                          </div>
                        )}
                        labelFormatter={(value) =>
                          new Date(value as string).toLocaleDateString(locale, { month: "long", year: "numeric" })
                        }
                      />
                    }
                  />
                  {planNames.map((name) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={chartConfig[name]?.color as string}
                      fill={`url(#fill-${name})`}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
              <div className="mt-2 flex shrink-0 items-center justify-center flex-wrap gap-1.5 max-w-full">
                {planNames.map((name) => {
                  const color = (chartConfig[name]?.color as string) ?? "hsl(var(--muted-foreground))";
                  const row = planRows.find((p) => p.name === name);
                  const members = row?.members ?? 0;
                  const mrr = row?.mrr ?? 0;
                  return (
                    <div
                      key={name}
                      className="group flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/40 bg-background/40 hover:bg-muted/40 hover:border-border transition-all duration-300 overflow-hidden cursor-default min-w-0"
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[10px] uppercase tracking-wider text-foreground/80 truncate">{name}</span>
                      <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
                        <span className="overflow-hidden whitespace-nowrap">
                          <span className="pl-1.5 text-[10px] text-muted-foreground">
                            {members} · €{mrr.toFixed(2)}
                          </span>
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[460px] w-full flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-wj-green" />
                  <h3 className="text-sm font-medium text-foreground">{t("plans.adoption.title")}</h3>
                </div>
                <span className="text-[11px] text-muted-foreground">{t("plans.adoption.active", { n: kpis.activeSubs })}</span>
              </div>
              {kpis.perPlan.length === 0 && !hasOtherPlans ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">{t("plans.adoption.no_plans")}</p>
                </div>
              ) : (
                <>
                  <ChartContainer
                    config={chartConfig}
                    className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] w-full"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                      <Pie
                        data={[
                          ...kpis.perPlan.map((p) => ({
                            name: p.name,
                            value: p.active_subs,
                            fill: (chartConfig[p.name]?.color as string) ?? "hsl(var(--muted-foreground))",
                          })),
                          ...(hasOtherPlans ? [{ name: "Other", value: 0.5, fill: "hsl(var(--border))" }] : []),
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        strokeWidth={5}
                        cornerRadius={8}
                        paddingAngle={4}
                      >
                        <LabelList
                          dataKey="value"
                          stroke="none"
                          fontSize={11}
                          fontWeight={600}
                          fill="currentColor"
                          formatter={(value: number) => (value > 0 ? value.toString() : "")}
                        />
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              const cx = viewBox.cx as number;
                              const cy = viewBox.cy as number;
                              return (
                                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan x={cx} y={cy - 6} className="fill-foreground text-2xl font-semibold">
                                    {kpis.activeSubs.toLocaleString()}
                                  </tspan>
                                  <tspan x={cx} y={cy + 14} className="fill-muted-foreground text-[10px]">
                                    {t("plans.adoption.subscribers")}
                                  </tspan>
                                </text>
                              );
                            }
                            return null;
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-3 flex items-center justify-center flex-wrap gap-1.5">
                    {kpis.perPlan.map((p) => {
                      const pct = totalSubs > 0 ? (p.active_subs / totalSubs) * 100 : 0;
                      const color = (chartConfig[p.name]?.color as string) ?? "hsl(var(--muted-foreground))";
                      return (
                        <Link
                          to={`/dashboard/admin/plans/${p.plan_id}`}
                          key={p.plan_id}
                          className="group flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/40 bg-background/40 hover:bg-muted/40 hover:border-border transition-all duration-300 overflow-hidden"
                        >
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-[10px] uppercase tracking-wider text-foreground/80">{p.name}</span>
                          <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
                            <span className="overflow-hidden whitespace-nowrap">
                              <span className="pl-1.5 text-[10px] text-muted-foreground">
                                {p.active_subs} · {pct.toFixed(0)}%
                              </span>
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                    {hasOtherPlans && (
                      <div className="group flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/40 bg-background/40 hover:bg-muted/40 hover:border-border transition-all duration-300 overflow-hidden cursor-default">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "hsl(var(--border))" }} />
                        <span className="text-[10px] uppercase tracking-wider text-foreground/80">{t("plans.adoption.other")}</span>
                        <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
                          <span className="overflow-hidden whitespace-nowrap">
                            <span className="pl-1.5 text-[10px] text-muted-foreground">
                              0 · 0%
                            </span>
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex items-center gap-2">
            <Layers className="h-4 w-4 text-wj-green" />
            <h3 className="text-sm font-medium text-foreground">{t("plans.available.title")}</h3>
            <span className="text-[11px] text-muted-foreground ml-1">{t("plans.available.subtitle")}</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">{t("plans.available.col.plan")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.available.col.price")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.available.col.interval")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.available.col.members")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.available.col.mrr")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                      {t("plans.available.empty")}
                    </TableCell>
                  </TableRow>
                )}
                {planRows.map((p) => (
                  <TableRow key={p.name} className="border-border/30 hover:bg-muted/30">
                    <TableCell>{getPlanBadge(p.name)}</TableCell>
                    <TableCell className="text-xs">€{p.price.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t(`plans.intervals.${p.interval}`, p.interval)}</TableCell>
                    <TableCell className="text-xs font-medium">{p.members}</TableCell>
                    <TableCell className="text-xs text-wj-green">€{p.mrr.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <h3 className="text-sm font-medium text-foreground">{t("plans.subscribers_table.title")}</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">{t("plans.subscribers_table.col.name")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.subscribers_table.col.email")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.subscribers_table.col.plan")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.subscribers_table.col.payment")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.subscribers_table.col.period_end")}</TableHead>
                  <TableHead className="text-muted-foreground text-xs">{t("plans.subscribers_table.col.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      {t("plans.subscribers_table.empty")}
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
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString(locale) : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status, t)}</TableCell>
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

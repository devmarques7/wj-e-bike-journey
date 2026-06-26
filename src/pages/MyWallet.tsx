import { motion } from "framer-motion";
import { ArrowLeft, Crown, Shield, Wrench, Clock, Gift, Sparkles, TrendingUp, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RoleDashboardLayout from "@/components/dashboard/RoleDashboardLayout";
import { supabase } from "@/integrations/supabase/client";

type PointEntry = {
  id: string;
  date: string;
  service: string;
  points: number;
  status: string;
};

type PlanInfo = {
  slug: string;
  name: string;
  tier_level: number;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  description: string | null;
};

const cardStyles: Record<string, { gradient: string }> = {
  free:  { gradient: "from-emerald-400 to-emerald-600" },
  light: { gradient: "from-zinc-400 to-zinc-600" },
  plus:  { gradient: "from-blue-400 to-blue-600" },
  black: { gradient: "from-amber-400 to-amber-600" },
};

const TIER_ORDER = ["free", "light", "plus", "black"];

export default function MyWallet() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [nextPlan, setNextPlan] = useState<PlanInfo | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [history, setHistory] = useState<PointEntry[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // 1. Active plans → for current + next-tier lookup
      const { data: allPlans } = await supabase
        .from("plans")
        .select("id, slug, name, tier_level, description, is_active, plan_versions:plan_versions(id, price, currency, interval, features, status, version_number)")
        .eq("is_active", true)
        .order("tier_level", { ascending: true });

      const planList: PlanInfo[] = (allPlans ?? [])
        .map((p: any) => {
          const v = (p.plan_versions ?? [])
            .filter((x: any) => x.status === "active")
            .sort((a: any, b: any) => b.version_number - a.version_number)[0];
          if (!v) return null;
          return {
            slug: p.slug,
            name: p.name,
            tier_level: p.tier_level,
            price: Number(v.price ?? 0),
            currency: v.currency || "EUR",
            interval: v.interval || "monthly",
            features: Array.isArray(v.features) ? v.features : [],
            description: p.description,
          } as PlanInfo;
        })
        .filter(Boolean) as PlanInfo[];

      // 2. User subscription
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("started_at, plan_versions:plan_version_id(plan_id, plans:plan_id(slug))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const sub: any = subs?.[0];
      const slug: string = sub?.plan_versions?.plans?.slug ?? "free";
      const cur = planList.find((p) => p.slug === slug) ?? planList.find((p) => p.slug === "free") ?? null;
      const nextIdx = cur ? TIER_ORDER.indexOf(cur.slug) + 1 : -1;
      const nxt = nextIdx > 0 && nextIdx < TIER_ORDER.length
        ? planList.find((p) => p.slug === TIER_ORDER[nextIdx]) ?? null
        : null;

      // 3. Points history from completed appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, scheduled_date, status, service_types:service_type_id(name, name_en, reward_points)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("scheduled_date", { ascending: false })
        .limit(50);

      const entries: PointEntry[] = (appts ?? []).map((a: any) => ({
        id: a.id,
        date: a.scheduled_date,
        service: a.service_types?.name_en || a.service_types?.name || "Service",
        points: a.service_types?.reward_points ?? 0,
        status: a.status,
      }));

      if (cancelled) return;
      setCurrentPlan(cur);
      setNextPlan(nxt);
      setMemberSince(sub?.started_at ?? null);
      setHistory(entries);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const totalPoints = useMemo(() => history.reduce((s, h) => s + h.points, 0), [history]);

  const slug = currentPlan?.slug ?? "free";
  const styles = cardStyles[slug] ?? cardStyles.free;
  const nextStyles = nextPlan ? (cardStyles[nextPlan.slug] ?? cardStyles.free) : null;

  const priceLabel = currentPlan
    ? currentPlan.price > 0
      ? new Intl.NumberFormat("en-GB", { style: "currency", currency: currentPlan.currency }).format(currentPlan.price)
      : "Free"
    : "—";
  const periodLabel = currentPlan
    ? currentPlan.price > 0
      ? `/${currentPlan.interval === "yearly" ? "year" : "month"}`
      : "with bike purchase"
    : "";

  const nextPriceLabel = nextPlan
    ? nextPlan.price > 0
      ? new Intl.NumberFormat("en-GB", { style: "currency", currency: nextPlan.currency }).format(nextPlan.price)
      : "Free"
    : "";
  const nextPeriodLabel = nextPlan
    ? nextPlan.price > 0
      ? `/${nextPlan.interval === "yearly" ? "year" : "month"}`
      : ""
    : "";

  return (
    <RoleDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <h1 className="text-xl sm:text-2xl font-light text-foreground">My Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your membership and track your rewards</p>
        </motion.div>

        {/* Top row: card + privileges (12-col) */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Member Card - 5 cols */}
          <div className="col-span-12 lg:col-span-5">
            <div className="relative aspect-[1.6/1] rounded-3xl overflow-hidden bg-gradient-to-br from-background to-secondary border border-border/50">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-wj-green blur-3xl" />
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-wj-green blur-2xl" />
              </div>

              <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Member Card</p>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">WJ Vision</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                    {currentPlan?.name ?? "Free"}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Card Number</p>
                  <p className="text-foreground text-lg font-mono tracking-[0.15em]">
                    4532 •••• •••• {(user?.id || "0000").replace(/-/g, "").slice(-4).toUpperCase()}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Member</p>
                    <p className="text-foreground text-sm font-medium">{user?.name || "Guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Total Points</p>
                    <p className="text-wj-green text-lg font-bold">{totalPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privileges - 7 cols */}
          <div className="col-span-12 lg:col-span-7">
            <div className="h-full rounded-3xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-wj-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{currentPlan?.name ?? "Free"} Member Privileges</h3>
                  <p className="text-xs text-muted-foreground">{currentPlan?.description ?? "Your plan benefits"}</p>
                </div>
              </div>

              {currentPlan?.features?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPlan.features.map((feat, i) => (
                    <motion.div
                      key={`${feat}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-wj-green/5 border border-wj-green/20"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-wj-green/20">
                        <Check className="h-3.5 w-3.5 text-wj-green" />
                      </div>
                      <span className="text-sm text-foreground">{feat}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading plan details…" : "No benefits defined for this plan yet."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: history + plan side panel */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Points History - 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-wj-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Points History</h3>
                      <p className="text-xs text-muted-foreground">Earn points with every completed service</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-wj-green">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-bold">+{totalPoints} pts</span>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    {loading ? "Loading…" : "No completed services yet. Points will appear here after your first revision."}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Service</TableHead>
                        <TableHead className="text-muted-foreground text-right">Points</TableHead>
                        <TableHead className="text-muted-foreground text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.4) }}
                          className="border-border/30 hover:bg-muted/30"
                        >
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground">{item.service}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-wj-green font-semibold">+{item.points}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="px-2 py-0.5 rounded-full bg-wj-green/10 text-wj-green text-xs font-medium capitalize">
                              {item.status}
                            </span>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

          {/* Plan side panel - 4 cols */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Current Plan */}
            <div className="rounded-3xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-wj-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
                  <p className="text-xs text-muted-foreground">Your active subscription</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-wj-green/10 to-transparent border border-wj-green/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                    {currentPlan?.name ?? "Free"}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground">{priceLabel}</span>
                    <span className="text-xs text-muted-foreground">{periodLabel}</span>
                  </div>
                </div>
                {currentPlan?.description && (
                  <p className="text-xs text-muted-foreground">{currentPlan.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Member since {memberSince
                      ? new Date(memberSince).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Upgrade Section */}
            {nextPlan && nextStyles && (
              <div className="rounded-3xl border border-wj-green/30 bg-gradient-to-br from-wj-green/5 to-transparent p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-wj-green/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-wj-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Upgrade Your Plan</h3>
                    <p className="text-xs text-muted-foreground">Unlock more benefits</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${nextStyles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                      {nextPlan.name}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-foreground">{nextPriceLabel}</span>
                      <span className="text-xs text-muted-foreground">{nextPeriodLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {nextPlan.features
                      .filter((f) => !(currentPlan?.features ?? []).includes(f))
                      .slice(0, 3)
                      .map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Gift className="h-3.5 w-3.5 text-wj-green" />
                          <span>{feat}</span>
                        </div>
                      ))}
                  </div>

                  <Link to="/dashboard/plans" className="block">
                    <Button className="w-full gradient-wj text-white hover:opacity-90">
                      Upgrade to {nextPlan.name}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!nextPlan && currentPlan && (
              <div className="rounded-3xl border border-wj-green/30 bg-gradient-to-br from-wj-green/5 to-transparent p-6 text-center">
                <Crown className="h-8 w-8 text-wj-green mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">You're at the top!</h3>
                <p className="text-xs text-muted-foreground">You have the highest membership tier with all benefits unlocked.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}

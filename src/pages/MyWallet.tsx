import { motion } from "framer-motion";
import { Crown, Shield, Wrench, Clock, Gift, Sparkles, TrendingUp, Check, Calendar, Plus, Maximize2, QrCode } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RoleDashboardLayout from "@/components/dashboard/RoleDashboardLayout";
import EmptyState from "@/components/dashboard/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import StyledEPassQR from "@/components/dashboard/StyledEPassQR";

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

type LinkedBike = {
  id: string;
  model: string | null;
  serial: string | null;
  color: string | null;
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [showcaseFlipped, setShowcaseFlipped] = useState(false);
  const [linkedBikes, setLinkedBikes] = useState<LinkedBike[]>([]);
  const [activeBikeIdx, setActiveBikeIdx] = useState(0);
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

      // 4. Linked bikes (only for real authenticated customers)
      let bikes: LinkedBike[] = [];
      if (!(user as any)?.isDemo) {
        const { data: cp } = await supabase
          .from("customer_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cp?.id) {
          const { data: cbs } = await supabase
            .from("customer_bikes")
            .select("id, model, serial, color")
            .eq("customer_id", cp.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false });
          bikes = (cbs as LinkedBike[]) ?? [];
        }
      }
      if (bikes.length === 0 && (user as any)?.bikeId) {
        bikes = [{ id: (user as any).bikeId, model: (user as any).bikeName ?? null, serial: (user as any).bikeId, color: null }];
      }

      if (cancelled) return;
      setCurrentPlan(cur);
      setNextPlan(nxt);
      setMemberSince(sub?.started_at ?? null);
      setHistory(entries);
      setLinkedBikes(bikes);
      setActiveBikeIdx(0);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const totalPoints = useMemo(() => history.reduce((s, h) => s + h.points, 0), [history]);

  // Next maintenance: 3 months from last completed appointment, fallback null
  const nextMaintenance = useMemo(() => {
    if (history.length === 0) return null;
    const last = new Date(history[0].date);
    const next = new Date(last);
    next.setMonth(next.getMonth() + 3);
    const days = Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { date: next, days };
  }, [history]);

  const nextMaintenanceLabel = nextMaintenance
    ? nextMaintenance.days < 0
      ? t("e_pass.overdue")
      : nextMaintenance.days === 0
      ? t("e_pass.today")
      : t("e_pass.in_days", { n: nextMaintenance.days })
    : t("e_pass.not_scheduled");

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

  const activeBike = linkedBikes[activeBikeIdx];
  const activeBikeId = activeBike?.id || (user as any)?.bikeId || user?.id || "unknown";
  const activeBikeName = activeBike?.model || (user as any)?.bikeName || t("e_pass.no_bike");
  const activeBikeSerial = activeBike?.serial || (user as any)?.bikeId || "—";
  const canLinkAnother = linkedBikes.length >= 1; // any registered bike means user has bike infra; ghost card opens registration flow on dashboard

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
          <h1 className="text-xl sm:text-2xl font-light text-foreground">{t("e_pass.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("e_pass.subtitle")}</p>
        </motion.div>

        {/* Top row: card + privileges (12-col) */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Member Card - 5 cols */}
          <div className="col-span-12 lg:col-span-5">
            <div className="relative">
              {/* Ghost stacked card (peek behind) */}
              <div
                aria-hidden
                className="absolute -top-2 left-2 right-2 aspect-[1.6/1] rounded-3xl border border-dashed border-border/40 bg-card/40 backdrop-blur-sm -z-10"
                style={{ transform: "rotate(-2deg)" }}
              />
              <div
                className="relative aspect-[1.6/1] cursor-pointer group"
                style={{ perspective: "1200px" }}
                onClick={() => { setShowcaseFlipped(false); setShowcaseOpen(true); }}
                role="button"
                aria-label={t("e_pass.open_showcase")}
              >
                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" />
                    {t("e_pass.open_showcase")}
                  </div>
                </div>
              <div
                className="relative w-full h-full transition-transform duration-700"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* FRONT */}
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-background to-secondary border border-border/50 transition-opacity duration-300"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "translateZ(1px)",
                    opacity: isFlipped ? 0 : 1,
                    pointerEvents: isFlipped ? "none" : "auto",
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-wj-green blur-3xl" />
                    <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-wj-green blur-2xl" />
                  </div>

                  <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{t("e_pass.member_card")}</p>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">WJ Vision</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                    {currentPlan?.name ?? "Free"}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest">{t("e_pass.card_number")}</p>
                  <p className="text-foreground text-lg font-mono tracking-[0.15em]">
                    4532 •••• •••• {(user?.id || "0000").replace(/-/g, "").slice(-4).toUpperCase()}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{t("e_pass.member")}</p>
                    <p className="text-foreground text-sm font-medium">{user?.name || "Guest"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{t("e_pass.total_points")}</p>
                    <p className="text-wj-green text-lg font-bold">{totalPoints.toLocaleString()}</p>
                  </div>
                </div>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-background to-secondary border border-border/50 transition-opacity duration-300"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg) translateZ(1px)",
                    opacity: isFlipped ? 1 : 0,
                    pointerEvents: isFlipped ? "auto" : "none",
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-wj-green blur-3xl" />
                    <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-wj-green blur-2xl" />
                  </div>

                  <div className="relative z-10 h-full p-5 flex items-center gap-5">
                    <div className="rounded-2xl bg-background p-2 shadow-xl shrink-0">
                      <StyledEPassQR
                        data={`https://wjbikes.nl/epass/${activeBikeId}`}
                        size={140}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{t("e_pass.bike")}</p>
                        <h3 className="text-base font-bold text-foreground tracking-tight truncate">
                          {activeBikeName}
                        </h3>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t("e_pass.serial")}</p>
                        <p className="text-foreground text-sm font-mono tracking-wider truncate">
                          {activeBikeSerial}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t("e_pass.owner")}</p>
                        <p className="text-foreground text-sm font-medium truncate">{user?.name || "Guest"}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-1">
                        {t("e_pass.tap_to_flip")}
                      </p>
                    </div>
                  </div>
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
                  <h3 className="text-lg font-semibold text-foreground">{t("e_pass.privileges", { plan: currentPlan?.name ?? "Free" })}</h3>
                  <p className="text-xs text-muted-foreground">{currentPlan?.description ?? t("e_pass.privileges_sub")}</p>
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
                  {loading ? t("e_pass.loading_plan") : t("e_pass.no_benefits")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: history + plan side panel */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Points History - 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            <div className="h-full rounded-3xl border border-border/50 bg-card overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-wj-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{t("e_pass.transactions")}</h3>
                      <p className="text-xs text-muted-foreground">{t("e_pass.transactions_sub")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-wj-green">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-bold">+{totalPoints} pts</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[240px] overflow-y-auto">
                {history.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title={loading ? t("e_pass.history.loading_title") : t("e_pass.history.empty_title")}
                    description={loading ? t("e_pass.history.loading_desc") : t("e_pass.history.empty_desc")}
                    className="h-full"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">{t("e_pass.history.date")}</TableHead>
                        <TableHead className="text-muted-foreground">{t("e_pass.history.service")}</TableHead>
                        <TableHead className="text-muted-foreground text-right">{t("e_pass.history.points")}</TableHead>
                        <TableHead className="text-muted-foreground text-right">{t("e_pass.history.status")}</TableHead>
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

              <div className="p-4 border-t border-border/50">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full gradient-wj text-white hover:opacity-90"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("e_pass.schedule_now")}
                </Button>
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
                  <h3 className="text-lg font-semibold text-foreground">{t("e_pass.current_plan")}</h3>
                  <p className="text-xs text-muted-foreground">{t("e_pass.current_plan_sub")}</p>
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
                    {t("e_pass.member_since", {
                      when: memberSince
                        ? new Date(memberSince).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                        : "—",
                    })}
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
                    <h3 className="text-lg font-semibold text-foreground">{t("e_pass.upgrade_title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("e_pass.upgrade_sub")}</p>
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
                      {t("e_pass.upgrade_cta", { plan: nextPlan.name })}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!nextPlan && currentPlan && (
              <div className="rounded-3xl border border-wj-green/30 bg-gradient-to-br from-wj-green/5 to-transparent p-6 text-center">
                <Crown className="h-8 w-8 text-wj-green mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("e_pass.top_tier_title")}</h3>
                <p className="text-xs text-muted-foreground">{t("e_pass.top_tier_sub")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Showcase Modal */}
      <Dialog open={showcaseOpen} onOpenChange={setShowcaseOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border/60">
          <div className="p-6 pb-4 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-xl font-light">{t("e_pass.showcase_title")}</DialogTitle>
              <DialogDescription>{t("e_pass.showcase_subtitle")}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Stacked card showcase */}
            <div className="relative max-w-md mx-auto">
              {/* Ghost card behind */}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={!canLinkAnother}
                title={canLinkAnother ? t("e_pass.link_another") : t("e_pass.no_other_bike")}
                className="absolute -top-3 left-3 right-3 aspect-[1.6/1] rounded-3xl border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm -z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-wj-green hover:border-wj-green/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ transform: "rotate(-2deg)" }}
              >
                <Plus className="h-6 w-6" />
                <span className="text-[11px] uppercase tracking-widest">{t("e_pass.link_another")}</span>
              </button>

              {/* Featured card */}
              <div
                className="relative aspect-[1.6/1] cursor-pointer"
                style={{ perspective: "1200px" }}
                onClick={() => setShowcaseFlipped((v) => !v)}
                role="button"
                aria-label={t("e_pass.tap_to_flip")}
              >
                <div
                  className="relative w-full h-full transition-transform duration-700"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: showcaseFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* FRONT */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-background to-secondary border border-border/60 shadow-2xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "translateZ(1px)",
                      opacity: showcaseFlipped ? 0 : 1,
                      pointerEvents: showcaseFlipped ? "none" : "auto",
                    }}
                  >
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-wj-green blur-3xl" />
                      <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-wj-green blur-2xl" />
                    </div>
                    <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{t("e_pass.member_card")}</p>
                          <h3 className="text-lg font-bold text-foreground tracking-tight">WJ Vision</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                          {currentPlan?.name ?? "Free"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-widest">{t("e_pass.card_number")}</p>
                        <p className="text-foreground text-lg font-mono tracking-[0.15em]">
                          4532 •••• •••• {(user?.id || "0000").replace(/-/g, "").slice(-4).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{t("e_pass.member")}</p>
                          <p className="text-foreground text-sm font-medium">{user?.name || "Guest"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">{t("e_pass.total_points")}</p>
                          <p className="text-wj-green text-lg font-bold">{totalPoints.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* BACK */}
                  <div
                    className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-background to-secondary border border-border/60 shadow-2xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg) translateZ(1px)",
                      opacity: showcaseFlipped ? 1 : 0,
                      pointerEvents: showcaseFlipped ? "auto" : "none",
                    }}
                  >
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-wj-green blur-3xl" />
                      <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-wj-green blur-2xl" />
                    </div>
                    <div className="relative z-10 h-full p-5 flex items-center gap-5">
                      <div className="rounded-2xl bg-background p-2 shadow-xl shrink-0">
                        <StyledEPassQR
                          data={`https://wjbikes.nl/epass/${activeBikeId}`}
                          size={140}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{t("e_pass.bike")}</p>
                          <h3 className="text-base font-bold text-foreground tracking-tight truncate">{activeBikeName}</h3>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t("e_pass.serial")}</p>
                          <p className="text-foreground text-sm font-mono tracking-wider truncate">{activeBikeSerial}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t("e_pass.owner")}</p>
                          <p className="text-foreground text-sm font-medium truncate">{user?.name || "Guest"}</p>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-1">{t("e_pass.tap_to_flip")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bike switcher dots */}
              {linkedBikes.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {linkedBikes.map((b, i) => (
                    <button
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); setActiveBikeIdx(i); }}
                      className={`h-2 rounded-full transition-all ${i === activeBikeIdx ? "w-6 bg-wj-green" : "w-2 bg-border hover:bg-muted-foreground/40"}`}
                      aria-label={b.model || `Bike ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-wj-green" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("e_pass.total_points")}</p>
                  <p className="text-lg font-bold text-foreground">{totalPoints.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-wj-green" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("e_pass.next_maintenance")}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{nextMaintenanceLabel}</p>
                </div>
              </div>
              <Button
                onClick={() => { setShowcaseOpen(false); navigate("/dashboard"); }}
                className="h-full min-h-[68px] rounded-2xl gradient-wj text-white hover:opacity-90"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("e_pass.schedule_now")}
              </Button>
            </div>

            {/* History table inside modal */}
            <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-wj-green" />
                  <h4 className="text-sm font-semibold text-foreground">{t("e_pass.transactions")}</h4>
                </div>
                <span className="text-xs text-wj-green font-bold">+{totalPoints} pts</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {history.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title={loading ? t("e_pass.history.loading_title") : t("e_pass.history.empty_title")}
                    description={loading ? t("e_pass.history.loading_desc") : t("e_pass.history.empty_desc")}
                    className="max-h-[300px]"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">{t("e_pass.history.date")}</TableHead>
                        <TableHead className="text-muted-foreground">{t("e_pass.history.service")}</TableHead>
                        <TableHead className="text-muted-foreground text-right">{t("e_pass.history.points")}</TableHead>
                        <TableHead className="text-muted-foreground text-right">{t("e_pass.history.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id} className="border-border/30 hover:bg-muted/30">
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RoleDashboardLayout>
  );
}

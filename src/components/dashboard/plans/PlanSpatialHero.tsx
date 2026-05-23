import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Sparkles, TrendingUp, Users, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanSpatialHeroProps {
  plan: any;
  activeVersion: any;
  mrr: number;
  activeSubsCount: number;
  versionsCount: number;
  onEdit: () => void;
}

const spring = { type: "spring" as const, stiffness: 120, damping: 22 };

export default function PlanSpatialHero({
  plan,
  activeVersion,
  mrr,
  activeSubsCount,
  versionsCount,
  onEdit,
}: PlanSpatialHeroProps) {
  const color = plan.color_hex || "#058c42";
  const price = Number(activeVersion?.price ?? 0);
  const interval = activeVersion?.interval ?? "—";

  const metrics = [
    {
      label: "MRR",
      value: `€${mrr.toFixed(2)}`,
      icon: TrendingUp,
      bar: Math.min(100, mrr > 0 ? Math.log10(mrr + 1) * 30 : 4),
    },
    {
      label: "Subscribers",
      value: String(activeSubsCount),
      icon: Users,
      bar: Math.min(100, activeSubsCount * 4 + 4),
    },
    {
      label: "Versions",
      value: String(versionsCount),
      icon: Layers,
      bar: Math.min(100, versionsCount * 14 + 6),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="relative overflow-hidden rounded-3xl border border-border/30 bg-background/40 backdrop-blur-xl"
    >
      {/* Ambient gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(120% 80% at 0% 0%, ${color}33 0%, transparent 55%), radial-gradient(80% 60% at 100% 100%, ${color}22 0%, transparent 60%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-40"
        style={{ background: color }}
      />

      <div className="relative grid grid-cols-12 gap-6 p-6 lg:p-8">
        {/* Visual orb */}
        <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[260px]">
            {/* Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: `${color}${i === 0 ? "55" : i === 1 ? "33" : "1f"}` }}
                animate={{ scale: [1, 1.06, 1], opacity: [0.7, 0.3, 0.7] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              />
            ))}
            {/* Core disc */}
            <AnimatePresence mode="wait">
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.7, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                transition={spring}
                className="absolute inset-6 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${color}cc, ${color}33 60%, transparent 75%)`,
                  boxShadow: `0 0 80px ${color}55, inset 0 0 40px ${color}33`,
                }}
              >
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center backdrop-blur-md"
                  style={{
                    background: `${color}22`,
                    border: `1px solid ${color}66`,
                  }}
                >
                  <Sparkles className="h-9 w-9" style={{ color }} />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Status pill */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-md border border-border/40 text-[10px] uppercase tracking-[0.18em]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: color }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                </span>
                {plan.is_active ? "Live" : "Archived"}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-px w-6 bg-border" />
                Subscription Plan
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-light tracking-tight">{plan.name}</h1>
                {plan.is_active ? (
                  <Badge className="bg-wj-green/20 text-wj-green border-0">Active</Badge>
                ) : (
                  <Badge variant="outline">Archived</Badge>
                )}
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{plan.description}</p>
              )}
            </div>
            <Button onClick={onEdit} className="gap-2 bg-wj-green hover:bg-wj-green/90 rounded-full">
              <Edit3 className="h-4 w-4" /> New Version
            </Button>
          </div>

          {/* Price strip */}
          <div className="flex items-end gap-6 flex-wrap pt-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Price</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light" style={{ color }}>€{price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/ {interval}</span>
              </div>
            </div>
            {activeVersion && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> v{activeVersion.version_number}
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Trial {activeVersion.trial_days}d
                </span>
              </div>
            )}
          </div>

          {/* Metric bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 + i * 0.05 }}
                className="rounded-2xl border border-border/30 bg-background/40 backdrop-blur-md p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <m.icon className="h-3.5 w-3.5" /> {m.label}
                  </div>
                  <span className="text-lg font-light">{m.value}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.bar}%` }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
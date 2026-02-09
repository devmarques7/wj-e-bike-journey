import { motion } from "framer-motion";
import { Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffWorkloadMeterProps {
  currentLoad: number; // 0-100
  weeklyHours: number;
  targetHours: number;
  completedToday: number;
  totalToday: number;
}

export default function StaffWorkloadMeter({
  currentLoad = 75,
  weeklyHours = 32,
  targetHours = 40,
  completedToday = 2,
  totalToday = 5,
}: StaffWorkloadMeterProps) {
  const loadColor = currentLoad > 90 ? "text-destructive" : currentLoad > 70 ? "text-amber-500" : "text-wj-green";
  const loadBgColor = currentLoad > 90 ? "bg-destructive" : currentLoad > 70 ? "bg-amber-500" : "bg-wj-green";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-wj-green" />
          <h3 className="text-lg font-medium text-foreground">Workload</h3>
        </div>
        <span className={cn("text-2xl font-light", loadColor)}>{currentLoad}%</span>
      </div>

      {/* Workload Bar */}
      <div className="mb-4">
        <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentLoad}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className={cn("h-full rounded-full", loadBgColor)}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Weekly Hours</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-light text-foreground">{weeklyHours}</span>
            <span className="text-xs text-muted-foreground">/ {targetHours}h</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Today's Progress</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-light text-foreground">{completedToday}</span>
            <span className="text-xs text-muted-foreground">/ {totalToday} tasks</span>
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
        <TrendingUp className="h-4 w-4 text-wj-green" />
        <span className="text-xs text-muted-foreground">
          You're on track for this week's target
        </span>
      </div>
    </motion.div>
  );
}

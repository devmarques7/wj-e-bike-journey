import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminKPICardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  index?: number;
  info?: string;
}

export default function AdminKPICard({ label, value, change, trend, icon: Icon, index = 0, info }: AdminKPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 hover:bg-background/70 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          {info && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`About ${label}`}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="z-[100] max-w-[240px] text-xs leading-relaxed">
                  {info}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend === "up" ? "text-wj-green" : "text-destructive"
          )}>
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {change}
          </span>
        </div>
      </div>
      <p className="text-2xl font-light text-foreground mt-4">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

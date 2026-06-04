import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import type { WorkshopToday } from "@/hooks/admin/useAdminOverviewData";

interface Props { data: WorkshopToday; loading?: boolean }

export default function AdminWorkshopStatus({ data }: Props) {
  const { t } = useTranslation();
  const loadColor = data.load_pct >= 85 ? "text-destructive"
    : data.load_pct >= 60 ? "text-amber-500" : "text-wj-green";
  const lastEnd = data.last_end_time ? data.last_end_time.slice(0, 5) : "—";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Wrench className="h-5 w-5 text-wj-green" />
            {t("admin_overview.workshop.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">{t("admin_overview.workshop.capacity")}</span>
              <span className={`text-sm font-medium ${loadColor}`}>{data.load_pct}%</span>
            </div>
            <Progress value={data.load_pct} className="h-2.5" />
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
              <p className="text-xl font-light text-foreground">{data.pending}</p>
              <p className="text-xs text-muted-foreground">{t("admin_overview.workshop.queue")}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
              <p className="text-xl font-light text-foreground">{data.in_progress}</p>
              <p className="text-xs text-muted-foreground">{t("admin_overview.workshop.bench")}</p>
            </div>
            <div className="p-3 rounded-xl bg-wj-green/10 border border-wj-green/20">
              <p className="text-xl font-light text-wj-green">{data.completed}</p>
              <p className="text-xs text-muted-foreground">{t("admin_overview.workshop.ready")}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-1">{t("admin_overview.workshop.commitment")}</p>
            <p className="text-sm text-foreground">
              {data.total === 0
                ? t("admin_overview.workshop.no_bookings")
                : (<>{t("admin_overview.workshop.ready_by")} <span className="font-medium text-wj-green">{lastEnd}</span> {t("admin_overview.workshop.for_bookings", { count: data.total })}</>)
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

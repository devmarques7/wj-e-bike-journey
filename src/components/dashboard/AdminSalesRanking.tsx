import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlanRanking } from "@/hooks/admin/useAdminOverviewData";

interface Props { rows: PlanRanking[]; loading?: boolean }

export default function AdminSalesRanking({ rows, loading }: Props) {
  const { t, i18n } = useTranslation();
  const fmt = new Intl.NumberFormat(i18n.language === "pt" ? "pt-PT" : "en-GB", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <BarChart3 className="h-5 w-5 text-wj-green" />
            {t("admin_overview.sales_ranking.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && rows.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))
            : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {t("admin_overview.sales_ranking.empty")}
              </p>
            ) : rows.slice(0, 5).map((p, index) => (
            <div key={p.plan_id} className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-sm font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground truncate flex items-center gap-2">
                    {p.color_hex && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color_hex }} />
                    )}
                    {p.name}
                  </span>
                  <span className="text-sm text-wj-green font-medium">{p.pct}%</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("admin_overview.sales_ranking.subs", { count: p.active_subs })}</span>
                  <span>{fmt.format(p.mrr)} {t("admin_overview.sales_ranking.mrr_short")}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

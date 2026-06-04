import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlanRanking } from "@/hooks/admin/useAdminOverviewData";

interface Props { rows: PlanRanking[]; total: number; loading?: boolean }

export default function AdminMemberSegments({ rows, total, loading }: Props) {
  const { t, i18n } = useTranslation();
  const fmtN = new Intl.NumberFormat(i18n.language === "pt" ? "pt-PT" : "en-GB");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Users className="h-5 w-5 text-wj-green" />
            {t("admin_overview.segments.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && rows.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t("admin_overview.segments.empty")}</p>
          ) : rows.map((segment) => (
            <div key={segment.plan_id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground font-medium flex items-center gap-2">
                  {segment.color_hex && (
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color_hex }} />
                  )}
                  {segment.name}
                </span>
                <span className="text-sm text-muted-foreground">{fmtN.format(segment.active_subs)}</span>
              </div>
              <Progress value={segment.pct} className="h-2" />
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-sm text-muted-foreground">{t("admin_overview.segments.total")}</p>
            <p className="text-2xl font-light text-foreground">{fmtN.format(total)}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

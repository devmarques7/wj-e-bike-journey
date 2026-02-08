import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const recentAlerts = [
  { message: "Workshop capacity reaching limit", severity: "warning", time: "2m ago" },
  { message: "New Black member signup: Sophie J.", severity: "success", time: "15m ago" },
  { message: "Inventory low: Winter Protection Spray", severity: "error", time: "1h ago" },
];

export default function AdminAlerts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Bell className="h-5 w-5 text-wj-green" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAlerts.map((alert, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-xl border",
                alert.severity === "error"
                  ? "bg-destructive/10 border-destructive/20"
                  : alert.severity === "warning"
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-wj-green/10 border-wj-green/20"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={cn(
                  "h-4 w-4 mt-0.5 flex-shrink-0",
                  alert.severity === "error"
                    ? "text-destructive"
                    : alert.severity === "warning"
                    ? "text-amber-500"
                    : "text-wj-green"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

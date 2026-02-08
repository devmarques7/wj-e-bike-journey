import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, ShoppingCart, Wrench, CreditCard, AlertCircle } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const kpiData = [
  {
    label: "Monthly Revenue",
    value: "€847,250",
    change: "+12.5%",
    trend: "up",
    icon: CreditCard,
  },
  {
    label: "Active Members",
    value: "2,847",
    change: "+8.3%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Orders Today",
    value: "142",
    change: "-3.2%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    label: "Workshop Load",
    value: "87%",
    change: "+5.1%",
    trend: "up",
    icon: Wrench,
  },
];

const topProducts = [
  { name: "WJ V8 Urban", sales: 324, revenue: "€842,400", trend: "+18%" },
  { name: "WJ V8 Sport", sales: 256, revenue: "€716,800", trend: "+12%" },
  { name: "WJ V8 Prestige", sales: 189, revenue: "€661,500", trend: "+24%" },
];

const memberSegments = [
  { tier: "Light", count: 1420, percentage: 50, color: "bg-muted-foreground" },
  { tier: "Plus", count: 892, percentage: 31, color: "bg-wj-green" },
  { tier: "Black", count: 535, percentage: 19, color: "bg-foreground" },
];

const recentAlerts = [
  { message: "Workshop capacity reaching limit", severity: "warning", time: "2m ago" },
  { message: "New Black member signup: Sophie J.", severity: "success", time: "15m ago" },
  { message: "Inventory low: Winter Protection Spray", severity: "error", time: "1h ago" },
];

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto bg-muted/30">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-8 py-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-foreground">
                Command Center
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time business intelligence
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-wj-green/10 text-wj-green text-sm">
                <span className="w-2 h-2 rounded-full bg-wj-green animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </motion.header>

        <div className="p-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl border border-border/50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <kpi.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm ${
                    kpi.trend === "up" ? "text-wj-green" : "text-destructive"
                  }`}>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-light text-foreground mt-4">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Ranking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-6"
            >
              <h3 className="text-lg font-medium text-foreground mb-4">Sales Ranking</h3>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{product.name}</span>
                        <span className="text-sm text-wj-green">{product.trend}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{product.sales} units</span>
                        <span>{product.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Member Segments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-xl border border-border/50 p-6"
            >
              <h3 className="text-lg font-medium text-foreground mb-4">Member Segments</h3>
              <div className="space-y-4">
                {memberSegments.map((segment) => (
                  <div key={segment.tier}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground">{segment.tier}</span>
                      <span className="text-sm text-muted-foreground">{segment.count}</span>
                    </div>
                    <Progress value={segment.percentage} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-light text-foreground">2,847</p>
              </div>
            </motion.div>
          </div>

          {/* Alerts & Workshop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card rounded-xl border border-border/50 p-6"
            >
              <h3 className="text-lg font-medium text-foreground mb-4">System Alerts</h3>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.severity === "error"
                        ? "bg-destructive/5 border-destructive/20"
                        : alert.severity === "warning"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-wj-green/5 border-wj-green/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`h-4 w-4 mt-0.5 ${
                        alert.severity === "error"
                          ? "text-destructive"
                          : alert.severity === "warning"
                          ? "text-amber-500"
                          : "text-wj-green"
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Workshop Capacity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card rounded-xl border border-border/50 p-6"
            >
              <h3 className="text-lg font-medium text-foreground mb-4">Workshop Today</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Capacity</span>
                    <span className="text-sm font-medium text-amber-500">87%</span>
                  </div>
                  <Progress value={87} className="h-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xl font-light text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">In Queue</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xl font-light text-foreground">8</p>
                    <p className="text-xs text-muted-foreground">On Bench</p>
                  </div>
                  <div className="p-3 rounded-lg bg-wj-green/10">
                    <p className="text-xl font-light text-wj-green">5</p>
                    <p className="text-xs text-muted-foreground">Ready</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-2">Today's Commitment</p>
                  <p className="text-sm text-foreground">
                    Ready by <span className="font-medium text-wj-green">5:30 PM</span> for all current bookings
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

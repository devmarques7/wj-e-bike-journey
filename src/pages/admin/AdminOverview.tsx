import { motion } from "framer-motion";
import { CreditCard, Users, ShoppingCart, Wrench } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import AdminSalesRanking from "@/components/dashboard/AdminSalesRanking";
import AdminMemberSegments from "@/components/dashboard/AdminMemberSegments";
import AdminAlerts from "@/components/dashboard/AdminAlerts";
import AdminWorkshopStatus from "@/components/dashboard/AdminWorkshopStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const kpiData = [
  {
    label: "Monthly Revenue",
    value: "€847,250",
    change: "+12.5%",
    trend: "up" as const,
    icon: CreditCard,
  },
  {
    label: "Active Members",
    value: "2,847",
    change: "+8.3%",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Orders Today",
    value: "142",
    change: "-3.2%",
    trend: "down" as const,
    icon: ShoppingCart,
  },
  {
    label: "Workshop Load",
    value: "87%",
    change: "+5.1%",
    trend: "up" as const,
    icon: Wrench,
  },
];

export default function AdminOverview() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <h1 className="text-xl sm:text-2xl font-light text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time business intelligence
          </p>
        </motion.div>

        {/* KPI Cards - 12 Column Grid (3 each) */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {kpiData.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Main Content Grid - 12 Columns */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Sales Ranking - 5 columns */}
          <div className="col-span-12 lg:col-span-5">
            <AdminSalesRanking />
          </div>

          {/* Middle Section - 3 columns (stacked) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:gap-6">
            <AdminMemberSegments />
          </div>

          {/* Workshop Status - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <AdminWorkshopStatus />
          </div>
        </div>

        {/* Bottom Section - Alerts */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8">
            <AdminAlerts />
          </div>
          
          {/* Placeholder for future component */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="h-full bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-wj-green/10 flex items-center justify-center mb-3">
                <ShoppingCart className="h-6 w-6 text-wj-green" />
              </div>
              <p className="text-sm font-medium text-foreground">Quick Actions</p>
              <p className="text-xs text-muted-foreground mt-1">
                Manage orders, members, and workshop
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

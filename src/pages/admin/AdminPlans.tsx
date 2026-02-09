import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Euro,
  CheckCircle2,
  XCircle,
  Clock,
  Award
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const plansKPIs = [
  {
    label: "Monthly Revenue",
    value: "€124,850",
    change: "+18.3%",
    trend: "up" as const,
    icon: Euro,
  },
  {
    label: "Active Subscribers",
    value: "2,847",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Churn Rate",
    value: "2.1%",
    change: "-0.4%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    label: "Avg. Revenue/User",
    value: "€43.85",
    change: "+5.2%",
    trend: "up" as const,
    icon: CreditCard,
  },
];

const growthData = [
  { month: "Jan", revenue: 85000, subscribers: 2100, growth: 12 },
  { month: "Feb", revenue: 92000, subscribers: 2250, growth: 15 },
  { month: "Mar", revenue: 98000, subscribers: 2400, growth: 18 },
  { month: "Apr", revenue: 105000, subscribers: 2550, growth: 20 },
  { month: "May", revenue: 115000, subscribers: 2700, growth: 22 },
  { month: "Jun", revenue: 124850, subscribers: 2847, growth: 25 },
];

const brandData = [
  { brand: "V8 Sport", subscribers: 1240, percentage: 44 },
  { brand: "V8 Urban", subscribers: 820, percentage: 29 },
  { brand: "V8 Comfort", subscribers: 510, percentage: 18 },
  { brand: "V8 Cargo", subscribers: 277, percentage: 9 },
];

const subscribers = [
  { id: 1, name: "Jan van der Berg", email: "jan@example.com", plan: "Black", payment: "Card", status: "active", nextPayment: "2024-02-15" },
  { id: 2, name: "Emma de Vries", email: "emma@example.com", plan: "Plus", payment: "Bank Transfer", status: "active", nextPayment: "2024-02-18" },
  { id: 3, name: "Lucas Jansen", email: "lucas@example.com", plan: "Light", payment: "Card", status: "active", nextPayment: "2024-02-20" },
  { id: 4, name: "Sophie Bakker", email: "sophie@example.com", plan: "Black", payment: "Cash", status: "pending", nextPayment: "2024-02-10" },
  { id: 5, name: "Daan Visser", email: "daan@example.com", plan: "Plus", payment: "Card", status: "active", nextPayment: "2024-02-25" },
  { id: 6, name: "Fleur Smit", email: "fleur@example.com", plan: "Light", payment: "Cash", status: "overdue", nextPayment: "2024-02-05" },
  { id: 7, name: "Sem de Jong", email: "sem@example.com", plan: "Plus", payment: "Bank Transfer", status: "active", nextPayment: "2024-02-28" },
  { id: 8, name: "Lotte Mulder", email: "lotte@example.com", plan: "Black", payment: "Card", status: "active", nextPayment: "2024-03-01" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "overdue":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPlanBadge = (plan: string) => {
  switch (plan) {
    case "Black":
      return <Badge className="bg-zinc-800 text-white border-zinc-600">Black</Badge>;
    case "Plus":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30">Plus</Badge>;
    case "Light":
      return <Badge variant="outline">Light</Badge>;
    default:
      return <Badge variant="outline">{plan}</Badge>;
  }
};

export default function AdminPlans() {
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
        >
          <h1 className="text-xl sm:text-2xl font-light text-foreground">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue analytics and subscriber management
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {plansKPIs.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Growth Chart - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[300px]"
            >
              <h3 className="text-sm font-medium text-foreground mb-4">Revenue & Growth</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--wj-green))" name="Revenue (€)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="growth" stroke="#f59e0b" name="Growth %" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Brand Adoption - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[300px]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Bike Model Adoption</h3>
              </div>
              
              <div className="space-y-4">
                {brandData.map((brand, index) => (
                  <div key={brand.brand} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground">{brand.brand}</span>
                      <span className="text-xs text-muted-foreground">{brand.subscribers} ({brand.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${brand.percentage}%` }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-wj-green to-wj-green/60 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Subscribers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-border/30">
            <h3 className="text-sm font-medium text-foreground">All Subscribers</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Email</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Plan</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Payment</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Next Payment</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => (
                  <TableRow key={sub.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell className="text-xs font-medium">{sub.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sub.email}</TableCell>
                    <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                    <TableCell className="text-xs">{sub.payment}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sub.nextPayment}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
}

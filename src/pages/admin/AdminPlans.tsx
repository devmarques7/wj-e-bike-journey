import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Users, Euro, CheckCircle2, XCircle, Clock, Award, Settings2 } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePlansKPIs, useSubscriptions } from "@/hooks/plans/usePlansData";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>;
    case "trialing":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "past_due":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />Overdue</Badge>;
    case "canceled":
      return <Badge className="bg-zinc-700 text-zinc-300">Canceled</Badge>;
    case "paused":
      return <Badge className="bg-zinc-700 text-zinc-300">Paused</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPlanBadge = (name: string) => {
  if (name === "Black") return <Badge className="bg-zinc-800 text-white border-zinc-600">Black</Badge>;
  if (name === "Plus") return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30">Plus</Badge>;
  if (name === "Light") return <Badge variant="outline">Light</Badge>;
  return <Badge variant="outline">{name}</Badge>;
};

export default function AdminPlans() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { kpis, loading } = usePlansKPIs();
  const { rows: subs } = useSubscriptions();

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const totalSubs = kpis.perPlan.reduce((s, p) => s + p.active_subs, 0) || 1;

  const kpiCards = [
    { label: "Monthly Revenue", value: `€${kpis.mrr.toFixed(2)}`, change: loading ? "..." : "live", trend: "up" as const, icon: Euro },
    { label: "Active Subscribers", value: String(kpis.activeSubs), change: loading ? "..." : "live", trend: "up" as const, icon: Users },
    { label: "Churn Rate (30d)", value: `${kpis.churnRate.toFixed(1)}%`, change: loading ? "..." : "live", trend: kpis.churnRate > 5 ? "down" as const : "up" as const, icon: TrendingUp },
    { label: "Avg. Revenue/User", value: `€${kpis.arpu.toFixed(2)}`, change: loading ? "..." : "live", trend: "up" as const, icon: CreditCard },
  ];

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">Subscription Plans</h1>
            <p className="text-sm text-muted-foreground mt-1">Revenue analytics and subscriber management</p>
          </div>
          <Button onClick={() => navigate("/dashboard/admin/plans/manage")} className="bg-wj-green hover:bg-wj-green/90 gap-2">
            <Settings2 className="h-4 w-4" /> Manage Plans
          </Button>
        </motion.div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {kpiCards.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[300px]">
              <h3 className="text-sm font-medium text-foreground mb-4">Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={kpis.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--wj-green))" name="Revenue (€)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-[300px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Plan Adoption</h3>
              </div>
              <div className="space-y-4">
                {kpis.perPlan.map((p, index) => {
                  const pct = totalSubs > 0 ? (p.active_subs / totalSubs) * 100 : 0;
                  return (
                    <Link to={`/dashboard/admin/plans/${p.plan_id}`} key={p.plan_id} className="block space-y-1.5 hover:opacity-80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.active_subs} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-wj-green to-wj-green/60 rounded-full" />
                      </div>
                    </Link>
                  );
                })}
                {kpis.perPlan.length === 0 && (
                  <p className="text-xs text-muted-foreground">No plans yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
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
                  <TableHead className="text-muted-foreground text-xs">Period End</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      No subscribers yet. Create subscriptions to see them here.
                    </TableCell>
                  </TableRow>
                )}
                {subs.map((sub: any) => (
                  <TableRow key={sub.id} className="border-border/30 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/dashboard/admin/plans/subscriber/${sub.id}`)}>
                    <TableCell className="text-xs font-medium">{sub.profile?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sub.profile?.email ?? "—"}</TableCell>
                    <TableCell>{getPlanBadge(sub.plan_version?.plan?.name ?? "—")}</TableCell>
                    <TableCell className="text-xs">{sub.payment_method ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                    </TableCell>
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

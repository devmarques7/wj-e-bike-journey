import { useState } from "react";
import { motion } from "framer-motion";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit3, CheckCircle2, Users, Euro, History } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlanDetail, usePlans } from "@/hooks/plans/usePlansData";
import PlanFormModal from "@/components/dashboard/plans/PlanFormModal";

export default function AdminPlanDetail() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { planId } = useParams();
  const navigate = useNavigate();
  const { plan, versions, subscribers, loading, refetch } = usePlanDetail(planId);
  const { plans, refetch: refetchPlans } = usePlans();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const planRich = plans.find((p) => p.id === planId);
  const activeVersion = versions.find((v) => v.status === "active");
  const activeSubs = subscribers.filter((s: any) => s.status === "active");
  const mrr = activeSubs.reduce((sum: number, s: any) => {
    const v = versions.find((x) => x.id === s.plan_version_id);
    if (!v) return sum;
    const p = Number(v.price);
    return sum + (v.interval === "monthly" ? p : v.interval === "yearly" ? p / 12 : v.interval === "quarterly" ? p / 3 : 0);
  }, 0);

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {loading || !plan ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${plan.color_hex}20`, border: `1px solid ${plan.color_hex}40` }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: plan.color_hex ?? undefined }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-light">{plan.name}</h1>
                      {plan.is_active ? <Badge className="bg-wj-green/20 text-wj-green">Active</Badge> : <Badge variant="outline">Archived</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    {activeVersion && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Current version v{activeVersion.version_number} · €{Number(activeVersion.price).toFixed(2)} / {activeVersion.interval} · Trial {activeVersion.trial_days}d
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={() => setEditOpen(true)} className="gap-2 bg-wj-green hover:bg-wj-green/90">
                  <Edit3 className="h-4 w-4" /> Edit (new version)
                </Button>
              </div>
            </motion.div>

            <div className="grid grid-cols-12 gap-4 lg:gap-6">
              <div className="col-span-12 lg:col-span-4 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground">MRR</p>
                <p className="text-2xl font-light mt-1">€{mrr.toFixed(2)}</p>
              </div>
              <div className="col-span-6 lg:col-span-4 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-light mt-1">{activeSubs.length}</p>
              </div>
              <div className="col-span-6 lg:col-span-4 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground">Total Versions</p>
                <p className="text-2xl font-light mt-1">{versions.length}</p>
              </div>
            </div>

            <Tabs defaultValue="subscribers">
              <TabsList>
                <TabsTrigger value="subscribers"><Users className="h-3.5 w-3.5 mr-1" /> Subscribers</TabsTrigger>
                <TabsTrigger value="versions"><History className="h-3.5 w-3.5 mr-1" /> Versions</TabsTrigger>
                <TabsTrigger value="features"><Euro className="h-3.5 w-3.5 mr-1" /> Features</TabsTrigger>
              </TabsList>
              <TabsContent value="subscribers">
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Started</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">No subscribers yet.</TableCell></TableRow>}
                      {subscribers.map((s: any) => {
                        const v = versions.find((x) => x.id === s.plan_version_id);
                        return (
                          <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/dashboard/admin/plans/subscriber/${s.id}`)}>
                            <TableCell className="text-xs font-medium">{s.profile?.full_name ?? "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.profile?.email ?? "—"}</TableCell>
                            <TableCell className="text-xs">v{v?.version_number ?? "?"}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{s.status}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="versions">
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Version</TableHead><TableHead>Price</TableHead><TableHead>Interval</TableHead><TableHead>Status</TableHead><TableHead>Subscribers</TableHead><TableHead>Effective From</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((v) => {
                        const count = subscribers.filter((s: any) => s.plan_version_id === v.id).length;
                        return (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium">v{v.version_number}</TableCell>
                            <TableCell>€{Number(v.price).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{v.interval}</TableCell>
                            <TableCell>
                              {v.status === "active" ? <Badge className="bg-wj-green/20 text-wj-green">Active</Badge> : <Badge variant="outline">{v.status}</Badge>}
                            </TableCell>
                            <TableCell className="text-xs">{count}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(v.effective_from).toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="features">
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                  {activeVersion?.features?.length ? (
                    <ul className="space-y-2">
                      {activeVersion.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-wj-green" /> {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No features defined.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        <PlanFormModal open={editOpen} onOpenChange={setEditOpen} plan={planRich ?? null} onSaved={() => { refetch(); refetchPlans(); }} />
      </div>
    </AdminDashboardLayout>
  );
}
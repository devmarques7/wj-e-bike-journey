import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Repeat, XCircle, AlertTriangle } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSubscriberDetail, cancelSubscription } from "@/hooks/plans/usePlansData";
import RegisterManualPaymentModal from "@/components/dashboard/plans/RegisterManualPaymentModal";
import ChangePlanModal from "@/components/dashboard/plans/ChangePlanModal";
import { toast } from "sonner";

export default function AdminSubscriberDetail() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { subscriberId } = useParams();
  const navigate = useNavigate();
  const { subscription, payments, events, summary, loading, refetch } = useSubscriberDetail(subscriberId);
  const [payOpen, setPayOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const handleCancel = async () => {
    if (!subscriberId) return;
    if (!confirm("Cancel this subscription at period end?")) return;
    const { error } = await cancelSubscription(subscriberId, true);
    if (error) return toast.error(error.message);
    toast.success("Subscription will cancel at period end");
    refetch();
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {loading || !subscription ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-3xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-light">{subscription.profile?.full_name ?? "—"}</h1>
                  <p className="text-xs text-muted-foreground">{subscription.profile?.email}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{subscription.plan_version?.plan?.name}</Badge>
                    <Badge className={subscription.status === "active" ? "bg-wj-green/20 text-wj-green" : "bg-zinc-700 text-zinc-300"}>{subscription.status}</Badge>
                    {subscription.cancel_at_period_end && <Badge className="bg-amber-500/20 text-amber-400">Cancels at period end</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">LTV</p>
                    <p className="text-lg font-light">€{Number(summary?.lifetime_value ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Payments</p>
                    <p className="text-lg font-light">{summary?.payments_count ?? 0}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase">Churn Risk</p>
                    <p className={`text-lg font-light ${(summary?.churn_risk_score ?? 0) > 50 ? "text-red-400" : "text-wj-green"}`}>{summary?.churn_risk_score ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button size="sm" onClick={() => setPayOpen(true)} className="gap-1 bg-wj-green hover:bg-wj-green/90"><CreditCard className="h-3.5 w-3.5" /> Register Payment</Button>
                <Button size="sm" variant="outline" onClick={() => setChangeOpen(true)} className="gap-1"><Repeat className="h-3.5 w-3.5" /> Change Plan</Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1 text-red-400"><XCircle className="h-3.5 w-3.5" /> Cancel</Button>
              </div>
            </div>

            <Tabs defaultValue="payments">
              <TabsList>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="history">Plan History</TabsTrigger>
                <TabsTrigger value="notes"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Events</TabsTrigger>
              </TabsList>

              <TabsContent value="payments">
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Period</TableHead><TableHead>Notes</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">No payments yet.</TableCell></TableRow>}
                      {payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">{new Date(p.paid_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs font-medium">€{Number(p.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-xs">{p.method}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{p.status}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.period_start ? new Date(p.period_start).toLocaleDateString() : "—"} → {p.period_end ? new Date(p.period_end).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.notes ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 space-y-3">
                  {events.length === 0 && <p className="text-xs text-muted-foreground">No plan changes yet.</p>}
                  {events.filter((e: any) => ["created","upgraded","downgraded","canceled","reactivated"].includes(e.event_type)).map((e: any) => (
                    <div key={e.id} className="flex items-start gap-3 text-sm border-l-2 border-wj-green/50 pl-3">
                      <div>
                        <p className="font-medium capitalize">{e.event_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 space-y-2">
                  {events.length === 0 && <p className="text-xs text-muted-foreground">No events yet.</p>}
                  {events.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                      <span className="capitalize">{e.event_type}</span>
                      <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <RegisterManualPaymentModal
              open={payOpen}
              onOpenChange={setPayOpen}
              subscriptionId={subscription.id}
              defaultAmount={Number(subscription.plan_version?.price ?? 0)}
              onSaved={refetch}
            />
            <ChangePlanModal
              open={changeOpen}
              onOpenChange={setChangeOpen}
              subscriptionId={subscription.id}
              currentVersionId={subscription.plan_version_id}
              onSaved={refetch}
            />
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
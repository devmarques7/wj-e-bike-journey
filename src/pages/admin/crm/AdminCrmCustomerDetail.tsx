import { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Phone, MessageSquare, Mail, Calendar, StickyNote, ShoppingCart,
  Wrench, CreditCard, Star, ChevronLeft,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useCustomerProfile, markFollowupDone } from "@/hooks/crm/useCrmData";
import { LIFECYCLE_META, healthColor, initials, relativeTime } from "@/components/dashboard/crm/colors";
import LogContactSheet from "@/components/dashboard/crm/sheets/LogContactSheet";
import AddNoteSheet from "@/components/dashboard/crm/sheets/AddNoteSheet";
import SendMessageSheet from "@/components/dashboard/crm/sheets/SendMessageSheet";
import { toast } from "sonner";

type TimelineItem = {
  id: string;
  type: "interaction" | "note" | "appointment" | "payment";
  date: string;
  title: string;
  detail: string;
  icon: any;
};

export default function AdminCrmCustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { customer, notes, interactions, bikes, payments, appointments, loading, refetch } =
    useCustomerProfile(customerId);
  const [contactOpen, setContactOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  useEffect(() => {
    const a = params.get("action");
    if (a === "contact") setContactOpen(true);
    if (a === "note") setNoteOpen(true);
  }, [params]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("crm.view")) return <Navigate to="/dashboard" replace />;

  const timeline: TimelineItem[] = [
    ...interactions.map((i) => ({
      id: `i-${i.id}`,
      type: "interaction" as const,
      date: i.created_at,
      title: `${i.type === "call" ? "Chamada" : i.type === "whatsapp" ? "WhatsApp" : i.type === "email" ? "Email" : i.type === "in_person" ? "Presencial" : "Contacto"} — ${i.subject ?? "(sem assunto)"}`,
      detail: i.summary ?? "",
      icon: i.type === "call" ? Phone : i.type === "whatsapp" ? MessageSquare : i.type === "email" ? Mail : Phone,
    })),
    ...notes.map((n) => ({
      id: `n-${n.id}`,
      type: "note" as const,
      date: n.created_at,
      title: `Nota · ${n.note_type}`,
      detail: n.content,
      icon: StickyNote,
    })),
    ...appointments.map((a) => ({
      id: `a-${a.id}`,
      type: "appointment" as const,
      date: a.scheduled_date,
      title: `Agendamento · ${a.status}`,
      detail: a.notes ?? "",
      icon: Calendar,
    })),
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      type: "payment" as const,
      date: p.paid_at,
      title: `Pagamento €${p.amount}`,
      detail: `${p.method} · ${p.status}`,
      icon: CreditCard,
    })),
  ]
    .filter((t) => timelineFilter === "all" || t.type === timelineFilter)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const handleMarkFollowup = async (noteId: string) => {
    try {
      await markFollowupDone(noteId);
      toast.success("Follow-up concluído");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <Link to="/dashboard/admin/crm" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3 w-3 mr-1" /> Voltar ao CRM
        </Link>

        {loading && <p className="text-xs text-muted-foreground">A carregar...</p>}
        {!loading && !customer && <p className="text-xs text-muted-foreground">Cliente não encontrado.</p>}

        {customer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14"><AvatarFallback className="bg-wj-green/10 text-wj-green">{initials(customer.full_name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-medium truncate">{customer.full_name}</h1>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.plan_name && <Badge variant="outline" className="text-[10px]">{customer.plan_name}</Badge>}
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: LIFECYCLE_META[customer.lifecycle_stage].color, color: LIFECYCLE_META[customer.lifecycle_stage].color }}>
                        {LIFECYCLE_META[customer.lifecycle_stage].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">{customer.email}</p>
                    {customer.phone && <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button size="sm" className="bg-wj-green hover:bg-wj-green/90" onClick={() => setContactOpen(true)}>
                    <Phone className="h-3.5 w-3.5 mr-1.5" /> Contacto
                  </Button>
                  <Button size="sm" className="bg-wj-green hover:bg-wj-green/90" onClick={() => setNoteOpen(true)}>
                    <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Nota
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMsgOpen(true)}>
                    <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/dashboard/admin/workshop"><Calendar className="h-3.5 w-3.5 mr-1.5" /> Agendar</Link>
                  </Button>
                </div>
              </div>

              {/* Scores */}
              <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Scores</h3>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Health</span><span className="font-mono" style={{ color: healthColor(customer.health_score) }}>{customer.health_score}</span></div>
                  <Progress value={customer.health_score} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Churn Risk</span><span className="font-mono text-red-400">{customer.churn_risk_score}</span></div>
                  <Progress value={customer.churn_risk_score} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>RFM</span><span className="font-mono">{customer.rfm_score}/15</span></div>
                  <Progress value={(customer.rfm_score / 15) * 100} className="h-1.5" />
                </div>
              </div>

              <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total gasto</span><span className="font-mono">€{Number(customer.total_spent).toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">LTV estimado</span><span className="font-mono">€{Number(customer.ltv_estimated).toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Último contacto</span><span>{relativeTime(customer.last_contact_at)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bikes</span><span>{bikes.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Notas</span><span>{customer.notes_count}</span></div>
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              )}
            </aside>

            {/* Main */}
            <section className="col-span-12 lg:col-span-8">
              <Tabs defaultValue="timeline">
                <TabsList className="bg-background/60 backdrop-blur-md">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="bikes">Bikes</TabsTrigger>
                  <TabsTrigger value="subscription">Assinatura</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-4 space-y-4">
                  <ToggleGroup type="single" value={timelineFilter} onValueChange={(v) => v && setTimelineFilter(v)}>
                    <ToggleGroupItem value="all" className="text-xs">Todos</ToggleGroupItem>
                    <ToggleGroupItem value="interaction" className="text-xs">Contactos</ToggleGroupItem>
                    <ToggleGroupItem value="note" className="text-xs">Notas</ToggleGroupItem>
                    <ToggleGroupItem value="appointment" className="text-xs">Agendamentos</ToggleGroupItem>
                    <ToggleGroupItem value="payment" className="text-xs">Pagamentos</ToggleGroupItem>
                  </ToggleGroup>
                  {timeline.length === 0 && <p className="text-xs text-muted-foreground p-4">Sem actividade.</p>}
                  <div className="space-y-2">
                    {timeline.map((t) => {
                      const Icon = t.icon;
                      return (
                        <div key={t.id} className="flex gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-md border border-border/30">
                          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{t.title}</p>
                              <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(t.date)}</span>
                            </div>
                            {t.detail && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.detail}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="bikes" className="mt-4">
                  {bikes.length === 0 && <p className="text-xs text-muted-foreground p-4">Sem bikes registadas.</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bikes.map((b) => (
                      <div key={b.id} className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{b.model}</h4>
                          {b.is_active ? <Badge className="bg-wj-green/20 text-wj-green text-[10px]">Activo</Badge> : <Badge variant="outline" className="text-[10px]">Inactivo</Badge>}
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs mt-3">
                          <dt className="text-muted-foreground">Série</dt><dd>{b.serial ?? "—"}</dd>
                          <dt className="text-muted-foreground">Cor</dt><dd>{b.color ?? "—"}</dd>
                          <dt className="text-muted-foreground">Km</dt><dd className="font-mono">{b.km}</dd>
                          <dt className="text-muted-foreground">Última revisão</dt><dd>{relativeTime(b.last_service_at)}</dd>
                        </dl>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="mt-4">
                  <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                    <p className="text-sm">Plano activo: <strong>{customer.plan_name ?? "—"}</strong></p>
                    <p className="text-xs text-muted-foreground mt-2">Mais detalhes virão da gestão de planos.</p>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="mt-4">
                  <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5">
                    <h3 className="text-sm font-medium mb-3">Pagamentos</h3>
                    {payments.length === 0 && <p className="text-xs text-muted-foreground">Sem pagamentos.</p>}
                    <div className="divide-y divide-border/20">
                      {payments.map((p: any) => (
                        <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                          <span>{new Date(p.paid_at).toLocaleDateString()}</span>
                          <Badge variant="outline" className="text-[10px]">{p.method}</Badge>
                          <span className="font-mono">€{Number(p.amount).toFixed(2)}</span>
                          <Badge className="text-[10px]">{p.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4 space-y-2">
                  <div className="flex justify-end">
                    <Button size="sm" className="bg-wj-green hover:bg-wj-green/90" onClick={() => setNoteOpen(true)}>+ Adicionar nota</Button>
                  </div>
                  {notes.length === 0 && <p className="text-xs text-muted-foreground p-4">Sem notas.</p>}
                  {notes.map((n) => (
                    <div key={n.id} className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{n.note_type}</Badge>
                          {n.is_pinned && <Star className="h-3 w-3 text-wj-green fill-wj-green" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{relativeTime(n.created_at)}</span>
                      </div>
                      <p className="text-sm">{n.content}</p>
                      {n.followup_date && !n.followup_done && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                          <span className="text-[11px] text-orange-400">Follow-up: {n.followup_date}</span>
                          <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => handleMarkFollowup(n.id)}>Marcar feito ✓</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </section>
          </motion.div>
        )}
      </div>

      {customer && (
        <>
          <LogContactSheet open={contactOpen} onClose={() => setContactOpen(false)} customerId={customer.id} customerName={customer.full_name ?? undefined} onLogged={refetch} />
          <AddNoteSheet open={noteOpen} onClose={() => setNoteOpen(false)} customerId={customer.id} customerName={customer.full_name ?? undefined} onLogged={refetch} />
          <SendMessageSheet open={msgOpen} onClose={() => setMsgOpen(false)} customerName={customer.full_name ?? undefined} customerEmail={customer.email} customerPhone={customer.phone} />
        </>
      )}
    </AdminDashboardLayout>
  );
}
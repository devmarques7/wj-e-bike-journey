import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Plus,
  ListChecks,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSchedulingData, type AppointmentRow } from "@/hooks/scheduling/useSchedulingData";
import BookAppointmentDialog from "@/components/dashboard/scheduling/BookAppointmentDialog";
import QualityControlManagerDialog from "@/components/dashboard/scheduling/QualityControlManagerDialog";
import QualityControlPreviewCard from "@/components/dashboard/scheduling/QualityControlPreviewCard";
import ServiceTypesManagerDialog from "@/components/dashboard/scheduling/ServiceTypesManagerDialog";
import AppointmentActionsMenu from "@/components/dashboard/scheduling/AppointmentActionsMenu";
import AppointmentCompletionDrawer from "@/components/dashboard/scheduling/AppointmentCompletionDrawer";
import FloatingActiveAppointment from "@/components/dashboard/scheduling/FloatingActiveAppointment";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatRelative = (iso: string | null) => {
  if (!iso) return "Sem registo";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `há ${days}d`;
};

const formatAbsolute = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  // Padronização duotone monocromática:
  // verde → concluído/confirmado · amarelo → atenção · vermelho → erro · neutro → resto
  const base = "border font-normal text-[10px] gap-1 pl-1.5 pr-2 py-0.5";
  const dot = "inline-block w-1.5 h-1.5 rounded-full";
  switch (status) {
    case "completed":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-wj-green`} /> Concluído
        </Badge>
      );
    case "confirmed":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-wj-green/70`} /> Confirmado
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-wj-green animate-pulse`} /> Em curso
        </Badge>
      );
    case "pending":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-amber-400`} /> Pendente
        </Badge>
      );
    case "rescheduled":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-amber-400`} /> Reagendado
        </Badge>
      );
    case "canceled":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-red-500`} /> Cancelado
        </Badge>
      );
    case "no_show":
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-red-500/70`} /> No-show
        </Badge>
      );
    default:
      return (
        <Badge className={`${base} bg-muted/30 text-foreground/80 border-border/40`}>
          <span className={`${dot} bg-muted-foreground/60`} /> {status}
        </Badge>
      );
  }
};

function LiveElapsed({ since }: { since: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const startMs = new Date(since).getTime();
  const s = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const text = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-mono text-blue-300 tabular-nums">
      <Clock className="h-2.5 w-2.5" />
      {text}
    </span>
  );
}

export default function AdminWorkshop() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("day");
  const [bookOpen, setBookOpen] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [completionTarget, setCompletionTarget] = useState<AppointmentRow | null>(null);
  const {
    loading,
    appointments,
    serviceTypes,
    mechanics,
    updateAppointmentStatus,
    updateAppointmentFields,
    rescheduleAppointment,
    cancelAppointment,
    deleteAppointment,
    refetch,
  } = useSchedulingData();

  // Service type usage ranking (today) — must be before any early returns
  const serviceUsage = useMemo(() => {
    const counts = new Map<string, number>();
    appointments.forEach((a) => {
      if (!a.service_type_id) return;
      counts.set(a.service_type_id, (counts.get(a.service_type_id) ?? 0) + 1);
    });
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
    return serviceTypes
      .map((st) => {
        const count = counts.get(st.id) ?? 0;
        return { id: st.id, name: st.name, color: st.color, count, percentage: Math.round((count / total) * 100) };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [appointments, serviceTypes]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const totalToday = appointments.length;
  const inProgress = appointments.filter((a) => a.status === "in_progress").length;
  const activeAppointment =
    appointments.find((a) => a.status === "in_progress" && a.work_started_at) ?? null;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const durs = appointments.filter((a) => a.duration_minutes);
  const avgDuration = durs.length
    ? durs.reduce((acc, a) => acc + (a.duration_minutes ?? 0), 0) / durs.length
    : 0;

  const workshopKPIs = [
    { label: "Agendamentos Hoje", value: String(totalToday), change: "", trend: "up" as const, icon: Calendar },
    { label: "Em Curso", value: String(inProgress), change: "", trend: "up" as const, icon: Wrench },
    { label: "Concluídos Hoje", value: String(completed), change: "", trend: "up" as const, icon: CheckCircle2 },
    { label: "Duração Média", value: `${Math.round(avgDuration)}m`, change: "", trend: "up" as const, icon: Clock },
  ];

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">Oficina</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agendamentos de serviço e diagnóstico em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setServicesOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 border-border/40"
            >
              <Wrench className="h-4 w-4 mr-1" />
              Serviços
            </Button>
            <Button
              onClick={() => setQcOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 border-border/40"
            >
              <ListChecks className="h-4 w-4 mr-1" />
              Controlo de Qualidade
            </Button>
            <Button
              onClick={() => setBookOpen(true)}
              className="bg-wj-green hover:bg-wj-green/90 text-black h-9"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Agendamento
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {workshopKPIs.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Quality Control sequence */}
        <QualityControlPreviewCard onEdit={() => setQcOpen(true)} />

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Appointments Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border/30">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Agendamentos</h3>
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="day" className="text-xs">Hoje</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs" disabled>Semana</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs" disabled>Mês</TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> A carregar agendamentos…
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Sem agendamentos para hoje.
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium w-[80px]">Hora</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Cliente</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Plano</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Serviço</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Mecânico</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium text-right w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow
                        key={apt.id}
                        className="border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="text-xs font-medium align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums">{apt.scheduled_start_time.slice(0, 5)}</span>
                            {apt.priority === "vip" && (
                              <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30">VIP</Badge>
                            )}
                            {apt.priority === "emergency" && (
                              <Badge className="text-[9px] h-4 px-1.5 bg-red-500/15 text-red-400 border-red-500/30">SOS</Badge>
                            )}
                          </div>
                          {apt.duration_minutes ? (
                            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                              {apt.duration_minutes}min
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs align-middle">
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border border-border/30 cursor-default">
                                  <AvatarFallback className="text-[10px] bg-muted/50">
                                    {(apt.customer_name ?? apt.customer_email ?? "?")
                                      .split(" ")
                                      .map((s) => s[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">{apt.customer_name ?? "—"}</div>
                                {apt.customer_email && (
                                  <div className="text-muted-foreground text-[10px]">{apt.customer_email}</div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="align-middle">
                          {apt.plan_name ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{
                                color: apt.plan_color ?? "#9ca3af",
                                borderColor: `${apt.plan_color ?? "#9ca3af"}40`,
                                backgroundColor: `${apt.plan_color ?? "#9ca3af"}15`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: apt.plan_color ?? "#9ca3af" }}
                              />
                              {apt.plan_name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">Sem plano</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-1.5 h-6 rounded-full shrink-0"
                              style={{ backgroundColor: apt.service_color ?? "#9ca3af" }}
                            />
                            <span className="truncate">{apt.service_name ?? "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground align-middle">
                          {apt.mechanic_name ?? (
                            <span className="text-muted-foreground/60 italic">Não atribuído</span>
                          )}
                        </TableCell>
                        <TableCell className="align-middle">
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-default">{getStatusBadge(apt.status)}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">{formatRelative(apt.updated_at)}</span>
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                  Última alteração: {formatAbsolute(apt.updated_at)}
                                </div>
                                {apt.work_started_at && (
                                  <div className="text-muted-foreground text-[10px]">
                                    Iniciado: {formatAbsolute(apt.work_started_at)}
                                  </div>
                                )}
                                {apt.work_ended_at && (
                                  <div className="text-muted-foreground text-[10px]">
                                    Concluído: {formatAbsolute(apt.work_ended_at)}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <AppointmentActionsMenu
                            appointment={apt}
                            mechanics={mechanics}
                            serviceTypes={serviceTypes}
                            onStart={() => updateAppointmentStatus(apt.id, "in_progress")}
                            onComplete={() => setCompletionTarget(apt)}
                            onUpdateFields={updateAppointmentFields}
                            onReschedule={rescheduleAppointment}
                            onCancel={cancelAppointment}
                            onDelete={deleteAppointment}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </div>
            </motion.div>
          </div>

          {/* Service usage ranking - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-foreground">Serviços do Dia</h3>
              </div>

              {serviceUsage.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados para hoje.</p>
              ) : (
                <div className="space-y-3">
                  {serviceUsage.map((problem, index) => (
                    <div key={problem.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-wj-green/20 text-wj-green text-[10px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs text-foreground">{problem.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{problem.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${problem.percentage}%` }}
                          transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: problem.color ?? "hsl(var(--primary))" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-border/30 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Catálogo de serviços
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-2xl font-light">{serviceTypes.length}</span>{" "}
                    <span className="text-xs text-muted-foreground">tipos ativos</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-border/40"
                  onClick={() => setServicesOpen(true)}
                >
                  <Wrench className="h-3.5 w-3.5 mr-1" />
                  Gerir serviços
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        <BookAppointmentDialog
          open={bookOpen}
          onOpenChange={setBookOpen}
          serviceTypes={serviceTypes}
          onCreated={refetch}
        />

        <QualityControlManagerDialog open={qcOpen} onOpenChange={setQcOpen} />

        <ServiceTypesManagerDialog open={servicesOpen} onOpenChange={(v) => {
          setServicesOpen(v);
          if (!v) refetch();
        }} />

        <AppointmentCompletionDrawer
          appointment={completionTarget}
          open={!!completionTarget}
          onOpenChange={(v) => { if (!v) setCompletionTarget(null); }}
          onCompleted={() => { setCompletionTarget(null); refetch(); }}
        />

        <FloatingActiveAppointment
          appointment={activeAppointment}
          onOpen={() => activeAppointment && setCompletionTarget(activeAppointment)}
        />
      </div>
    </AdminDashboardLayout>
  );
}

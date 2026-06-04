import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  PlayCircle,
  CheckCircle,
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
import { useSchedulingData } from "@/hooks/scheduling/useSchedulingData";
import BookAppointmentDialog from "@/components/dashboard/scheduling/BookAppointmentDialog";
import QualityControlManagerDialog from "@/components/dashboard/scheduling/QualityControlManagerDialog";
import QualityControlPreviewCard from "@/components/dashboard/scheduling/QualityControlPreviewCard";
import ServiceTypesManagerDialog from "@/components/dashboard/scheduling/ServiceTypesManagerDialog";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30">Concluído</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em curso</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendente</Badge>;
    case "confirmed":
      return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Confirmado</Badge>;
    case "canceled":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
    case "no_show":
      return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">No-show</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminWorkshop() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("day");
  const [bookOpen, setBookOpen] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { loading, appointments, serviceTypes, updateAppointmentStatus, refetch } = useSchedulingData();

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
                      <TableHead className="text-muted-foreground text-xs">Hora</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Serviço</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Mecânico</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Estado</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">
                          {apt.scheduled_start_time.slice(0, 5)}
                          {apt.priority === "vip" && (
                            <Badge className="ml-1 text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">VIP</Badge>
                          )}
                          {apt.priority === "emergency" && (
                            <Badge className="ml-1 text-[9px] bg-red-500/20 text-red-400 border-red-500/30">!</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {apt.customer_name ?? apt.customer_email ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                            style={{ backgroundColor: apt.service_color ?? "#9ca3af" }}
                          />
                          {apt.service_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{apt.mechanic_name ?? "—"}</TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell className="text-right">
                          {apt.status === "confirmed" || apt.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => updateAppointmentStatus(apt.id, "in_progress")}
                            >
                              <PlayCircle className="h-3 w-3 mr-1" /> Iniciar
                            </Button>
                          ) : apt.status === "in_progress" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[10px] text-wj-green"
                              onClick={() => updateAppointmentStatus(apt.id, "completed")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                            </Button>
                          ) : null}
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

              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Catálogo de serviços
                </p>
                <p className="text-sm text-foreground">
                  <span className="text-2xl font-light">{serviceTypes.length}</span>{" "}
                  <span className="text-xs text-muted-foreground">tipos ativos</span>
                </p>
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
      </div>
    </AdminDashboardLayout>
  );
}

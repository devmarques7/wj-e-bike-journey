import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Bike
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const workshopKPIs = [
  {
    label: "Today's Appointments",
    value: "24",
    change: "+4",
    trend: "up" as const,
    icon: Calendar,
  },
  {
    label: "In Progress",
    value: "8",
    change: "+2",
    trend: "up" as const,
    icon: Wrench,
  },
  {
    label: "Completed Today",
    value: "12",
    change: "+3",
    trend: "up" as const,
    icon: CheckCircle2,
  },
  {
    label: "Avg. Service Time",
    value: "2.4h",
    change: "-15min",
    trend: "up" as const,
    icon: Clock,
  },
];

const appointments = [
  { id: 1, customer: "Jan van der Berg", bike: "V8 Sport", service: "Full Tune-Up", status: "in_progress", time: "09:00", mechanic: "Tom" },
  { id: 2, customer: "Emma de Vries", bike: "V8 Comfort", service: "Brake Replacement", status: "pending", time: "10:30", mechanic: "Lisa" },
  { id: 3, customer: "Lucas Jansen", bike: "V8 Urban", service: "Chain & Gear", status: "completed", time: "08:00", mechanic: "Mark" },
  { id: 4, customer: "Sophie Bakker", bike: "V8 Sport", service: "Battery Check", status: "pending", time: "11:00", mechanic: "Tom" },
  { id: 5, customer: "Daan Visser", bike: "V8 Cargo", service: "Wheel Alignment", status: "in_progress", time: "09:30", mechanic: "Lisa" },
  { id: 6, customer: "Fleur Smit", bike: "V8 Urban", service: "Full Tune-Up", status: "completed", time: "07:30", mechanic: "Mark" },
  { id: 7, customer: "Sem de Jong", bike: "V8 Sport", service: "Motor Service", status: "pending", time: "13:00", mechanic: "Tom" },
  { id: 8, customer: "Lotte Mulder", bike: "V8 Comfort", service: "Display Repair", status: "pending", time: "14:00", mechanic: "Lisa" },
];

const bikeProblems = [
  { type: "Brake Issues", count: 45, percentage: 28, trend: "up" },
  { type: "Chain & Gear", count: 38, percentage: 24, trend: "stable" },
  { type: "Battery Problems", count: 32, percentage: 20, trend: "down" },
  { type: "Motor Service", count: 25, percentage: 16, trend: "up" },
  { type: "Display/Electronics", count: 20, percentage: 12, trend: "stable" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30">Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminWorkshop() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("day");

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
          <h1 className="text-xl sm:text-2xl font-light text-foreground">Workshop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Service appointments and bike diagnostics
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {workshopKPIs.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

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
                    <h3 className="text-sm font-medium text-foreground">Appointments</h3>
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                      <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Time</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Customer</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Bike</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Service</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Mechanic</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{apt.time}</TableCell>
                        <TableCell className="text-xs">{apt.customer}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{apt.bike}</TableCell>
                        <TableCell className="text-xs">{apt.service}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{apt.mechanic}</TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </div>

          {/* Bike Problems Ranking - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-foreground">Common Issues</h3>
              </div>
              
              <div className="space-y-3">
                {bikeProblems.map((problem, index) => (
                  <div key={problem.type} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-wj-green/20 text-wj-green text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs text-foreground">{problem.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{problem.count}</span>
                        {problem.trend === "up" && (
                          <TrendingUp className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${problem.percentage}%` }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-wj-green to-wj-green/60 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bike className="h-4 w-4" />
                  <span>V8 Sport most serviced this month</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

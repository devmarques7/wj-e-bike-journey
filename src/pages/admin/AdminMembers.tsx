import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Star, 
  Trophy,
  Clock,
  Calendar,
  ThumbsUp,
  Wrench,
  TrendingUp
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const staffKPIs = [
  {
    label: "Team Members",
    value: "12",
    change: "+2",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Avg. Rating",
    value: "4.8",
    change: "+0.2",
    trend: "up" as const,
    icon: Star,
  },
  {
    label: "Services This Week",
    value: "87",
    change: "+15%",
    trend: "up" as const,
    icon: Wrench,
  },
  {
    label: "Avg. Service Time",
    value: "2.1h",
    change: "-12min",
    trend: "up" as const,
    icon: Clock,
  },
];

const staffMembers = [
  { id: 1, name: "Tom Hendriks", role: "Senior Mechanic", rating: 4.9, reviews: 156, servicesWeek: 12, appointmentsWeek: 15, hoursWeek: 42, avatar: "TH" },
  { id: 2, name: "Lisa van Dijk", role: "Mechanic", rating: 4.8, reviews: 124, servicesWeek: 10, appointmentsWeek: 12, hoursWeek: 40, avatar: "LV" },
  { id: 3, name: "Mark de Boer", role: "Junior Mechanic", rating: 4.7, reviews: 89, servicesWeek: 8, appointmentsWeek: 10, hoursWeek: 38, avatar: "MB" },
  { id: 4, name: "Eva Bakker", role: "Trainee", rating: 4.6, reviews: 45, servicesWeek: 5, appointmentsWeek: 6, hoursWeek: 32, avatar: "EB" },
  { id: 5, name: "Jan Smit", role: "Sales Manager", rating: 4.9, reviews: 98, servicesWeek: 0, appointmentsWeek: 8, hoursWeek: 45, avatar: "JS" },
  { id: 6, name: "Anna de Jong", role: "Customer Service", rating: 4.8, reviews: 210, servicesWeek: 0, appointmentsWeek: 25, hoursWeek: 40, avatar: "AJ" },
];

const topPerformers = [
  { name: "Tom Hendriks", metric: "Most Services", value: "12 this week", avatar: "TH" },
  { name: "Anna de Jong", metric: "Best Feedback", value: "4.9 rating", avatar: "AJ" },
  { name: "Jan Smit", metric: "Most Hours", value: "45h worked", avatar: "JS" },
  { name: "Lisa van Dijk", metric: "Most Appointments", value: "15 scheduled", avatar: "LV" },
];

const getRoleBadge = (role: string) => {
  switch (role) {
    case "Senior Mechanic":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 text-[10px]">Senior</Badge>;
    case "Mechanic":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Mechanic</Badge>;
    case "Junior Mechanic":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Junior</Badge>;
    case "Trainee":
      return <Badge variant="outline" className="text-[10px]">Trainee</Badge>;
    case "Sales Manager":
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">Sales</Badge>;
    case "Customer Service":
      return <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-[10px]">Support</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{role}</Badge>;
  }
};

export default function AdminMembers() {
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
          <h1 className="text-xl sm:text-2xl font-light text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Team performance and rankings
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {staffKPIs.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Staff Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border/30">
                <h3 className="text-sm font-medium text-foreground">Team Members</h3>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Member</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Role</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Rating</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Services</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Upcoming</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => (
                      <TableRow key={staff.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-wj-green/20 text-wj-green text-[10px] font-bold">
                                {staff.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{staff.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(staff.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs">{staff.rating}</span>
                            <span className="text-[10px] text-muted-foreground">({staff.reviews})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{staff.servicesWeek}/week</TableCell>
                        <TableCell className="text-xs">{staff.appointmentsWeek}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{staff.hoursWeek}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </div>

          {/* Rankings - 4 columns */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-foreground">Top Performers</h3>
              </div>
              
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <motion.div
                    key={performer.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      index === 0 ? "bg-amber-400/20 text-amber-400" :
                      index === 1 ? "bg-zinc-400/20 text-zinc-400" :
                      index === 2 ? "bg-orange-400/20 text-orange-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-wj-green/20 text-wj-green text-[10px] font-bold">
                        {performer.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{performer.name}</p>
                      <p className="text-[10px] text-muted-foreground">{performer.metric}</p>
                    </div>
                    <span className="text-[10px] text-wj-green font-medium">{performer.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Weekly Stats</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <ThumbsUp className="h-5 w-5 text-wj-green mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">94%</p>
                  <p className="text-[10px] text-muted-foreground">Satisfaction</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <Calendar className="h-5 w-5 text-wj-green mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">87</p>
                  <p className="text-[10px] text-muted-foreground">Appointments</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

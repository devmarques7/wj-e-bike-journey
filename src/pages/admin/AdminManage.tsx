import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Settings, 
  Users, 
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const teamMembers = [
  { id: 1, name: "Tom Hendriks", role: "Senior Mechanic", appointments: 8, capacity: 10, avatar: "TH" },
  { id: 2, name: "Lisa van Dijk", role: "Mechanic", appointments: 6, capacity: 8, avatar: "LV" },
  { id: 3, name: "Mark de Boer", role: "Junior Mechanic", appointments: 5, capacity: 6, avatar: "MB" },
  { id: 4, name: "Eva Bakker", role: "Trainee", appointments: 3, capacity: 4, avatar: "EB" },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const defaultHours = {
  monday: { open: true, start: "09:00", end: "18:00" },
  tuesday: { open: true, start: "09:00", end: "18:00" },
  wednesday: { open: true, start: "09:00", end: "18:00" },
  thursday: { open: true, start: "09:00", end: "21:00" },
  friday: { open: true, start: "09:00", end: "18:00" },
  saturday: { open: true, start: "10:00", end: "17:00" },
  sunday: { open: false, start: "10:00", end: "16:00" },
};

export default function AdminManage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [hours, setHours] = useState(defaultHours);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleDay = (day: keyof typeof hours) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
  };

  const updateTime = (day: keyof typeof hours, field: 'start' | 'end', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const totalCapacity = teamMembers.reduce((acc, m) => acc + m.capacity, 0);
  const totalAppointments = teamMembers.reduce((acc, m) => acc + m.appointments, 0);
  const workloadPercentage = Math.round((totalAppointments / totalCapacity) * 100);

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header with Settings Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">Schedule Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Team workload and opening hours
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Opening Hours</span>
          </Button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Workload Overview - 8 columns */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Workload Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-wj-green" />
                  <h3 className="text-sm font-medium text-foreground">Weekly Workload</h3>
                </div>
                <Badge className={cn(
                  "text-xs",
                  workloadPercentage > 80 
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : workloadPercentage > 60
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-wj-green/20 text-wj-green border-wj-green/30"
                )}>
                  {workloadPercentage}% Capacity
                </Badge>
              </div>
              
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${workloadPercentage}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className={cn(
                    "h-full rounded-full",
                    workloadPercentage > 80 
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : workloadPercentage > 60
                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                      : "bg-gradient-to-r from-wj-green to-wj-green/60"
                  )}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{totalAppointments} appointments</span>
                <span>{totalCapacity} capacity</span>
              </div>
            </motion.div>

            {/* Team Members Workload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Team Workload</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamMembers.map((member, index) => {
                  const memberLoad = Math.round((member.appointments / member.capacity) * 100);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-muted/30 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-wj-green/20 text-wj-green text-xs font-bold flex items-center justify-center">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground">{member.role}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {member.appointments}/{member.capacity}
                        </Badge>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            memberLoad > 80 
                              ? "bg-red-500"
                              : memberLoad > 60
                              ? "bg-amber-500"
                              : "bg-wj-green"
                          )}
                          style={{ width: `${memberLoad}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Weekly Schedule Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <h3 className="text-sm font-medium text-foreground mb-4">Week Overview</h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayKey = day.toLowerCase() === "mon" ? "monday" 
                    : day.toLowerCase() === "tue" ? "tuesday"
                    : day.toLowerCase() === "wed" ? "wednesday"
                    : day.toLowerCase() === "thu" ? "thursday"
                    : day.toLowerCase() === "fri" ? "friday"
                    : day.toLowerCase() === "sat" ? "saturday"
                    : "sunday";
                  const dayHours = hours[dayKey as keyof typeof hours];
                  const appointments = [3, 5, 4, 6, 4, 2, 0][index];
                  
                  return (
                    <div 
                      key={day}
                      className={cn(
                        "p-3 rounded-xl text-center transition-all",
                        dayHours.open 
                          ? "bg-muted/50 hover:bg-muted/70" 
                          : "bg-muted/20 opacity-50"
                      )}
                    >
                      <p className="text-xs font-medium text-foreground">{day}</p>
                      {dayHours.open ? (
                        <>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {dayHours.start.replace(":00", "")}-{dayHours.end.replace(":00", "")}
                          </p>
                          <div className="mt-2 flex flex-col items-center gap-1">
                            {[...Array(Math.min(appointments, 4))].map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-wj-green" />
                            ))}
                            {appointments > 4 && (
                              <span className="text-[8px] text-muted-foreground">+{appointments - 4}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-1">Closed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Calendar - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Calendar</h3>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Opening Hours Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Opening Hours</DialogTitle>
            <DialogDescription>
              Configure workshop operating hours for each day
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {Object.entries(hours).map(([day, config]) => (
              <div 
                key={day} 
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all",
                  config.open ? "bg-muted/50" : "bg-muted/20"
                )}
              >
                <Switch
                  checked={config.open}
                  onCheckedChange={() => toggleDay(day as keyof typeof hours)}
                />
                <span className="w-24 text-sm font-medium capitalize text-foreground">
                  {day}
                </span>
                {config.open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={config.start}
                      onChange={(e) => updateTime(day as keyof typeof hours, 'start', e.target.value)}
                      className="bg-muted px-2 py-1 rounded text-xs text-foreground"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <input
                      type="time"
                      value={config.end}
                      onChange={(e) => updateTime(day as keyof typeof hours, 'end', e.target.value)}
                      className="bg-muted px-2 py-1 rounded text-xs text-foreground"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-wj-green hover:bg-wj-green/90" onClick={() => setShowSettings(false)}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

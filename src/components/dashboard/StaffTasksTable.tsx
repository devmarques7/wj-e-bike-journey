import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  Bike, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Crown,
  Star,
  ChevronDown,
  Wrench
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import StaffServiceModal, { type ActiveServiceState } from "./StaffServiceModal";
import ActiveServiceBar from "./ActiveServiceBar";
import { AnimatePresence as ServiceBarPresence } from "framer-motion";

// Mock tasks data
const tasksData = [
  {
    id: 1,
    bikeId: "V8-2024-NL-00421",
    bikeName: "WJ Vision V8 Sport",
    owner: "Emma van der Berg",
    ownerEmail: "emma@mail.com",
    health: 72,
    memberPlan: "plus",
    status: "in_progress",
    service: "Brake Adjustment",
    scheduledTime: "09:30",
    estimatedTime: "45 min",
    priority: "high",
    notes: "Customer reported squeaking brakes. Check pads and adjust cables.",
    photos: ["/placeholder.svg"],
    chat: [
      { from: "owner", message: "Brakes have been making noise for a week", time: "09:00" },
      { from: "mechanic", message: "I'll check the pads and cables right away", time: "09:35" },
    ]
  },
  {
    id: 2,
    bikeId: "V8-2024-NL-00892",
    bikeName: "WJ Vision V8 Urban",
    owner: "Lucas de Vries",
    ownerEmail: "lucas@mail.com",
    health: 85,
    memberPlan: "black",
    status: "pending",
    service: "Full Service",
    scheduledTime: "11:00",
    estimatedTime: "2h",
    priority: "medium",
    notes: "Annual full service. Check all components and update firmware.",
    photos: [],
    chat: []
  },
  {
    id: 3,
    bikeId: "V8-2024-NL-00156",
    bikeName: "WJ Vision V8 Comfort",
    owner: "Sophie Jansen",
    ownerEmail: "sophie@mail.com",
    health: 95,
    memberPlan: "light",
    status: "completed",
    service: "Battery Check",
    scheduledTime: "08:00",
    estimatedTime: "30 min",
    priority: "low",
    notes: "Routine battery inspection. All parameters normal.",
    photos: ["/placeholder.svg", "/placeholder.svg"],
    chat: [
      { from: "mechanic", message: "Battery is in excellent condition!", time: "08:30" },
    ]
  },
  {
    id: 4,
    bikeId: "V8-2024-NL-00723",
    bikeName: "WJ Vision V8 Sport",
    owner: "Thomas Bakker",
    ownerEmail: "thomas@mail.com",
    health: 65,
    memberPlan: "plus",
    status: "pending",
    service: "Wheel Truing",
    scheduledTime: "14:00",
    estimatedTime: "1h",
    priority: "high",
    notes: "Rear wheel wobble detected. Customer priority member.",
    photos: [],
    chat: []
  },
  {
    id: 5,
    bikeId: "V8-2024-NL-00445",
    bikeName: "WJ Vision V8 Urban",
    owner: "Anna Visser",
    ownerEmail: "anna@mail.com",
    health: 78,
    memberPlan: "light",
    status: "pending",
    service: "Chain Replacement",
    scheduledTime: "15:30",
    estimatedTime: "45 min",
    priority: "medium",
    notes: "Chain stretch detected during last inspection.",
    photos: [],
    chat: []
  },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-wj-green", bg: "bg-wj-green/20", label: "Completed" },
  in_progress: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/20", label: "In Progress" },
  pending: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/50", label: "Pending" },
};

const planConfig = {
  light: { label: "Light", color: "bg-slate-500/20 text-slate-400", icon: null },
  plus: { label: "Plus", color: "bg-blue-500/20 text-blue-400", icon: Star },
  black: { label: "Black", color: "bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-400", icon: Crown },
};

const getHealthTag = (health: number) => {
  if (health >= 80) return { label: "Good", color: "bg-wj-green/20 text-wj-green" };
  if (health >= 60) return { label: "Fair", color: "bg-amber-500/20 text-amber-400" };
  return { label: "Poor", color: "bg-destructive/20 text-destructive" };
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

// Sort tasks by scheduled time
const sortedTasksData = [...tasksData].sort((a, b) => {
  const timeA = a.scheduledTime.replace(":", "");
  const timeB = b.scheduledTime.replace(":", "");
  return parseInt(timeA) - parseInt(timeB);
});

const repairStepsLabels = ["Inspection", "Diagnosis", "Repair", "Testing", "Quality"];

export default function StaffTasksTable() {
  const [selectedTask, setSelectedTask] = useState<typeof tasksData[0] | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [minimizedService, setMinimizedService] = useState<ActiveServiceState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const completedCount = tasksData.filter(t => t.status === "completed").length;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/30 bg-background/60 backdrop-blur-md overflow-hidden h-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-wj-green/10 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-wj-green" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Today's Tasks</h3>
                <p className="text-[10px] text-muted-foreground">Manage your service queue</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-wj-green/30 text-wj-green">
              {completedCount}/{tasksData.length} done
            </Badge>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Time</TableHead>
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Bike</TableHead>
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Owner</TableHead>
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Health</TableHead>
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Service</TableHead>
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasksData.map((task, index) => {
                const status = statusConfig[task.status as keyof typeof statusConfig];
                const healthTag = getHealthTag(task.health);
                const plan = planConfig[task.memberPlan as keyof typeof planConfig];
                const PlanIcon = plan.icon;
                
                return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border-border/30 hover:bg-muted/30"
                  >
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{task.scheduledTime}</p>
                        <p className="text-[10px] text-muted-foreground">{task.estimatedTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-wj-green/10 flex items-center justify-center">
                          <Bike className="h-3.5 w-3.5 text-wj-green" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{task.bikeName.split(" ").slice(-2).join(" ")}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{task.bikeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-wj-green/50 transition-all">
                            <AvatarFallback className="bg-muted text-[9px] font-medium">
                              {getInitials(task.owner)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-card border-border p-2">
                          <p className="font-medium text-xs">{task.owner}</p>
                          <Badge className={cn("text-[9px] font-medium border-0 px-1.5 gap-1 mt-1", plan.color)}>
                            {PlanIcon && <PlanIcon className="h-2.5 w-2.5" />}
                            {plan.label} Member
                          </Badge>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-medium border-0 px-1.5", healthTag.color)}>
                        {healthTag.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground">{task.service}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-medium border-0", status.bg, status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedTask(task); setModalOpen(true); }}
                        className="h-7 w-7 p-0 hover:bg-wj-green/10"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-wj-green" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden divide-y divide-border/30 max-h-[400px] overflow-y-auto">
          {sortedTasksData.map((task, index) => {
            const status = statusConfig[task.status as keyof typeof statusConfig];
            const healthTag = getHealthTag(task.health);
            const plan = planConfig[task.memberPlan as keyof typeof planConfig];
            const isExpanded = expandedRowId === task.id;
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <button
                  onClick={() => setExpandedRowId(isExpanded ? null : task.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-wj-green/10 flex items-center justify-center shrink-0">
                    <Bike className="h-4 w-4 text-wj-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{task.service}</p>
                    <p className="text-[10px] text-muted-foreground">{task.owner} • {task.scheduledTime}</p>
                  </div>
                  <Badge className={cn("text-[9px] border-0 shrink-0", status.bg, status.color)}>
                    {status.label}
                  </Badge>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                    isExpanded && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 space-y-3 bg-muted/20">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Health</p>
                            <Badge className={cn("text-[10px] border-0", healthTag.color)}>
                              {healthTag.label}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Plan</p>
                            <Badge className={cn("text-[10px] border-0", plan.color)}>
                              {plan.label}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Duration</p>
                            <p className="text-xs text-foreground">{task.estimatedTime}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedTask(task); setModalOpen(true); }}
                          className="w-full h-8 text-xs border-border/50"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Staff Service Modal */}
        <StaffServiceModal 
          task={selectedTask} 
          open={!!selectedTask && modalOpen} 
          onClose={() => { setSelectedTask(null); setModalOpen(false); setMinimizedService(null); }}
          onMinimize={(state) => {
            setMinimizedService(state);
            setModalOpen(false);
          }}
        />
      </motion.div>

      {/* Active Service Bar - Fixed at bottom when minimized */}
      <ServiceBarPresence>
        {minimizedService && !modalOpen && (
          <ActiveServiceBar
            taskName={minimizedService.task.service}
            bikeId={minimizedService.task.bikeId}
            stepLabel={repairStepsLabels[minimizedService.currentStepIndex] || "In Progress"}
            stepIndex={minimizedService.currentStepIndex}
            totalSteps={5}
            startTime={minimizedService.startTimestamp}
            onReopen={() => {
              setSelectedTask(minimizedService.task);
              setModalOpen(true);
            }}
          />
        )}
      </ServiceBarPresence>
    </TooltipProvider>
  );
}

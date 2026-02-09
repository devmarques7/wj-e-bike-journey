import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
  {
    id: 1,
    bikeId: "V8-2024-NL-00421",
    customer: "Emma van der Berg",
    service: "Brake Adjustment",
    status: "in_progress",
    priority: "high",
    estimatedTime: "45 min",
    scheduledTime: "09:30",
  },
  {
    id: 2,
    bikeId: "V8-2024-NL-00892",
    customer: "Lucas de Vries",
    service: "Full Service",
    status: "pending",
    priority: "medium",
    estimatedTime: "2h",
    scheduledTime: "11:00",
  },
  {
    id: 3,
    bikeId: "V8-2024-NL-00156",
    customer: "Sophie Jansen",
    service: "Battery Check",
    status: "completed",
    priority: "low",
    estimatedTime: "30 min",
    scheduledTime: "08:00",
  },
  {
    id: 4,
    bikeId: "V8-2024-NL-00723",
    customer: "Thomas Bakker",
    service: "Wheel Truing",
    status: "pending",
    priority: "high",
    estimatedTime: "1h",
    scheduledTime: "14:00",
  },
  {
    id: 5,
    bikeId: "V8-2024-NL-00445",
    customer: "Anna Visser",
    service: "Chain Replacement",
    status: "pending",
    priority: "medium",
    estimatedTime: "45 min",
    scheduledTime: "15:30",
  },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-wj-green", bg: "bg-wj-green/10" },
  in_progress: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  pending: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/50" },
};

const priorityColors = {
  high: "border-l-destructive",
  medium: "border-l-amber-500",
  low: "border-l-wj-green",
};

export default function StaffTodayTasks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-wj-green" />
          <h3 className="text-lg font-medium text-foreground">Today's Tasks</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {tasks.filter(t => t.status === "completed").length}/{tasks.length} done
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {tasks.map((task, index) => {
          const status = statusConfig[task.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={cn(
                "p-4 rounded-xl bg-muted/30 border-l-4 hover:bg-muted/50 transition-colors cursor-pointer",
                priorityColors[task.priority as keyof typeof priorityColors]
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{task.service}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", status.bg, status.color)}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{task.customer}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{task.bikeId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{task.scheduledTime}</p>
                  <p className="text-xs text-muted-foreground">{task.estimatedTime}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

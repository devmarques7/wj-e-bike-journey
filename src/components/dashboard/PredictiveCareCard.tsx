import { motion } from "framer-motion";
import { Check, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CareEvent {
  id: string;
  name: string;
  description: string;
  status: "completed" | "upcoming" | "due";
  date?: string;
  progress?: number;
}

const careEvents: CareEvent[] = [
  {
    id: "settling",
    name: "500km Settling Check",
    description: "Brake & spoke adjustment after initial ride-in period",
    status: "completed",
    date: "Completed Feb 20, 2024",
  },
  {
    id: "winter",
    name: "Winter Protection",
    description: "Anti-salt spray & light inspection for Dutch winter",
    status: "completed",
    date: "Completed Oct 15, 2024",
  },
  {
    id: "spring",
    name: "Spring Deep Clean",
    description: "Remove winter oxidation & prep for leisure season",
    status: "due",
    progress: 100,
  },
  {
    id: "annual",
    name: "Annual Safety Audit",
    description: "Motor & battery health diagnostic",
    status: "upcoming",
    date: "Due Jun 2025",
  },
];

const statusIcons = {
  completed: Check,
  upcoming: Clock,
  due: AlertCircle,
};

const statusColors = {
  completed: "text-wj-green bg-wj-green/10",
  upcoming: "text-muted-foreground bg-muted",
  due: "text-amber-500 bg-amber-500/10",
};

export default function PredictiveCareCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Predictive Care</h3>
            <p className="text-sm text-muted-foreground">Dutch-proof maintenance schedule</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light text-wj-green">8,920</p>
            <p className="text-xs text-muted-foreground">km total</p>
          </div>
        </div>
      </div>

      {/* Care Timeline */}
      <div className="p-6">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border/50" />
          
          <div className="space-y-6">
            {careEvents.map((event, index) => {
              const Icon = statusIcons[event.status];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex gap-4 group cursor-pointer"
                >
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    statusColors[event.status],
                    event.status === "due" && "ring-2 ring-amber-500/30"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground group-hover:text-wj-green transition-colors">
                          {event.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                      </div>
                      {event.status === "due" && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-wj-green transition-colors" />
                      )}
                    </div>
                    
                    {event.date && (
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {event.date}
                      </p>
                    )}

                    {event.status === "due" && event.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-amber-500 font-medium">Ready to book</span>
                          <span className="text-muted-foreground">Spring 2025</span>
                        </div>
                        <Progress value={event.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

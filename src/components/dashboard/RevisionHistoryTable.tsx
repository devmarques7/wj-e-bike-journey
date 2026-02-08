import { motion } from "framer-motion";
import { Wrench, Circle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock revision history data
const revisionHistory = [
  { 
    id: 1, 
    bikeName: "WJ Vision V8", 
    date: "2024-01-15", 
    mechanic: "Jan de Vries",
    health: 95,
    status: "completed",
    points: 150 
  },
  { 
    id: 2, 
    bikeName: "WJ Vision V8", 
    date: "2024-02-20", 
    mechanic: "Pieter Bakker",
    health: 88,
    status: "completed",
    points: 75 
  },
  { 
    id: 3, 
    bikeName: "WJ Vision V8", 
    date: "2024-03-10", 
    mechanic: "Lars Jansen",
    health: 72,
    status: "need_review",
    points: 100 
  },
  { 
    id: 4, 
    bikeName: "WJ Vision V8", 
    date: "2024-04-05", 
    mechanic: "Emma Visser",
    health: 85,
    status: "em_andamento",
    points: 80 
  },
  { 
    id: 5, 
    bikeName: "WJ Vision V8", 
    date: "2024-05-22", 
    mechanic: "Tom Mulder",
    health: 60,
    status: "pending",
    points: 120 
  },
];

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-400" },
  need_review: { label: "Need Review", color: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Completed", color: "bg-wj-green/20 text-wj-green" },
};

const getHealthColor = (health: number) => {
  if (health >= 80) return "text-wj-green";
  if (health >= 50) return "text-amber-400";
  return "text-destructive";
};

const getHealthBg = (health: number) => {
  if (health >= 80) return "bg-wj-green/20";
  if (health >= 50) return "bg-amber-500/20";
  return "bg-destructive/20";
};

export default function RevisionHistoryTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-wj-green" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Revision History</h3>
            <p className="text-xs text-muted-foreground">Track your bike maintenance records</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Bike</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Mechanic</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Health</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisionHistory.map((item, index) => {
              const status = statusConfig[item.status as keyof typeof statusConfig];
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="border-border/30 hover:bg-muted/30"
                >
                  <TableCell className="font-medium text-foreground">
                    {item.bikeName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.date).toLocaleDateString("en-GB", { 
                      day: "2-digit", 
                      month: "short", 
                      year: "numeric" 
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {item.mechanic}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", getHealthBg(item.health), getHealthColor(item.health))}>
                        {item.health}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs font-medium border-0", status.color)}>
                      <Circle className="w-1.5 h-1.5 mr-1.5 fill-current" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-wj-green font-semibold">+{item.points}</span>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}

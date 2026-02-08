import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Bike, Wallet, Eye, Send, ImageIcon, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    points: 150,
    notes: "Full inspection completed. Brakes adjusted, chain lubricated. Battery at 98% capacity.",
    photos: ["/placeholder.svg", "/placeholder.svg"],
    progress: [
      { date: "2024-01-15 09:00", action: "Check-in received", by: "System" },
      { date: "2024-01-15 10:30", action: "Inspection started", by: "Jan de Vries" },
      { date: "2024-01-15 14:00", action: "Parts replaced", by: "Jan de Vries" },
      { date: "2024-01-15 16:00", action: "Completed", by: "Jan de Vries" }
    ],
    chat: [
      { from: "mechanic", message: "Started working on your bike. Will update soon!", time: "10:30" },
      { from: "user", message: "Thanks! Any issues found?", time: "11:00" },
      { from: "mechanic", message: "Minor brake adjustment needed. All good now!", time: "14:30" }
    ]
  },
  { 
    id: 2, 
    bikeName: "WJ Vision V8", 
    date: "2024-02-20", 
    mechanic: "Pieter Bakker",
    health: 88,
    status: "completed",
    points: 75,
    notes: "Routine maintenance. Tire pressure adjusted.",
    photos: ["/placeholder.svg"],
    progress: [
      { date: "2024-02-20 09:00", action: "Check-in received", by: "System" },
      { date: "2024-02-20 11:00", action: "Completed", by: "Pieter Bakker" }
    ],
    chat: [
      { from: "mechanic", message: "Quick service today, all done!", time: "11:00" }
    ]
  },
  { 
    id: 3, 
    bikeName: "WJ Vision V8", 
    date: "2024-03-10", 
    mechanic: "Lars Jansen",
    health: 72,
    status: "in_progress",
    points: 100,
    notes: "Battery showing wear. Recommend replacement soon.",
    photos: [],
    progress: [
      { date: "2024-03-10 09:00", action: "Check-in received", by: "System" },
      { date: "2024-03-10 10:00", action: "Inspection started", by: "Lars Jansen" }
    ],
    chat: [
      { from: "mechanic", message: "Found some battery issues. Will send update.", time: "10:30" }
    ]
  },
  { 
    id: 4, 
    bikeName: "WJ Vision V8", 
    date: "2024-04-05", 
    mechanic: "Emma Visser",
    health: 85,
    status: "in_progress",
    points: 80,
    notes: "Chain needs replacement.",
    photos: ["/placeholder.svg"],
    progress: [
      { date: "2024-04-05 09:00", action: "Check-in received", by: "System" }
    ],
    chat: []
  },
  { 
    id: 5, 
    bikeName: "WJ Vision V8", 
    date: "2024-05-22", 
    mechanic: "Tom Mulder",
    health: 60,
    status: "pending",
    points: 120,
    notes: "Awaiting parts for motor inspection.",
    photos: [],
    progress: [
      { date: "2024-05-22 09:00", action: "Check-in received", by: "System" }
    ],
    chat: []
  },
];

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  completed: { label: "Completed", color: "bg-wj-green/20 text-wj-green" },
};

const getHealthTag = (health: number) => {
  if (health >= 80) return { label: "In Good", color: "bg-wj-green/20 text-wj-green" };
  if (health >= 60) return { label: "Need Care", color: "bg-amber-500/20 text-amber-400" };
  return { label: "Time to Change", color: "bg-destructive/20 text-destructive" };
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
};

export default function RevisionHistoryTable() {
  const [selectedRevision, setSelectedRevision] = useState<typeof revisionHistory[0] | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  return (
    <TooltipProvider>
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
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Points</TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisionHistory.map((item, index) => {
                const status = statusConfig[item.status as keyof typeof statusConfig];
                const healthTag = getHealthTag(item.health);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border-border/30 hover:bg-muted/30"
                  >
                    {/* Bike Column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-wj-green/10 flex items-center justify-center">
                          <Bike className="h-4 w-4 text-wj-green" />
                        </div>
                        <span className="font-medium text-foreground text-sm">{item.bikeName}</span>
                      </div>
                    </TableCell>

                    {/* Date Column */}
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("en-GB", { 
                        day: "2-digit", 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </TableCell>

                    {/* Mechanic Column */}
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-wj-green/50 transition-all">
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {getInitials(item.mechanic)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-card border-border">
                          <p className="font-medium">{item.mechanic}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Health Column */}
                    <TableCell>
                      <Badge className={cn("text-xs font-medium border-0", healthTag.color)}>
                        {healthTag.label}
                      </Badge>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <Badge className={cn("text-xs font-medium border-0", status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>

                    {/* Points Column */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-wj-green" />
                        <span className="text-wj-green font-semibold text-sm">+{item.points}</span>
                      </div>
                    </TableCell>

                    {/* Action Column */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRevision(item)}
                        className="h-8 w-8 p-0 hover:bg-wj-green/10"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-wj-green" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Details Modal */}
        <Dialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
          <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-wj-green/10 flex items-center justify-center">
                  <Bike className="h-5 w-5 text-wj-green" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedRevision?.bikeName}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {selectedRevision && new Date(selectedRevision.date).toLocaleDateString("en-GB", { 
                      day: "2-digit", 
                      month: "long", 
                      year: "numeric" 
                    })}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Status & Health */}
                <div className="flex gap-3">
                  {selectedRevision && (
                    <>
                      <Badge className={cn("text-xs", statusConfig[selectedRevision.status as keyof typeof statusConfig].color)}>
                        {statusConfig[selectedRevision.status as keyof typeof statusConfig].label}
                      </Badge>
                      <Badge className={cn("text-xs", getHealthTag(selectedRevision.health).color)}>
                        {getHealthTag(selectedRevision.health).label}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {selectedRevision?.notes}
                  </p>
                </div>

                {/* Photos */}
                {selectedRevision?.photos && selectedRevision.photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Photos
                    </h4>
                    <div className="flex gap-2">
                      {selectedRevision.photos.map((photo, i) => (
                        <div key={i} className="w-20 h-20 rounded-lg bg-muted overflow-hidden">
                          <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Timeline */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Progress History
                  </h4>
                  <div className="space-y-3">
                    {selectedRevision?.progress.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-wj-green/20 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-wj-green" />
                          </div>
                          {i < (selectedRevision?.progress.length || 0) - 1 && (
                            <div className="w-px h-full bg-border flex-1 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-sm font-medium text-foreground">{step.action}</p>
                          <p className="text-xs text-muted-foreground">{step.date} • {step.by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> Chat with Mechanic
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3 min-h-[120px]">
                    {selectedRevision?.chat.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2",
                          msg.from === "user" 
                            ? "bg-wj-green text-wj-green-foreground" 
                            : "bg-muted"
                        )}>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                    {(!selectedRevision?.chat || selectedRevision.chat.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 bg-muted/50 border-border/50"
                    />
                    <Button size="icon" className="bg-wj-green hover:bg-wj-green/90">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}

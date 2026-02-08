import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Bike, Wallet, Eye, Send, ImageIcon, MessageCircle, CheckCircle2, ChevronRight, ChevronDown, Star, PanelLeftClose, PanelLeft, Circle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Timeline status steps
const timelineSteps = [
  { key: "check_in", label: "Check-in" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "parts_replaced", label: "Parts Replaced" },
  { key: "need_review", label: "Need Review" },
  { key: "completed", label: "Complete" },
];

const getActiveStep = (status: string) => {
  if (status === "completed") return 5;
  if (status === "in_progress") return 2;
  return 1;
};

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
  const [chatOpen, setChatOpen] = useState(true);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

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

        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-wj-green/10 flex items-center justify-center">
                          <Bike className="h-4 w-4 text-wj-green" />
                        </div>
                        <span className="font-medium text-foreground text-sm">{item.bikeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("en-GB", { 
                        day: "2-digit", 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </TableCell>
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
                    <TableCell>
                      <Badge className={cn("text-xs font-medium border-0", healthTag.color)}>
                        {healthTag.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium border-0", status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-wj-green" />
                        <span className="text-wj-green font-semibold text-sm">+{item.points}</span>
                      </div>
                    </TableCell>
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

        {/* Mobile/Tablet Cards - Expandable rows */}
        <div className="md:hidden divide-y divide-border/30">
          {revisionHistory.map((item, index) => {
            const status = statusConfig[item.status as keyof typeof statusConfig];
            const healthTag = getHealthTag(item.health);
            const isExpanded = expandedRowId === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                {/* Main Row - Clickable */}
                <button
                  onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-wj-green/10 flex items-center justify-center shrink-0">
                    <Bike className="h-4 w-4 text-wj-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.bikeName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("en-GB", { 
                        day: "2-digit", 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </p>
                  </div>
                  <Badge className={cn("text-[9px] border-0 shrink-0", status.color)}>
                    {status.label}
                  </Badge>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                    isExpanded && "rotate-180"
                  )} />
                </button>

                {/* Expanded Content */}
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
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mechanic</p>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-muted text-[9px] font-medium">
                                  {getInitials(item.mechanic)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-foreground">{item.mechanic}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Health</p>
                            <Badge className={cn("text-[10px] border-0", healthTag.color)}>
                              {healthTag.label}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Points</p>
                            <div className="flex items-center gap-1">
                              <Wallet className="h-3 w-3 text-wj-green" />
                              <span className="text-wj-green font-semibold text-xs">+{item.points}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-[10px] text-foreground line-clamp-2">{item.notes}</p>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRevision(item)}
                          className="w-full h-8 text-xs border-border/50"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Full Details
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Details Modal */}
        <Dialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
          <DialogContent className="w-[95vw] max-w-4xl bg-card border-border max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl md:rounded-3xl">
            {/* Header with Timeline */}
            <div className="p-3 md:p-4 border-b border-border/50">
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-wj-green/10 flex items-center justify-center">
                    <Bike className="h-3.5 w-3.5 md:h-4 md:w-4 text-wj-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-semibold truncate">{selectedRevision?.bikeName}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      {selectedRevision && new Date(selectedRevision.date).toLocaleDateString("en-GB", { 
                        day: "2-digit", 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 md:gap-2 mr-6 md:mr-8">
                    {selectedRevision && (
                      <>
                        <Badge className={cn("text-[8px] md:text-[10px] border-0 px-1.5 py-0.5", statusConfig[selectedRevision.status as keyof typeof statusConfig].color)}>
                          {statusConfig[selectedRevision.status as keyof typeof statusConfig].label}
                        </Badge>
                        <Badge className={cn("text-[8px] md:text-[10px] border-0 px-1.5 py-0.5", getHealthTag(selectedRevision.health).color)}>
                          {getHealthTag(selectedRevision.health).label}
                        </Badge>
                      </>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Horizontal Timeline - Hide labels on mobile */}
              <div className="flex items-center justify-between gap-0.5 md:gap-1 mt-2">
                {timelineSteps.map((step, i) => {
                  const activeStep = getActiveStep(selectedRevision?.status || "pending");
                  const isCompleted = i <= activeStep;
                  const isCurrent = i === activeStep;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center gap-0.5 md:gap-1">
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div className={cn(
                            "flex-1 h-0.5",
                            i <= activeStep ? "bg-wj-green" : "bg-border"
                          )} />
                        )}
                        <div className={cn(
                          "w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                          isCompleted ? "bg-wj-green" : "bg-muted",
                          isCurrent && "ring-2 ring-wj-green/30"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-wj-green-foreground" />
                          ) : (
                            <Circle className="h-1.5 w-1.5 md:h-2 md:w-2 text-muted-foreground" />
                          )}
                        </div>
                        {i < timelineSteps.length - 1 && (
                          <div className={cn(
                            "flex-1 h-0.5",
                            i < activeStep ? "bg-wj-green" : "bg-border"
                          )} />
                        )}
                      </div>
                      <span className={cn(
                        "text-[7px] md:text-[9px] text-center leading-tight hidden sm:block",
                        isCurrent ? "text-wj-green font-medium" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative p-2 md:p-4">
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 h-full">
                {/* Chat Sidebar - Full width on mobile when open */}
                <AnimatePresence mode="wait">
                  {chatOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-background border border-border/50 rounded-xl md:rounded-2xl flex flex-col shadow-xl shrink-0 overflow-hidden w-full md:w-[280px] max-h-[200px] md:max-h-none md:h-full"
                    >
                      <div className="p-3 border-b border-border/50 flex items-center justify-between rounded-t-2xl">
                        <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5 text-wj-green" /> 
                          Chat
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => setChatOpen(false)}
                        >
                          <PanelLeftClose className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                          {/* Auto status messages */}
                          {selectedRevision?.progress.map((step, i) => (
                            <div key={`status-${i}`} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-muted/30 rounded-md px-2 py-1.5 inline-block">
                                  <p className="text-[10px] text-muted-foreground italic">{step.action}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Chat messages */}
                          {selectedRevision?.chat.map((msg, i) => (
                            <div key={`chat-${i}`} className={cn("flex gap-2", msg.from === "user" ? "flex-row-reverse" : "")}>
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className={cn(
                                  "text-[9px] font-medium",
                                  msg.from === "user" ? "bg-wj-green/20 text-wj-green" : "bg-muted"
                                )}>
                                  {msg.from === "user" ? "ME" : getInitials(selectedRevision?.mechanic || "M")}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "max-w-[80%] rounded-md px-2 py-1.5",
                                msg.from === "user" 
                                  ? "bg-wj-green text-wj-green-foreground" 
                                  : "bg-muted"
                              )}>
                                <p className="text-[11px]">{msg.message}</p>
                                <p className="text-[9px] opacity-70">{msg.time}</p>
                              </div>
                            </div>
                          ))}
                          {(!selectedRevision?.chat || selectedRevision.chat.length === 0) && (
                            <p className="text-[10px] text-muted-foreground text-center py-2">No messages</p>
                          )}
                        </div>
                      </ScrollArea>
                      <div className="p-2 border-t border-border/50 rounded-b-2xl">
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="flex-1 bg-muted/50 border-border/50 h-8 text-xs"
                          />
                          <Button size="icon" className="bg-wj-green hover:bg-wj-green/90 h-8 w-8">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed Chat Column - Hidden on mobile, show button instead */}
                {!chatOpen && (
                  <>
                    {/* Mobile: Floating button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="md:hidden flex items-center gap-2 h-8 px-3 mb-2 bg-background border-border/50"
                      onClick={() => setChatOpen(true)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-wj-green" />
                      <span className="text-xs">Chat</span>
                    </Button>
                    {/* Desktop: Slim column */}
                    <div className="hidden md:flex w-10 bg-background border border-border/50 rounded-xl flex-col items-center py-3 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 hover:bg-wj-green/10"
                        onClick={() => setChatOpen(true)}
                      >
                        <MessageCircle className="h-4 w-4 text-wj-green" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background border border-border/50 rounded-xl md:rounded-2xl">

                <ScrollArea className="flex-1">
                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                    {/* Notes Summary */}
                    <div className="bg-muted/30 rounded-lg p-2.5 md:p-3">
                      <p className="text-xs md:text-sm text-foreground">{selectedRevision?.notes}</p>
                    </div>

                    {/* Collapsible Photos */}
                    <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-medium text-foreground flex items-center gap-2">
                          <ImageIcon className="h-3.5 w-3.5 text-wj-green" /> 
                          Process Photos
                          {selectedRevision?.photos && selectedRevision.photos.length > 0 && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                              {selectedRevision.photos.length}
                            </Badge>
                          )}
                        </span>
                        {photosOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        {selectedRevision?.photos && selectedRevision.photos.length > 0 ? (
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 md:gap-2">
                            {selectedRevision.photos.map((photo, i) => (
                              <div key={i} className="aspect-square rounded-md md:rounded-lg bg-muted overflow-hidden">
                                <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-muted/20 rounded-lg p-3 md:p-4 text-center">
                            <p className="text-[10px] md:text-xs text-muted-foreground">No photos</p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Collapsible Mechanic Notes */}
                    <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-medium text-foreground flex items-center gap-2">
                          <Wrench className="h-3.5 w-3.5 text-wj-green" /> 
                          Mechanic Notes
                        </span>
                        {notesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-2">
                        {selectedRevision?.progress.map((step, i) => (
                          <div key={i} className="bg-muted/20 rounded-lg p-2.5 flex items-start gap-2">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarFallback className="text-[8px] bg-muted">
                                {step.by === "System" ? "SY" : getInitials(step.by)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-foreground">{step.action}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{step.date}</p>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Star Rating Review */}
                    {selectedRevision?.status === "completed" && (
                      <div className="border-t border-border/50 pt-3 md:pt-4 mt-3 md:mt-4">
                        <p className="text-[10px] md:text-xs font-medium text-foreground mb-2">Rate this service</p>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setUserRating(star)}
                              className="p-0.5 transition-transform hover:scale-110"
                            >
                              <Star 
                                className={cn(
                                  "h-5 w-5 md:h-6 md:w-6 transition-colors",
                                  star <= userRating 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "text-muted-foreground/30"
                                )} 
                              />
                            </button>
                          ))}
                          {userRating > 0 && (
                            <span className="text-[10px] md:text-xs text-muted-foreground ml-2">
                              {userRating === 5 ? "Excellent!" : userRating >= 4 ? "Great!" : userRating >= 3 ? "Good" : "Thanks"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}

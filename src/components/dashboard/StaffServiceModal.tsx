import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence, PanInfo } from "framer-motion";
import {
  Bike,
  Clock,
  CheckCircle2,
  ArrowRight,
  Camera,
  MessageCircle,
  Send,
  Star,
  Crown,
  Bell,
  ChevronLeft,
  X,
  Wrench,
  Search,
  ClipboardList,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TaskData {
  id: number;
  bikeId: string;
  bikeName: string;
  owner: string;
  ownerEmail: string;
  health: number;
  memberPlan: string;
  status: string;
  service: string;
  scheduledTime: string;
  estimatedTime: string;
  priority: string;
  notes: string;
  photos: string[];
  chat: { from: string; message: string; time: string }[];
}

interface StaffServiceModalProps {
  task: TaskData | null;
  open: boolean;
  onClose: () => void;
}

const planConfig = {
  light: { label: "Light", color: "bg-slate-500/20 text-slate-400", icon: null },
  plus: { label: "Plus", color: "bg-blue-500/20 text-blue-400", icon: Star },
  black: { label: "Black", color: "bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-400", icon: Crown },
};

const repairSteps = [
  { id: "inspection", label: "Inspection", icon: Search, specs: ["Frame check", "Bolts torque", "Visual assessment"] },
  { id: "diagnosis", label: "Diagnosis", icon: ClipboardList, specs: ["Error codes", "Component testing", "Root cause"] },
  { id: "repair", label: "Repair", icon: Wrench, specs: ["Parts replacement", "Adjustments", "Lubrication"] },
  { id: "testing", label: "Testing", icon: Zap, specs: ["Road test", "Brake test", "Electronics check"] },
  { id: "quality", label: "Quality", icon: ShieldCheck, specs: ["Final inspection", "Clean up", "Documentation"] },
];

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export default function StaffServiceModal({ task, open, onClose }: StaffServiceModalProps) {
  const [repairStatus, setRepairStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [repairSeconds, setRepairSeconds] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [stepPhotos, setStepPhotos] = useState<Record<string, string>>({});

  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ from: string; message: string; time: string }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startX = useMotionValue(0);
  const completeX = useMotionValue(0);
  const sliderWidth = 260;
  const thumbWidth = 48;
  const maxDrag = sliderWidth - thumbWidth - 4;

  const startBgOpacity = useTransform(startX, [0, maxDrag], [0.1, 0.4]);
  const startCheckScale = useTransform(startX, [maxDrag * 0.7, maxDrag], [0, 1]);
  const completeBgOpacity = useTransform(completeX, [0, maxDrag], [0.1, 0.4]);

  useEffect(() => {
    if (task?.chat) setChatMessages(task.chat);
  }, [task]);

  useEffect(() => {
    if (repairStatus === "in_progress") {
      timerRef.current = setInterval(() => setRepairSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [repairStatus]);

  useEffect(() => {
    if (open && task) {
      setRepairStatus(task.status === "in_progress" ? "in_progress" : "pending");
      if (task.status === "pending") {
        setRepairSeconds(0);
        setCompletedSteps({});
        setStepPhotos({});
        setCurrentStepIndex(0);
        setShowStartOverlay(true);
      }
    }
  }, [open, task]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const notifyClient = (message: string) => {
    setChatMessages(prev => [...prev, {
      from: "system",
      message,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    }]);
  };

  const handleStartDragEnd = () => {
    if (startX.get() >= maxDrag * 0.8) {
      animate(startX, maxDrag, { duration: 0.15 });
      setTimeout(() => {
        setRepairStatus("in_progress");
        setShowStartOverlay(false);
        animate(startX, 0, { duration: 0 });
        notifyClient("🔧 Repair started! The mechanic has begun working on your bike.");
      }, 200);
    } else {
      animate(startX, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const handleCompleteDragEnd = () => {
    const allDone = repairSteps.every(s => completedSteps[s.id]);
    if (!allDone) {
      animate(completeX, 0, { type: "spring", stiffness: 500, damping: 30 });
      return;
    }
    if (completeX.get() >= maxDrag * 0.8) {
      animate(completeX, maxDrag, { duration: 0.15 });
      setTimeout(() => {
        setRepairStatus("completed");
        animate(completeX, 0, { duration: 0 });
        notifyClient("✅ Repair complete! Your bike is ready for pickup.");
      }, 200);
    } else {
      animate(completeX, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const handleCompleteStep = (stepId: string) => {
    const hasPhoto = !!stepPhotos[stepId];
    if (!hasPhoto) return;

    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));

    const stepIndex = repairSteps.findIndex(s => s.id === stepId);
    const step = repairSteps[stepIndex];
    notifyClient(`${step.label} step completed!`);

    if (stepIndex < repairSteps.length - 1) {
      setCurrentStepIndex(stepIndex + 1);
    }
  };

  const handlePhotoUpload = (stepId: string) => {
    setStepPhotos(prev => ({ ...prev, [stepId]: "/placeholder.svg" }));
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages(prev => [...prev, {
      from: "mechanic",
      message: chatMessage,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    }]);
    setChatMessage("");
  };

  if (!task) return null;

  const plan = planConfig[task.memberPlan as keyof typeof planConfig];
  const PlanIcon = plan?.icon;
  const allStepsCompleted = repairSteps.every(s => completedSteps[s.id]);
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const currentStep = repairSteps[currentStepIndex];
  const StepIcon = currentStep?.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-xs bg-transparent border-0 shadow-none overflow-hidden p-0 rounded-3xl min-h-[560px] max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">{task.service}</DialogTitle>

        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover rounded-3xl"
        >
          <source src="/videos/staff-service-modal-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/50 to-transparent rounded-t-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-3xl" />
        <div className="absolute inset-0 bg-black/20 rounded-3xl" />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full min-h-[560px]">
          {/* Header: Owner left, Service icon right */}
          <div className="p-4 flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/20">
              <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                {getInitials(task.owner)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{task.owner}</p>
              <div className="flex items-center gap-1.5">
                <Badge className={cn("text-[9px] border-0 px-1.5 py-0 h-4", plan?.color)}>
                  {PlanIcon && <PlanIcon className="h-2.5 w-2.5 mr-0.5" />}
                  {plan?.label}
                </Badge>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-wj-green/20 border border-wj-green/30 flex items-center justify-center">
              <Bike className="h-4 w-4 text-wj-green" />
            </div>
          </div>

          {/* Main Area - Grows to fill */}
          <div className="flex-1 flex flex-col justify-end px-4 pb-4 gap-3">
            {/* In Progress: Horizontal Swipe Step Card */}
            {repairStatus === "in_progress" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 flex-1 justify-end"
              >
                {/* Step Card - Swipeable horizontally */}
                <div className="relative w-full overflow-hidden rounded-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepIndex}
                      initial={{ opacity: 0, x: 80 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -80 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3"
                    >
                      {/* Timer inside card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-wj-green/20 flex items-center justify-center">
                            {StepIcon && <StepIcon className="h-4 w-4 text-wj-green" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{currentStep.label}</p>
                            <p className="text-[10px] text-white/50">Step {currentStepIndex + 1} of {repairSteps.length}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-wj-green/10 border border-wj-green/20">
                          <Clock className="h-3 w-3 text-wj-green" />
                          <span className="text-xs font-mono font-bold text-wj-green">{formatTime(repairSeconds)}</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="space-y-1.5">
                        {currentStep.specs.map((spec, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-wj-green/60" />
                            <span className="text-[11px] text-white/60">{spec}</span>
                          </div>
                        ))}
                      </div>

                      {/* Photo + Complete inside card */}
                      <div className="flex items-center gap-2 pt-1">
                        {stepPhotos[currentStep.id] ? (
                          <div className="w-10 h-10 rounded-lg bg-wj-green/20 flex items-center justify-center border border-wj-green/30">
                            <CheckCircle2 className="h-4 w-4 text-wj-green" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePhotoUpload(currentStep.id)}
                            className="w-10 h-10 rounded-lg border border-dashed border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
                          >
                            <Camera className="h-4 w-4 text-white/40" />
                          </button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleCompleteStep(currentStep.id)}
                          disabled={!stepPhotos[currentStep.id]}
                          className="flex-1 h-9 text-xs bg-wj-green hover:bg-wj-green/90 disabled:opacity-30 rounded-xl"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Complete Step
                        </Button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Step Counters */}
                <div className="flex items-center justify-center gap-2">
                  {repairSteps.map((step, i) => {
                    const isCompleted = completedSteps[step.id];
                    const isCurrent = i === currentStepIndex;
                    const SIcon = step.icon;
                    return (
                      <button
                        key={step.id}
                        onClick={() => {
                          if (isCompleted || isCurrent) return;
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border",
                          isCompleted
                            ? "bg-wj-green/30 border-wj-green/50"
                            : isCurrent
                            ? "bg-white/10 border-wj-green/40 scale-110"
                            : "bg-white/5 border-white/10 opacity-40"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-wj-green" />
                        ) : (
                          <SIcon className={cn("h-3 w-3", isCurrent ? "text-wj-green" : "text-white/40")} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Complete Swipe - when all done */}
                {allStepsCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <motion.div
                      style={{ backgroundColor: `rgba(5, 140, 66, ${completeBgOpacity.get()})` }}
                      className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden w-full"
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm text-wj-green/70 font-medium">Finish Service →</span>
                      </div>
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: maxDrag }}
                        dragElastic={0}
                        onDragEnd={handleCompleteDragEnd}
                        style={{ x: completeX }}
                        className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
                      >
                        <ArrowRight className="h-5 w-5 text-background" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Completed State */}
            {repairStatus === "completed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-14 h-14 rounded-full bg-wj-green/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-7 w-7 text-wj-green" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Service Complete!</h3>
                <p className="text-2xl font-mono font-bold text-wj-green mb-2">{formatTime(repairSeconds)}</p>
                <p className="text-[10px] text-white/50">Customer notified automatically</p>
              </motion.div>
            )}
          </div>

          {/* Floating Chat FAB - Always visible, bottom right */}
          <div className="absolute bottom-5 right-5 z-50">
            <button
              onClick={() => setShowChatOverlay(true)}
              className="relative w-12 h-12 rounded-full bg-wj-green shadow-lg shadow-wj-green/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <MessageCircle className="h-5 w-5 text-background" />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[10px] text-wj-green flex items-center justify-center font-bold shadow-sm">
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* START OVERLAY */}
        <AnimatePresence>
          {showStartOverlay && repairStatus === "pending" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 overflow-hidden rounded-3xl"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/videos/staff-service-bg.mp4" type="video/mp4" />
              </video>

              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              <div className="relative z-10 h-full flex flex-col">
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-white/20">
                    <AvatarFallback className="bg-white/10 text-white text-xs font-bold">
                      {getInitials(task.owner)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{task.owner}</p>
                    <p className="text-[10px] text-white/50 font-mono">{task.bikeId}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-wj-green/20 flex items-center justify-center border border-wj-green/30">
                    <Bike className="h-4 w-4 text-wj-green" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <h2 className="text-lg font-semibold text-white mb-1">{task.service}</h2>
                    <p className="text-[10px] text-white/40">
                      Customer will be notified when started
                    </p>
                  </motion.div>
                </div>

                <div className="p-4 pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      backgroundColor: `rgba(5, 140, 66, ${startBgOpacity.get()})`
                    }}
                    className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden w-full"
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-sm text-wj-green/70 font-medium tracking-wide">
                        Start Service →
                      </span>
                    </div>

                    <motion.div
                      style={{ scale: startCheckScale }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <CheckCircle2 className="h-6 w-6 text-wj-green" />
                    </motion.div>

                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: maxDrag }}
                      dragElastic={0}
                      onDragEnd={handleStartDragEnd}
                      style={{ x: startX }}
                      className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/40"
                    >
                      <ArrowRight className="h-5 w-5 text-background" />
                    </motion.div>
                  </motion.div>

                  <button
                    onClick={() => { setShowStartOverlay(false); onClose(); }}
                    className="w-full mt-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHAT OVERLAY */}
        <AnimatePresence>
          {showChatOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="absolute inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col rounded-3xl"
            >
              <div className="p-3 border-b border-border/30 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChatOverlay(false)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-wj-green/20 text-wj-green text-xs">
                    {getInitials(task.owner)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-xs font-medium">{task.owner}</p>
                  <p className="text-[10px] text-muted-foreground">Customer</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No messages yet</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-2", msg.from === "mechanic" && "flex-row-reverse")}
                    >
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className={cn(
                          "text-[9px] font-medium",
                          msg.from === "owner" ? "bg-wj-green/20 text-wj-green" :
                          msg.from === "system" ? "bg-blue-500/20 text-blue-400" :
                          "bg-muted"
                        )}>
                          {msg.from === "owner" ? getInitials(task.owner) :
                           msg.from === "system" ? <Bell className="h-3 w-3" /> : "ME"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2",
                        msg.from === "mechanic" ? "bg-wj-green text-background rounded-tr-sm" :
                        msg.from === "system" ? "bg-blue-500/10 text-blue-400 italic" :
                        "bg-muted rounded-tl-sm"
                      )}>
                        <p className="text-[11px]">{msg.message}</p>
                        <p className="text-[9px] opacity-60 mt-0.5">{msg.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-border/30 flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Message..."
                  className="h-10 text-xs bg-muted/30 border-border/30 rounded-full px-4"
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="h-10 w-10 p-0 rounded-full bg-wj-green hover:bg-wj-green/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

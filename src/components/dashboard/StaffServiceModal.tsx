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
  ChevronDown,
  Wrench,
  Search,
  ClipboardList,
  Zap,
  ShieldCheck,
  Check,
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
  onMinimize?: (serviceState: ActiveServiceState) => void;
}

export interface ActiveServiceState {
  task: TaskData;
  repairSeconds: number;
  currentStepIndex: number;
  completedSteps: Record<string, boolean>;
  startTimestamp: number;
}

const planConfig = {
  light: { label: "Light", color: "bg-slate-500/20 text-slate-400", icon: null },
  plus: { label: "Plus", color: "bg-blue-500/20 text-blue-400", icon: Star },
  black: { label: "Black", color: "bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-400", icon: Crown },
};

const repairSteps = [
  {
    id: "inspection", label: "Inspection", icon: Search,
    checklist: ["Frame integrity verified", "Bolts torque checked", "Visual damage assessed"],
  },
  {
    id: "diagnosis", label: "Diagnosis", icon: ClipboardList,
    checklist: ["Error codes scanned", "Component testing done", "Root cause identified"],
  },
  {
    id: "repair", label: "Repair", icon: Wrench,
    checklist: ["Parts replaced", "Adjustments calibrated", "Lubrication applied"],
  },
  {
    id: "testing", label: "Testing", icon: Zap,
    checklist: ["Road test passed", "Brake response OK", "Electronics functional"],
  },
  {
    id: "quality", label: "Quality", icon: ShieldCheck,
    checklist: ["Final inspection passed", "Bike cleaned", "Documentation complete"],
  },
];

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

// Tinder-style swipeable card
function TinderStepCard({
  step,
  stepIndex,
  totalSteps,
  timer,
  onComplete,
}: {
  step: typeof repairSteps[0];
  stepIndex: number;
  totalSteps: number;
  timer: string;
  onComplete: () => void;
}) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [hasPhoto, setHasPhoto] = useState(false);
  const [swiping, setSwiping] = useState(false);
  
  const cardX = useMotionValue(0);
  const cardRotate = useTransform(cardX, [-200, 0, 200], [-12, 0, 12]);
  const cardOpacity = useTransform(cardX, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const completeOpacity = useTransform(cardX, [0, 80, 150], [0, 0.5, 1]);
  
  const StepIcon = step.icon;
  const allChecked = step.checklist.every((_, i) => checkedItems[i]);
  const canComplete = allChecked && hasPhoto;

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!canComplete) {
      animate(cardX, 0, { type: "spring", stiffness: 500, damping: 30 });
      return;
    }

    if (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 500) {
      const direction = info.offset.x > 0 ? 400 : -400;
      setSwiping(true);
      animate(cardX, direction, { duration: 0.3 }).then(() => {
        onComplete();
      });
    } else {
      animate(cardX, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  return (
    <div className="relative w-full" style={{ minHeight: 320 }}>
      {/* "Complete" label behind card */}
      <motion.div
        style={{ opacity: completeOpacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-wj-green/20 border border-wj-green/40">
          <CheckCircle2 className="h-5 w-5 text-wj-green" />
          <span className="text-sm font-semibold text-wj-green">Step Complete</span>
        </div>
      </motion.div>

      {/* Draggable Card */}
      <motion.div
        drag={canComplete ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        style={{ x: cardX, rotate: cardRotate, opacity: cardOpacity }}
        className={cn(
          "relative w-full bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 space-y-3 z-10",
          canComplete ? "cursor-grab active:cursor-grabbing" : ""
        )}
      >
        {/* Header: icon + label + timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-wj-green/15 flex items-center justify-center">
              <StepIcon className="h-4 w-4 text-wj-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{step.label}</p>
              <p className="text-[10px] text-white/40">Step {stepIndex + 1} of {totalSteps}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-wj-green/10 border border-wj-green/20">
            <Clock className="h-3 w-3 text-wj-green" />
            <span className="text-[11px] font-mono font-bold text-wj-green">{timer}</span>
          </div>
        </div>

        {/* Quality Checklist */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Quality Checklist</p>
          {step.checklist.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleCheck(i)}
              className="w-full flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                checkedItems[i]
                  ? "bg-wj-green border-wj-green"
                  : "border-white/20 group-hover:border-white/40"
              )}>
                {checkedItems[i] && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={cn(
                "text-xs transition-colors text-left",
                checkedItems[i] ? "text-white/80 line-through" : "text-white/60"
              )}>
                {item}
              </span>
            </button>
          ))}
        </div>

        {/* Photo Upload */}
        <div className="flex items-center gap-2 pt-1">
          {hasPhoto ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-wj-green/10 border border-wj-green/20 flex-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-wj-green shrink-0" />
              <span className="text-[11px] text-wj-green">Photo attached</span>
            </div>
          ) : (
            <button
              onClick={() => setHasPhoto(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-white/20 hover:bg-white/5 transition-colors flex-1"
            >
              <Camera className="h-3.5 w-3.5 text-white/40 shrink-0" />
              <span className="text-[11px] text-white/40">Add photo evidence</span>
            </button>
          )}
        </div>

        {/* Swipe hint */}
        <div className="text-center pt-1">
          {canComplete ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-wj-green/60"
            >
              ← Swipe to complete step →
            </motion.p>
          ) : (
            <p className="text-[10px] text-white/20">
              Complete checklist & add photo to continue
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function StaffServiceModal({ task, open, onClose, onMinimize }: StaffServiceModalProps) {
  const [repairStatus, setRepairStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [repairSeconds, setRepairSeconds] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ from: string; message: string; time: string }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimestampRef = useRef<number>(Date.now());
  const startX = useMotionValue(0);
  const completeX = useMotionValue(0);
  const maxDrag = 208;

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
        startTimestampRef.current = Date.now();
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

  const handleStepComplete = (stepIndex: number) => {
    const step = repairSteps[stepIndex];
    setCompletedSteps(prev => ({ ...prev, [step.id]: true }));
    notifyClient(`✅ ${step.label} step completed successfully.`);

    if (stepIndex < repairSteps.length - 1) {
      setTimeout(() => setCurrentStepIndex(stepIndex + 1), 400);
    }
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

  const handleMinimize = () => {
    if (repairStatus === "in_progress" && onMinimize) {
      onMinimize({
        task,
        repairSeconds,
        currentStepIndex,
        completedSteps,
        startTimestamp: startTimestampRef.current,
      });
    } else {
      onClose();
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleMinimize();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="w-[90vw] max-w-xs bg-transparent border-0 shadow-none overflow-hidden p-0 rounded-3xl min-h-[600px] max-h-[92vh] flex flex-col [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{task.service}</DialogTitle>

        {/* Video Background */}
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover rounded-3xl">
          <source src="/videos/staff-service-modal-bg.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent rounded-t-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-3xl" />
        <div className="absolute inset-0 bg-black/15 rounded-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full min-h-[600px]">
          {/* Header */}
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
            {/* Minimize button (arrow down) instead of X */}
            <button
              onClick={handleMinimize}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col px-3 pb-3 gap-3">
            {/* In Progress: Tinder swipe cards */}
            {repairStatus === "in_progress" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col gap-3"
              >
                {/* Tinder Card Stack */}
                <div className="flex-1 flex items-center">
                  <AnimatePresence mode="wait">
                    {!allStepsCompleted && (
                      <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-full"
                      >
                        <TinderStepCard
                          step={repairSteps[currentStepIndex]}
                          stepIndex={currentStepIndex}
                          totalSteps={repairSteps.length}
                          timer={formatTime(repairSeconds)}
                          onComplete={() => handleStepComplete(currentStepIndex)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* All steps done — Finish Swipe */}
                  {allStepsCompleted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full space-y-4"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-wj-green/20 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="h-6 w-6 text-wj-green" />
                        </div>
                        <p className="text-sm font-semibold text-white">All Steps Complete</p>
                        <p className="text-2xl font-mono font-bold text-wj-green mt-1">{formatTime(repairSeconds)}</p>
                      </div>

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
                          <ArrowRight className="h-5 w-5 text-white" />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Step Counter Dots */}
                <div className="flex items-center justify-center gap-2 pb-1">
                  {repairSteps.map((step, i) => {
                    const isCompleted = completedSteps[step.id];
                    const isCurrent = i === currentStepIndex;
                    const SIcon = step.icon;
                    return (
                      <div
                        key={step.id}
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
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Completed State */}
            {repairStatus === "completed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-wj-green/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8 text-wj-green" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Service Complete!</h3>
                <p className="text-3xl font-mono font-bold text-wj-green mb-2">{formatTime(repairSeconds)}</p>
                <p className="text-[10px] text-white/40">Customer notified automatically</p>
              </motion.div>
            )}
          </div>

          {/* Floating Chat FAB */}
          <div className="absolute bottom-5 right-5 z-50">
            <button
              onClick={() => setShowChatOverlay(true)}
              className="relative w-12 h-12 rounded-full bg-wj-green shadow-lg shadow-wj-green/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <MessageCircle className="h-5 w-5 text-white" />
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
              <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
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
                    <p className="text-[10px] text-white/40">Customer will be notified when started</p>
                  </motion.div>
                </div>

                <div className="p-4 pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ backgroundColor: `rgba(5, 140, 66, ${startBgOpacity.get()})` }}
                    className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden w-full"
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-sm text-wj-green/70 font-medium tracking-wide">Start Service →</span>
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
                      <ArrowRight className="h-5 w-5 text-white" />
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
                <Button variant="ghost" size="sm" onClick={() => setShowChatOverlay(false)} className="h-8 w-8 p-0">
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
                        msg.from === "mechanic" ? "bg-wj-green text-white rounded-tr-sm" :
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

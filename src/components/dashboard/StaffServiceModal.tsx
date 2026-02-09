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
  AlertTriangle,
  X,
  Play,
  Bell,
  ChevronLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  { id: "inspection", label: "Inspeção", icon: "🔍" },
  { id: "diagnosis", label: "Diagnóstico", icon: "📋" },
  { id: "repair", label: "Reparo", icon: "🔧" },
  { id: "testing", label: "Teste", icon: "⚡" },
  { id: "quality", label: "Qualidade", icon: "✅" },
];

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export default function StaffServiceModal({ task, open, onClose }: StaffServiceModalProps) {
  // States
  const [repairStatus, setRepairStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [repairSeconds, setRepairSeconds] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [stepPhotos, setStepPhotos] = useState<Record<string, string>>({});
  const [revealedStep, setRevealedStep] = useState<string | null>(null);
  
  // Overlays
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  
  // Chat
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ from: string; message: string; time: string }[]>([]);
  
  // Refs & Motion
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startX = useMotionValue(0);
  const completeX = useMotionValue(0);
  const sliderWidth = 240;
  const thumbWidth = 44;
  const maxDrag = sliderWidth - thumbWidth - 4;
  
  const startBgOpacity = useTransform(startX, [0, maxDrag], [0.1, 0.4]);
  const startCheckScale = useTransform(startX, [maxDrag * 0.7, maxDrag], [0, 1]);
  const completeBgOpacity = useTransform(completeX, [0, maxDrag], [0.1, 0.4]);

  // Initialize
  useEffect(() => {
    if (task?.chat) setChatMessages(task.chat);
  }, [task]);

  // Timer
  useEffect(() => {
    if (repairStatus === "in_progress") {
      timerRef.current = setInterval(() => setRepairSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [repairStatus]);

  // Reset on open
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
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }]);
  };

  const handleStartDragEnd = () => {
    if (startX.get() >= maxDrag * 0.8) {
      animate(startX, maxDrag, { duration: 0.15 });
      setTimeout(() => {
        setRepairStatus("in_progress");
        setShowStartOverlay(false);
        animate(startX, 0, { duration: 0 });
        notifyClient("🔧 Reparo iniciado! O mecânico começou a trabalhar na sua bike.");
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
        notifyClient("✅ Reparo concluído! Sua bike está pronta para retirada.");
      }, 200);
    } else {
      animate(completeX, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const handleStepDrag = (stepId: string, info: PanInfo) => {
    if (info.offset.x < -80) {
      setRevealedStep(stepId);
    }
  };

  const handleCompleteStep = (stepId: string) => {
    const hasPhoto = !!stepPhotos[stepId];
    if (!hasPhoto) return;
    
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
    setRevealedStep(null);
    
    const stepIndex = repairSteps.findIndex(s => s.id === stepId);
    const step = repairSteps[stepIndex];
    notifyClient(`${step.icon} Etapa "${step.label}" concluída!`);
    
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
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }]);
    setChatMessage("");
  };

  if (!task) return null;

  const plan = planConfig[task.memberPlan as keyof typeof planConfig];
  const PlanIcon = plan?.icon;
  const allStepsCompleted = repairSteps.every(s => completedSteps[s.id]);
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm bg-card border-border/50 overflow-hidden p-0 rounded-2xl min-h-[400px] max-h-[85vh] flex flex-col">
        {/* Compact Header */}
        <div className="p-3 border-b border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-wj-green/10 flex items-center justify-center">
                <Bike className="h-4 w-4 text-wj-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{task.service}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{task.bikeId}</p>
              </div>
              
              {/* Timer Badge - Always visible when in progress */}
              {repairStatus === "in_progress" && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-wj-green/10 border border-wj-green/20">
                  <Clock className="h-3 w-3 text-wj-green" />
                  <span className="text-xs font-mono font-bold text-wj-green">{formatTime(repairSeconds)}</span>
                </div>
              )}
              
              {/* Chat Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatOverlay(true)}
                className="h-8 w-8 p-0 rounded-full hover:bg-wj-green/10 mr-4"
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-wj-green text-[9px] text-background flex items-center justify-center font-bold">
                    {chatMessages.length}
                  </span>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-3">
              {/* Owner Card - Compact */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/30">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-xs font-medium">
                    {getInitials(task.owner)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{task.owner}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("text-[9px] border-0 px-1.5 py-0 h-4", plan?.color)}>
                      {PlanIcon && <PlanIcon className="h-2.5 w-2.5 mr-0.5" />}
                      {plan?.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">• {task.scheduledTime}</span>
                  </div>
                </div>
              </div>

              {/* Steps Section - In Progress */}
              {repairStatus === "in_progress" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {completedCount}/{repairSteps.length} etapas
                    </span>
                    <div className="flex gap-1">
                      {repairSteps.map((step, i) => (
                        <div
                          key={step.id}
                          className={cn(
                            "w-6 h-1 rounded-full transition-colors",
                            completedSteps[step.id] ? "bg-wj-green" : 
                            i === currentStepIndex ? "bg-wj-green/40" : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Step Cards - Swipe to reveal */}
                  {repairSteps.map((step, index) => {
                    const isCompleted = completedSteps[step.id];
                    const isCurrent = index === currentStepIndex;
                    const isRevealed = revealedStep === step.id;
                    const hasPhoto = !!stepPhotos[step.id];
                    const isLocked = index > currentStepIndex && !isCompleted;

                    if (isCompleted) {
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex items-center gap-2 p-2 rounded-lg bg-wj-green/10 border border-wj-green/20"
                        >
                          <div className="w-6 h-6 rounded-full bg-wj-green flex items-center justify-center">
                            <CheckCircle2 className="h-3.5 w-3.5 text-background" />
                          </div>
                          <span className="text-xs text-wj-green font-medium">{step.label}</span>
                          <span className="ml-auto text-lg">{step.icon}</span>
                        </motion.div>
                      );
                    }

                    if (isLocked) {
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20 opacity-40"
                        >
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{step.label}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={step.id} className="relative overflow-hidden rounded-xl">
                        {/* Hidden action area */}
                        <div className="absolute inset-y-0 right-0 w-24 bg-wj-green/20 flex items-center justify-center">
                          <span className="text-[10px] text-wj-green font-medium">Concluir</span>
                        </div>

                        {/* Draggable card */}
                        <motion.div
                          drag={isCurrent && !isRevealed ? "x" : false}
                          dragConstraints={{ left: -100, right: 0 }}
                          dragElastic={0.1}
                          onDragEnd={(_, info) => handleStepDrag(step.id, info)}
                          animate={{ x: isRevealed ? -100 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className={cn(
                            "relative p-3 rounded-xl border bg-card cursor-grab active:cursor-grabbing",
                            isCurrent ? "border-wj-green/50 shadow-lg shadow-wj-green/5" : "border-border/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                              isCurrent ? "bg-wj-green/20" : "bg-muted/50"
                            )}>
                              {step.icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{step.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {isCurrent ? "← Arraste para concluir" : "Aguardando"}
                              </p>
                            </div>
                            {isCurrent && (
                              <ChevronLeft className="h-4 w-4 text-wj-green/50 animate-pulse" />
                            )}
                          </div>
                        </motion.div>

                        {/* Revealed Form */}
                        <AnimatePresence>
                          {isRevealed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/30 space-y-3"
                            >
                              {/* Photo upload */}
                              <div className="flex items-center gap-2">
                                {hasPhoto ? (
                                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden relative">
                                    <img src={stepPhotos[step.id]} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-wj-green/20 flex items-center justify-center">
                                      <CheckCircle2 className="h-5 w-5 text-wj-green" />
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handlePhotoUpload(step.id)}
                                    className="w-14 h-14 rounded-lg border-2 border-dashed border-wj-green/30 flex flex-col items-center justify-center gap-1 hover:bg-wj-green/5 transition-colors"
                                  >
                                    <Camera className="h-5 w-5 text-wj-green/70" />
                                    <span className="text-[8px] text-wj-green/70">Foto</span>
                                  </button>
                                )}
                                <div className="flex-1 text-xs text-muted-foreground">
                                  {hasPhoto ? (
                                    <span className="text-wj-green">Foto adicionada ✓</span>
                                  ) : (
                                    <span>Adicione uma foto para concluir</span>
                                  )}
                                </div>
                              </div>

                              {/* Complete button */}
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRevealedStep(null)}
                                  className="flex-1 h-9 text-xs"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteStep(step.id)}
                                  disabled={!hasPhoto}
                                  className="flex-1 h-9 text-xs bg-wj-green hover:bg-wj-green/90 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Concluir Etapa
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* Complete Swipe */}
                  {allStepsCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-3"
                    >
                      <motion.div
                        style={{ backgroundColor: `rgba(5, 140, 66, ${completeBgOpacity.get()})` }}
                        className="relative h-12 rounded-full border border-wj-green/30 overflow-hidden mx-auto max-w-[240px]"
                      >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs text-wj-green font-medium">Finalizar Serviço →</span>
                        </div>

                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: maxDrag }}
                          dragElastic={0}
                          onDragEnd={handleCompleteDragEnd}
                          style={{ x: completeX }}
                          className="absolute left-0.5 top-0.5 bottom-0.5 w-11 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
                        >
                          <ArrowRight className="h-4 w-4 text-background" />
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
                  <h3 className="text-base font-semibold text-foreground mb-1">Serviço Concluído!</h3>
                  <p className="text-2xl font-mono font-bold text-wj-green mb-2">{formatTime(repairSeconds)}</p>
                  <p className="text-[10px] text-muted-foreground">Cliente notificado automaticamente</p>
                </motion.div>
              )}
          </div>
        </div>

        {/* START OVERLAY */}
        <AnimatePresence>
          {showStartOverlay && repairStatus === "pending" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 overflow-hidden"
            >
              {/* Video Background */}
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/videos/staff-service-bg.mp4" type="video/mp4" />
              </video>
              
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="p-4 flex items-center gap-3">
                  {/* Owner Avatar - Top Left */}
                  <Avatar className="h-9 w-9 border-2 border-wj-green/30">
                    <AvatarFallback className="bg-wj-green/20 text-wj-green text-xs font-bold">
                      {getInitials(task.owner)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{task.owner}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{task.bikeId}</p>
                  </div>
                  {/* Service Icon - Top Right */}
                  <div className="w-9 h-9 rounded-xl bg-wj-green/20 flex items-center justify-center border border-wj-green/30">
                    <Bike className="h-4 w-4 text-wj-green" />
                  </div>
                </div>

                {/* Main Content - Centered */}
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-xl font-semibold text-foreground mb-1">{task.service}</h2>
                    <p className="text-[10px] text-muted-foreground/70">
                      Cliente será notificado ao iniciar
                    </p>
                  </motion.div>
                </div>

                {/* Bottom Section - Swipe */}
                <div className="p-4 pb-6">
                  {/* Full Width Swipe */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ 
                      backgroundColor: `rgba(5, 140, 66, ${startBgOpacity.get()})` 
                    }}
                    className="relative h-14 rounded-2xl border border-wj-green/30 overflow-hidden w-full"
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-sm text-wj-green/70 font-medium tracking-wide">
                        Iniciar Serviço →
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
                      dragConstraints={{ left: 0, right: 280 }}
                      dragElastic={0}
                      onDragEnd={handleStartDragEnd}
                      style={{ x: startX }}
                      className="absolute left-1 top-1 bottom-1 w-12 rounded-xl bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/40"
                    >
                      <ArrowRight className="h-5 w-5 text-background" />
                    </motion.div>
                  </motion.div>

                  {/* Cancel */}
                  <button
                    onClick={() => { setShowStartOverlay(false); onClose(); }}
                    className="w-full mt-3 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    Cancelar
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background flex flex-col"
            >
              {/* Chat Header */}
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
                  <p className="text-[10px] text-muted-foreground">Cliente</p>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda</p>
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
                           msg.from === "system" ? <Bell className="h-3 w-3" /> : "EU"}
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

              {/* Chat Input */}
              <div className="p-3 border-t border-border/30 flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Mensagem..."
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

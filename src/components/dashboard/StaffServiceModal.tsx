import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import {
  Bike,
  User,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Camera,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Star,
  Crown,
  AlertCircle,
  ImageIcon,
  X,
  Play,
  Bell
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  { id: "inspection", label: "Inspeção Inicial", description: "Verificar estado geral da bike" },
  { id: "diagnosis", label: "Diagnóstico", description: "Identificar problemas e peças necessárias" },
  { id: "repair", label: "Reparo", description: "Executar o serviço solicitado" },
  { id: "testing", label: "Teste", description: "Testar funcionamento após reparo" },
  { id: "quality", label: "Controle de Qualidade", description: "Verificação final de segurança" },
];

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const getHealthTag = (health: number) => {
  if (health >= 80) return { label: "Good", color: "bg-wj-green/20 text-wj-green" };
  if (health >= 60) return { label: "Fair", color: "bg-amber-500/20 text-amber-400" };
  return { label: "Poor", color: "bg-destructive/20 text-destructive" };
};

export default function StaffServiceModal({ task, open, onClose }: StaffServiceModalProps) {
  // Repair state
  const [repairStatus, setRepairStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [repairSeconds, setRepairSeconds] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [stepPhotos, setStepPhotos] = useState<Record<string, string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  
  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ from: string; message: string; time: string }[]>([]);
  const [chatExpanded, setChatExpanded] = useState(false);
  
  // Swipe refs
  const startConstraintsRef = useRef(null);
  const completeConstraintsRef = useRef(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Motion values for start swipe
  const startX = useMotionValue(0);
  const sliderWidth = 280;
  const thumbWidth = 48;
  const maxDrag = sliderWidth - thumbWidth - 8;
  
  const startBgColor = useTransform(
    startX,
    [0, maxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.3)"]
  );
  const startTextOpacity = useTransform(startX, [0, maxDrag * 0.5], [1, 0]);
  const startCheckOpacity = useTransform(startX, [maxDrag * 0.7, maxDrag], [0, 1]);

  // Motion values for complete swipe
  const completeX = useMotionValue(0);
  const completeBgColor = useTransform(
    completeX,
    [0, maxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.3)"]
  );
  const completeTextOpacity = useTransform(completeX, [0, maxDrag * 0.5], [1, 0]);
  const completeCheckOpacity = useTransform(completeX, [maxDrag * 0.7, maxDrag], [0, 1]);

  // Initialize chat from task
  useEffect(() => {
    if (task?.chat) {
      setChatMessages(task.chat);
    }
  }, [task]);

  // Timer logic
  useEffect(() => {
    if (repairStatus === "in_progress") {
      timerRef.current = setInterval(() => {
        setRepairSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [repairStatus]);

  // Reset state when modal opens
  useEffect(() => {
    if (open && task) {
      if (task.status === "pending") {
        setRepairStatus("pending");
        setRepairSeconds(0);
        setCompletedSteps({});
        setStepPhotos({});
        setCurrentStep(0);
      } else if (task.status === "in_progress") {
        setRepairStatus("in_progress");
      }
    }
  }, [open, task]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartDragEnd = () => {
    const currentX = startX.get();
    if (currentX >= maxDrag * 0.8) {
      animate(startX, maxDrag, { duration: 0.2 });
      setTimeout(() => {
        setRepairStatus("in_progress");
        animate(startX, 0, { duration: 0 });
        // Auto notify client
        notifyClient("Reparo iniciado! O mecânico começou a trabalhar na sua bike.");
      }, 300);
    } else {
      animate(startX, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const handleCompleteDragEnd = () => {
    if (!allStepsCompleted) {
      animate(completeX, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
      return;
    }
    
    const currentX = completeX.get();
    if (currentX >= maxDrag * 0.8) {
      animate(completeX, maxDrag, { duration: 0.2 });
      setTimeout(() => {
        setRepairStatus("completed");
        animate(completeX, 0, { duration: 0 });
        // Auto notify client
        notifyClient("Reparo concluído! Sua bike está pronta para retirada.");
      }, 300);
    } else {
      animate(completeX, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const notifyClient = (message: string) => {
    const newMessage = {
      from: "system",
      message,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleStepComplete = (stepId: string, checked: boolean) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: checked }));
    
    if (checked) {
      const stepIndex = repairSteps.findIndex(s => s.id === stepId);
      const step = repairSteps[stepIndex];
      notifyClient(`Etapa "${step.label}" concluída!`);
      
      // Auto advance to next step
      if (stepIndex < repairSteps.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
    }
  };

  const handlePhotoUpload = (stepId: string) => {
    // Simulate photo upload
    const newPhoto = "/placeholder.svg";
    setStepPhotos(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), newPhoto]
    }));
    
    const step = repairSteps.find(s => s.id === stepId);
    notifyClient(`Foto adicionada na etapa "${step?.label}".`);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      from: "mechanic",
      message: chatMessage,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage("");
  };

  const allStepsCompleted = repairSteps.every(step => completedSteps[step.id]);
  const allStepsHavePhotos = repairSteps.every(step => (stepPhotos[step.id]?.length || 0) > 0);
  const completionProgress = (Object.values(completedSteps).filter(Boolean).length / repairSteps.length) * 100;

  if (!task) return null;

  const plan = planConfig[task.memberPlan as keyof typeof planConfig];
  const PlanIcon = plan?.icon;
  const healthTag = getHealthTag(task.health);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl bg-card border-border max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                <Bike className="h-5 w-5 text-wj-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{task.service}</p>
                <p className="text-xs text-muted-foreground font-normal font-mono">{task.bikeId}</p>
              </div>
              <div className="flex gap-2 mr-8">
                <Badge className={cn("text-[10px] border-0", 
                  repairStatus === "pending" ? "bg-muted text-muted-foreground" :
                  repairStatus === "in_progress" ? "bg-amber-500/20 text-amber-500" :
                  "bg-wj-green/20 text-wj-green"
                )}>
                  {repairStatus === "pending" ? "Aguardando" : repairStatus === "in_progress" ? "Em Andamento" : "Concluído"}
                </Badge>
                <Badge className={cn("text-[10px] border-0", healthTag.color)}>
                  {healthTag.label}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar */}
          {repairStatus === "in_progress" && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="text-wj-green font-medium">{Math.round(completionProgress)}%</span>
              </div>
              <Progress value={completionProgress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Owner Info Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-sm font-medium">
                  {getInitials(task.owner)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{task.owner}</p>
                <p className="text-xs text-muted-foreground">{task.ownerEmail}</p>
              </div>
              <Badge className={cn("text-xs border-0 gap-1", plan?.color)}>
                {PlanIcon && <PlanIcon className="h-3 w-3" />}
                {plan?.label} Member
              </Badge>
            </div>

            {/* Task Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Horário Agendado</p>
                <p className="text-sm font-medium text-foreground">{task.scheduledTime}</p>
                <p className="text-xs text-muted-foreground">{task.estimatedTime}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Tempo de Reparo</p>
                <p className={cn(
                  "text-lg font-mono font-bold",
                  repairStatus === "in_progress" ? "text-wj-green" : "text-muted-foreground"
                )}>
                  {formatTime(repairSeconds)}
                </p>
              </div>
            </div>

            {/* Notes */}
            {task.notes && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Notas do Serviço</p>
                <p className="text-sm text-foreground">{task.notes}</p>
              </div>
            )}

            {/* START SWIPE - Only show when pending */}
            {repairStatus === "pending" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Deslize para iniciar o reparo
                </p>
                <motion.div
                  ref={startConstraintsRef}
                  style={{ backgroundColor: startBgColor }}
                  className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden mx-auto max-w-[280px]"
                >
                  <motion.div 
                    style={{ opacity: startTextOpacity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Play className="h-4 w-4 text-wj-green/70 mr-2" />
                    <span className="text-xs text-wj-green/70 font-medium">
                      Iniciar Reparo →
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    style={{ opacity: startCheckOpacity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <CheckCircle2 className="h-5 w-5 text-wj-green" />
                  </motion.div>

                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: maxDrag }}
                    dragElastic={0}
                    onDragEnd={handleStartDragEnd}
                    style={{ x: startX }}
                    className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
                  >
                    <ArrowRight className="h-5 w-5 text-background" />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* REPAIR STEPS - Show when in progress */}
            {repairStatus === "in_progress" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-wj-green/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-wj-green" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Etapas do Reparo</h4>
                    <p className="text-[10px] text-muted-foreground">Complete todas as etapas e adicione fotos</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {repairSteps.map((step, index) => {
                    const isCompleted = completedSteps[step.id];
                    const hasPhoto = (stepPhotos[step.id]?.length || 0) > 0;
                    const isExpanded = expandedStep === step.id;
                    const isCurrent = index === currentStep;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "rounded-xl border overflow-hidden transition-all",
                          isCompleted 
                            ? "border-wj-green/30 bg-wj-green/5" 
                            : isCurrent 
                            ? "border-wj-green/50 bg-muted/30" 
                            : "border-border/30 bg-muted/20"
                        )}
                      >
                        {/* Step Header */}
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                          className="w-full p-3 flex items-center gap-3 text-left"
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0",
                            isCompleted ? "bg-wj-green" : isCurrent ? "bg-wj-green/20 ring-2 ring-wj-green/30" : "bg-muted"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-background" />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium",
                              isCompleted ? "text-wj-green" : "text-foreground"
                            )}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {hasPhoto && (
                              <Badge variant="outline" className="text-[9px] border-wj-green/30 text-wj-green gap-1 px-1.5">
                                <ImageIcon className="h-2.5 w-2.5" />
                                {stepPhotos[step.id]?.length}
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Step Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/30">
                                {/* Photos Grid */}
                                <div className="flex flex-wrap gap-2">
                                  {stepPhotos[step.id]?.map((photo, i) => (
                                    <div key={i} className="w-16 h-16 rounded-lg bg-muted overflow-hidden relative group">
                                      <img src={photo} alt="" className="w-full h-full object-cover" />
                                      <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <X className="h-4 w-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => handlePhotoUpload(step.id)}
                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center hover:border-wj-green/50 hover:bg-wj-green/5 transition-colors"
                                  >
                                    <Camera className="h-5 w-5 text-muted-foreground" />
                                  </button>
                                </div>

                                {/* Step Checkbox */}
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                                  <Checkbox
                                    id={step.id}
                                    checked={isCompleted}
                                    onCheckedChange={(checked) => handleStepComplete(step.id, checked as boolean)}
                                    className="h-5 w-5"
                                  />
                                  <label htmlFor={step.id} className="text-sm cursor-pointer flex-1">
                                    Marcar etapa como concluída
                                  </label>
                                  {!hasPhoto && (
                                    <span className="text-[10px] text-amber-500 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Adicione uma foto
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Validation Messages */}
                {!allStepsCompleted && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-500">
                      Complete todas as etapas para finalizar o reparo
                    </p>
                  </div>
                )}

                {allStepsCompleted && !allStepsHavePhotos && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Camera className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-500">
                      Adicione pelo menos uma foto em cada etapa
                    </p>
                  </div>
                )}

                {/* COMPLETE SWIPE */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <motion.div
                    ref={completeConstraintsRef}
                    style={{ backgroundColor: allStepsCompleted ? completeBgColor : "rgba(100, 100, 100, 0.1)" }}
                    className={cn(
                      "relative h-14 rounded-full border overflow-hidden mx-auto max-w-[280px]",
                      allStepsCompleted ? "border-wj-green/30" : "border-border/30 opacity-50"
                    )}
                  >
                    <motion.div 
                      style={{ opacity: completeTextOpacity }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <CheckCircle2 className={cn("h-4 w-4 mr-2", allStepsCompleted ? "text-wj-green/70" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", allStepsCompleted ? "text-wj-green/70" : "text-muted-foreground")}>
                        Concluir Reparo →
                      </span>
                    </motion.div>
                    
                    <motion.div 
                      style={{ opacity: completeCheckOpacity }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <CheckCircle2 className="h-5 w-5 text-wj-green" />
                    </motion.div>

                    <motion.div
                      drag={allStepsCompleted ? "x" : false}
                      dragConstraints={{ left: 0, right: maxDrag }}
                      dragElastic={0}
                      onDragEnd={handleCompleteDragEnd}
                      style={{ x: completeX }}
                      className={cn(
                        "absolute left-1 top-1 bottom-1 w-12 rounded-full flex items-center justify-center shadow-lg",
                        allStepsCompleted 
                          ? "bg-wj-green cursor-grab active:cursor-grabbing shadow-wj-green/30" 
                          : "bg-muted cursor-not-allowed"
                      )}
                    >
                      <ArrowRight className={cn("h-5 w-5", allStepsCompleted ? "text-background" : "text-muted-foreground")} />
                    </motion.div>
                  </motion.div>
                  
                  {!allStepsCompleted && (
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                      Complete todas as etapas para habilitar
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* COMPLETED STATE */}
            {repairStatus === "completed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-wj-green/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-wj-green" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Reparo Concluído!</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tempo total: <span className="text-wj-green font-mono font-bold">{formatTime(repairSeconds)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  O cliente foi notificado automaticamente.
                </p>
              </motion.div>
            )}

            {/* Chat Section */}
            <div className="border-t border-border/30 pt-4 mt-4">
              <button
                onClick={() => setChatExpanded(!chatExpanded)}
                className="w-full flex items-center gap-2 text-sm font-medium text-foreground mb-3"
              >
                <MessageCircle className="h-4 w-4 text-wj-green" />
                Chat com Cliente
                <Badge variant="outline" className="text-[9px] ml-auto">
                  {chatMessages.length} mensagens
                </Badge>
                {chatExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {chatExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
                      <ScrollArea className="h-[200px] p-3">
                        <div className="space-y-2">
                          {chatMessages.map((msg, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "flex gap-2",
                                msg.from === "mechanic" ? "flex-row-reverse" : ""
                              )}
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
                                "max-w-[75%] rounded-lg px-3 py-2",
                                msg.from === "mechanic" 
                                  ? "bg-wj-green text-wj-green-foreground" 
                                  : msg.from === "system"
                                  ? "bg-blue-500/20 text-blue-400 italic"
                                  : "bg-muted"
                              )}>
                                <p className="text-[11px]">{msg.message}</p>
                                <p className="text-[9px] opacity-70">{msg.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="p-2 border-t border-border/30 flex gap-2">
                        <Input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Digite uma mensagem..."
                          className="h-9 text-xs bg-background"
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleSendMessage}
                          className="h-9 px-3 bg-wj-green hover:bg-wj-green/90"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Wrench, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, ArrowRight, Crown, ChevronDown, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth, MemberTier } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Mock available dates (next 30 days, excluding weekends)
const getAvailableDates = () => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(date);
    }
  }
  return dates;
};

// Mock booked dates
const bookedDates = [
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
];

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
];

const serviceTypes = [
  { id: "tune-up", label: "Full Tune-Up", description: "Complete inspection & adjustment" },
  { id: "brakes", label: "Brake Service", description: "Brake pads & adjustment" },
  { id: "battery", label: "Battery Check", description: "Health analysis & optimization" },
  { id: "drivetrain", label: "Drivetrain", description: "Chain, gears & motor" },
  { id: "other", label: "Other", description: "Describe your needs" },
];

const membershipPlans = [
  {
    tier: "light" as MemberTier,
    name: "E-Pass Light",
    label: "Essential",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Basic coverage for casual riders",
    features: ["Basic support", "Standard warranty", "Community access"],
    videoSrc: "/videos/member-pass-light-bg.mp4",
  },
  {
    tier: "black" as MemberTier,
    name: "E-Pass Black",
    label: "Elite",
    monthlyPrice: 24.99,
    annualPrice: 199.99, // ~33% discount
    description: "VIP treatment for dedicated riders",
    features: ["24/7 VIP support", "Lifetime warranty", "Free services", "Valet pick-up", "Priority scheduling"],
    videoSrc: "/videos/member-pass-bg.mp4",
  },
  {
    tier: "plus" as MemberTier,
    name: "E-Pass Plus",
    label: "Premium",
    monthlyPrice: 12.99,
    annualPrice: 99.99, // ~36% discount
    description: "Enhanced benefits for regular riders",
    features: ["Priority support", "Extended warranty", "Service discounts", "Calendar booking"],
    videoSrc: "/videos/member-pass-plus-bg.mp4",
  },
];

const TOTAL_STEPS = 3;

export default function ServiceCalendarCompact() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MemberTier | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(1); // 0=light, 1=black, 2=plus
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnnualBilling, setIsAnnualBilling] = useState(true);
  const [isSwipeCompleted, setIsSwipeCompleted] = useState(false);
  
  // Swipe-to-upgrade motion values
  const swipeConstraintsRef = useRef(null);
  const swipeX = useMotionValue(0);
  const swipeSliderWidth = 260;
  const swipeThumbWidth = 48;
  const swipeMaxDrag = swipeSliderWidth - swipeThumbWidth - 8;
  
  const swipeBgColor = useTransform(
    swipeX,
    [0, swipeMaxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.4)"]
  );
  const swipeTextOpacity = useTransform(swipeX, [0, swipeMaxDrag * 0.4], [1, 0]);
  const swipeCheckOpacity = useTransform(swipeX, [swipeMaxDrag * 0.7, swipeMaxDrag], [0, 1]);

  const handleSwipeDragEnd = () => {
    const currentX = swipeX.get();
    if (currentX >= swipeMaxDrag * 0.75) {
      animate(swipeX, swipeMaxDrag, { duration: 0.2 });
      setIsSwipeCompleted(true);
      setTimeout(() => {
        navigate("/membership-plans");
      }, 400);
    } else {
      animate(swipeX, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };
  
  const availableDates = getAvailableDates();
  const userTier = user?.tier || "light";

  // Card order based on active index (carousel logic)
  const cardOrder: MemberTier[] = ["light", "black", "plus"];
  
  const handleCardClick = (tier: MemberTier) => {
    if (isAnimating) return;
    
    const tierIndex = cardOrder.indexOf(tier);
    if (tierIndex === activeCardIndex) {
      // Already centered, just select
      setSelectedPlan(tier);
      return;
    }
    
    setIsAnimating(true);
    setActiveCardIndex(tierIndex);
    setSelectedPlan(tier);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  // Get card position and rotation based on active index
  const getCardTransform = (cardIndex: number) => {
    const diff = cardIndex - activeCardIndex;
    
    // Normalize for circular rotation
    let normalizedDiff = diff;
    if (diff > 1) normalizedDiff = diff - 3;
    if (diff < -1) normalizedDiff = diff + 3;
    
    if (normalizedDiff === 0) {
      // Center card - prominent and in front
      return {
        x: 0,
        y: 0,
        rotateY: 0,
        scale: 1.05,
        z: 100,
        opacity: 1,
      };
    } else if (normalizedDiff === -1 || (activeCardIndex === 0 && cardIndex === 2)) {
      // Left card - visible and clickable
      return {
        x: -90,
        y: 10,
        rotateY: 30,
        scale: 0.8,
        z: 50,
        opacity: 0.85,
      };
    } else {
      // Right card - visible and clickable
      return {
        x: 90,
        y: 10,
        rotateY: -30,
        scale: 0.8,
        z: 50,
        opacity: 0.85,
      };
    }
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isDateAvailable(date) && !isDateBooked(date)) {
      setSelectedDate(date);
      
      // Check if user is Light tier - show upgrade modal
      if (userTier === "light") {
        setIsUpgradeModalOpen(true);
        setSelectedPlan(null);
      } else {
        // Plus or Black tier - proceed with booking
        setIsModalOpen(true);
        setCurrentStep(1);
        setSelectedTime("");
        setSelectedService("");
        setAdditionalNotes("");
      }
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedTime;
      case 2:
        return !!selectedService;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsModalOpen(false);
    
    toast({
      title: "Service Booked!",
      description: `Your ${serviceTypes.find(s => s.id === selectedService)?.label} is scheduled for ${format(selectedDate, "MMMM d")} at ${selectedTime}.`,
    });
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="h-full"
      >
        <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-wj-green" />
              Book a Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calendar with custom styles for active state */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className={cn("rounded-xl border border-border/30 pointer-events-auto")}
                classNames={{
                  day_selected: "bg-wj-green text-white rounded-full hover:bg-wj-green-dark focus:bg-wj-green",
                }}
                modifiers={{
                  available: (date) => isDateAvailable(date) && !isDateBooked(date),
                  booked: (date) => isDateBooked(date),
                }}
                modifiersStyles={{
                  available: {
                    backgroundColor: "hsl(var(--wj-green) / 0.15)",
                    color: "hsl(var(--wj-green))",
                    cursor: "pointer",
                    borderRadius: "9999px",
                  },
                  booked: {
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    color: "hsl(var(--primary))",
                    fontWeight: "bold",
                    borderRadius: "9999px",
                  },
                }}
                modifiersClassNames={{
                  available: "hover:bg-wj-green hover:text-white transition-colors",
                }}
                disabled={(date) => 
                  date < new Date() || 
                  (!isDateAvailable(date) && !isDateBooked(date))
                }
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-wj-green/20 border border-wj-green/30" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/30" />
                <span>Booked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Modal for Light Members */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden p-0">
          {/* Scrollable Container with Hidden Scrollbar */}
          <div className="overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="p-6 pb-0">
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Crown className="h-5 w-5 text-wj-green" />
                    Upgrade Membership
                  </DialogTitle>
                  
                  {/* Billing Toggle in Header */}
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 border border-border/30">
                    <span className={cn(
                      "text-xs transition-colors",
                      !isAnnualBilling ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      Mo
                    </span>
                    <Switch
                      checked={isAnnualBilling}
                      onCheckedChange={setIsAnnualBilling}
                      className="data-[state=checked]:bg-wj-green h-5 w-9"
                    />
                    <span className={cn(
                      "text-xs transition-colors",
                      isAnnualBilling ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      Yr
                    </span>
                  </div>
                </div>
                <DialogDescription className="text-center text-xs mt-2">
                  Upgrade your E-Pass to schedule services directly.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* 3D Carousel Container */}
            <div 
              className="relative flex items-center justify-center py-10 px-4 min-h-[360px] sm:min-h-[420px]" 
              style={{ 
                perspective: "1000px",
              }}
            >
              {/* Cards Container */}
              <div 
                className="relative w-full max-w-lg flex items-center justify-center h-72"
                style={{ 
                  transformStyle: "preserve-3d",
                }}
              >
                {cardOrder.map((tier, index) => {
                  const plan = membershipPlans.find(p => p.tier === tier)!;
                  const transform = getCardTransform(index);
                  const isCenter = index === activeCardIndex;
                  
                  return (
                    <motion.div
                      key={tier}
                      initial={false}
                      animate={{
                        x: transform.x,
                        y: transform.y,
                        rotateY: transform.rotateY,
                        scale: transform.scale,
                        opacity: transform.opacity,
                      }}
                      transition={{ 
                        duration: 0.6, 
                        type: "spring", 
                        stiffness: 70,
                        damping: 12
                      }}
                      whileHover={!isCenter ? { 
                        scale: transform.scale + 0.05,
                        opacity: 1,
                        transition: { duration: 0.2 }
                      } : undefined}
                      onClick={() => handleCardClick(tier)}
                      className={cn(
                        "absolute w-32 h-52 sm:w-40 sm:h-64 md:w-44 md:h-72 rounded-2xl cursor-pointer group",
                        isCenter && "ring-2 ring-wj-green/60 ring-offset-4 ring-offset-background"
                      )}
                      style={{ 
                        zIndex: isCenter ? 100 : 10,
                        transformStyle: "flat", // Prevents 3D context from affecting children
                        backfaceVisibility: "hidden",
                        boxShadow: isCenter 
                          ? "0 30px 50px -15px rgba(0, 0, 0, 0.6), 0 15px 30px -10px rgba(5, 140, 66, 0.25)" 
                          : "0 15px 30px -10px rgba(0, 0, 0, 0.35)",
                        filter: isCenter ? "none" : "brightness(0.85)",
                      }}
                    >
                      {/* Animated Border for Black Card */}
                      {tier === "black" && (
                        <div 
                          className="absolute -inset-[1px] rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                          style={{
                            background: "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(0,0,0,0.2), rgba(255,255,255,0.3), rgba(0,0,0,0.1), rgba(255,255,255,0.2))",
                            backgroundSize: "400% 100%",
                            animation: "borderGlow 8s linear infinite",
                            zIndex: 0,
                          }}
                        />
                      )}
                      
                      {/* Card Face - All content in a flat 2D context */}
                      <div 
                        className="absolute inset-0 rounded-2xl overflow-hidden isolate"
                        style={{ 
                          backfaceVisibility: "hidden",
                          transform: "translate3d(0,0,0)",
                          willChange: "transform",
                        }}
                      >
                        {/* Video Background - lowest layer */}
                        <video
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          style={{ zIndex: 1, transform: "translate3d(0,0,0)" }}
                        >
                          <source src={plan.videoSrc} type="video/mp4" />
                        </video>
                        
                        {/* Gradient Overlay - middle layer */}
                        <div 
                          className={cn(
                            "absolute inset-0 pointer-events-none",
                            tier === "light" 
                              ? "bg-gradient-to-t from-black/60 via-black/20 to-transparent" 
                              : "bg-gradient-to-t from-black/70 via-black/30 to-black/10"
                          )} 
                          style={{ zIndex: 2, transform: "translate3d(0,0,0)" }}
                        />
                        
                        {/* Selected Indicator */}
                        {selectedPlan === tier && isCenter && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-6 h-6 bg-wj-green rounded-full flex items-center justify-center"
                            style={{ zIndex: 10 }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                        
                        {/* Card Content - top layer */}
                        <div 
                          className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between"
                          style={{ 
                            zIndex: 5,
                            transform: "translate3d(0,0,1px)",
                            willChange: "transform",
                          }}
                        >
                          <div className="flex flex-col gap-2">
                            <span className={cn(
                              "text-xs sm:text-sm font-bold tracking-wide",
                              tier === "light" ? "text-zinc-800" : "text-white"
                            )}>
                              WJ VISION
                            </span>
                            <span className={cn(
                              "text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit",
                              tier === "light" 
                                ? "bg-zinc-800/20 text-zinc-800 border border-zinc-800/20" 
                                : tier === "black"
                                  ? "bg-white/10 text-white/90 border border-white/20"
                                  : "bg-white/20 text-white border border-white/30"
                            )}>
                              {tier.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <p className={cn(
                              "text-[9px] sm:text-[10px]",
                              tier === "light" ? "text-zinc-600" : "text-white/60"
                            )}>
                              Member
                            </p>
                            <p className={cn(
                              "text-sm sm:text-base font-semibold",
                              tier === "light" ? "text-zinc-800" : "text-white"
                            )}>
                              {plan.label}
                            </p>
                            <p className={cn(
                              "text-lg sm:text-xl font-bold mt-1",
                              tier === "light" ? "text-zinc-900" : "text-white"
                            )}>
                              {plan.monthlyPrice === 0 ? (
                                "Free"
                              ) : (
                                <>
                                  €{(plan.annualPrice / 12).toFixed(0)}
                                  <span className="text-[10px] sm:text-xs font-normal opacity-70">/mo</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* CSS Animation for Border Glow */}
            <style>{`
              @keyframes borderGlow {
                0% { background-position: 0% 50%; }
                100% { background-position: 300% 50%; }
              }
            `}</style>

            {/* Current Plan Badge */}
            <div className="flex justify-center -mt-4 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/40">
                <span className="text-xs text-muted-foreground">Current Plan:</span>
                <span className="text-xs font-semibold text-foreground capitalize">{userTier}</span>
              </div>
            </div>

            {/* Scroll Indicator - Animated */}
            <motion.div 
              className="flex flex-col items-center justify-center py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-xs text-muted-foreground mb-1">Scroll for details</span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </motion.div>

            {/* Plan Details - Shows when card is selected and centered */}
            <AnimatePresence mode="wait">
              {selectedPlan && (
                <motion.div
                  key={selectedPlan}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mx-4 space-y-4"
                >
                  {(() => {
                    const plan = membershipPlans.find(p => p.tier === selectedPlan);
                    if (!plan) return null;
                    
                    const displayPrice = isAnnualBilling 
                      ? (plan.annualPrice / 12) 
                      : plan.monthlyPrice;
                    const savingsPercent = plan.monthlyPrice > 0 
                      ? Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100)
                      : 0;
                    const isCurrentPlan = userTier === selectedPlan;
                    
                    return (
                      <>
                        {/* Minimalist Plan Card */}
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/20">
                          {/* Plan Name + Current Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg text-foreground">
                              {plan.name}
                            </h4>
                            {isCurrentPlan && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-wj-green/20 text-wj-green">
                                Current
                              </span>
                            )}
                          </div>

                          {/* Price Display */}
                          {plan.monthlyPrice > 0 ? (
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className="text-3xl font-bold text-foreground">
                                €{displayPrice.toFixed(0)}
                              </span>
                              <span className="text-sm text-muted-foreground">/mo</span>
                              {isAnnualBilling && (
                                <span className="ml-2 text-xs text-wj-green font-medium">
                                  Save {savingsPercent}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className="text-3xl font-bold text-foreground">Free</span>
                            </div>
                          )}


                          {/* Features - Compact List */}
                          <div className="mt-4 space-y-1.5">
                            {plan.features.slice(0, 4).map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-foreground/70">
                                <Check className="h-3.5 w-3.5 text-wj-green flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                            {plan.features.length > 4 && (
                              <p className="text-xs text-muted-foreground pl-5">
                                +{plan.features.length - 4} more benefits
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Swipe to Upgrade or Current Plan */}
                        {!isCurrentPlan && selectedPlan !== "light" ? (
                          <motion.div
                            ref={swipeConstraintsRef}
                            style={{ backgroundColor: swipeBgColor }}
                            className="relative h-12 rounded-full border border-wj-green/30 overflow-hidden"
                          >
                            {/* Hint Text */}
                            <motion.div 
                              style={{ opacity: swipeTextOpacity }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                              <span className="text-xs text-wj-green/70 font-medium tracking-wide">
                                Slide to upgrade →
                              </span>
                            </motion.div>
                            
                            {/* Success Check */}
                            <motion.div 
                              style={{ opacity: swipeCheckOpacity }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                              <CheckCircle2 className="h-5 w-5 text-wj-green" />
                            </motion.div>

                            {/* Draggable Thumb */}
                            <motion.div
                              drag="x"
                              dragConstraints={{ left: 0, right: swipeMaxDrag }}
                              dragElastic={0}
                              onDragEnd={handleSwipeDragEnd}
                              style={{ x: swipeX }}
                              className="absolute left-1 top-1 bottom-1 w-10 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
                            >
                              <ArrowRight className="h-4 w-4 text-background" />
                            </motion.div>
                          </motion.div>
                        ) : isCurrentPlan ? (
                          <div className="h-12 rounded-full bg-muted/30 border border-border/20 flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">Current Plan</span>
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close Button - Sticky Footer */}
            <div className="sticky bottom-0 flex items-center justify-center p-4 bg-gradient-to-t from-background via-background to-transparent">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  setSelectedPlan(null);
                  setActiveCardIndex(1);
                  setIsSwipeCompleted(false);
                  swipeX.set(0);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal - Step by Step */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Wrench className="h-5 w-5 text-wj-green" />
              Schedule Service
            </DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <span className="text-wj-green font-medium">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    currentStep === step
                      ? "bg-wj-green text-white"
                      : currentStep > step
                      ? "bg-wj-green/20 text-wj-green"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-1 transition-colors",
                      currentStep > step ? "bg-wj-green" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[280px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={currentStep}>
              <motion.div
                key={currentStep}
                custom={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Step 1: Time Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-wj-green/10 flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-6 w-6 text-wj-green" />
                      </div>
                      <Label className="text-lg font-medium">
                        What time works for you?
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select your preferred time slot
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          size="lg"
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "transition-all h-14 text-base",
                            selectedTime === time 
                              ? "bg-wj-green hover:bg-wj-green-dark text-white ring-2 ring-wj-green/30" 
                              : "hover:border-wj-green/50"
                          )}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Service Type */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-wj-green/10 flex items-center justify-center mx-auto mb-3">
                        <Wrench className="h-6 w-6 text-wj-green" />
                      </div>
                      <Label className="text-lg font-medium">
                        What service do you need?
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose the type of service
                      </p>
                    </div>
                    <RadioGroup
                      value={selectedService}
                      onValueChange={setSelectedService}
                      className="space-y-2"
                    >
                      {serviceTypes.map((service) => (
                        <div
                          key={service.id}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                            selectedService === service.id
                              ? "border-wj-green bg-wj-green/10"
                              : "border-border/30 hover:border-wj-green/50"
                          )}
                          onClick={() => setSelectedService(service.id)}
                        >
                          <RadioGroupItem value={service.id} id={service.id} />
                          <div className="flex-1">
                            <Label htmlFor={service.id} className="text-sm font-medium cursor-pointer">
                              {service.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {service.description}
                            </p>
                          </div>
                          {selectedService === service.id && (
                            <CheckCircle2 className="h-4 w-4 text-wj-green" />
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Step 3: Additional Notes */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-wj-green/10 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="h-6 w-6 text-wj-green" />
                      </div>
                      <Label className="text-lg font-medium">
                        Anything else?
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Optional: Add any specific details
                      </p>
                    </div>
                    <Textarea
                      placeholder="Describe any specific issues or requests..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="min-h-[120px] resize-none bg-muted/30 border-border/30 focus:border-wj-green/50"
                    />

                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Booking Summary
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{selectedDate && format(selectedDate, "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium text-wj-green">
                          {serviceTypes.find(s => s.id === selectedService)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(
                "transition-opacity",
                currentStep === 1 && "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-wj-green hover:bg-wj-green-dark text-white"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-wj-green hover:bg-wj-green-dark text-white"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

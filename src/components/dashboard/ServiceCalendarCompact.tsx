import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Wrench, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, ArrowRight, Crown } from "lucide-react";
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
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth, MemberTier } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

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
    price: "Free",
    description: "Basic coverage for casual riders",
    features: ["Basic support", "Standard warranty", "Community access"],
    style: {
      background: "linear-gradient(135deg, #F3EFF5 0%, #e8e4ea 50%, #ddd8df 100%)",
      textColor: "#08150D",
      shadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)",
    },
  },
  {
    tier: "plus" as MemberTier,
    name: "E-Pass Plus",
    label: "Premium",
    price: "€9.99/mo",
    description: "Enhanced benefits for regular riders",
    features: ["Priority support", "Extended warranty", "Service discounts", "Calendar booking"],
    style: {
      background: "linear-gradient(135deg, #058C42 0%, #047a3a 50%, #036830 100%)",
      textColor: "#ffffff",
      shadow: "0 20px 40px -15px rgba(5, 140, 66, 0.5)",
    },
  },
  {
    tier: "black" as MemberTier,
    name: "E-Pass Black",
    label: "Elite",
    price: "€19.99/mo",
    description: "VIP treatment for dedicated riders",
    features: ["24/7 VIP support", "Lifetime warranty", "Free services", "Valet pick-up", "Priority scheduling"],
    style: {
      background: "linear-gradient(135deg, #0a0a0a 0%, #020202 50%, #000000 100%)",
      textColor: "#ffffff",
      shadow: "0 25px 50px -15px rgba(0, 0, 0, 0.8)",
    },
  },
];

const TOTAL_STEPS = 3;

export default function ServiceCalendarCompact() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MemberTier | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const availableDates = getAvailableDates();
  const userTier = user?.tier || "light";

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
        <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-wj-green" />
              Upgrade Your Membership
            </DialogTitle>
            <DialogDescription className="text-center">
              Calendar booking is a premium feature. Upgrade your E-Pass to schedule services directly.
            </DialogDescription>
          </DialogHeader>

          {/* Cards Container */}
          <div 
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 py-6" 
            style={{ perspective: "1500px" }}
          >
            {membershipPlans.map((plan, index) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: plan.tier === "black" ? 1.05 : 0.95, 
                  y: -10,
                  rotateY: plan.tier === "light" ? 5 : plan.tier === "plus" ? -5 : 0,
                }}
                onClick={() => setSelectedPlan(plan.tier)}
                className={cn(
                  "relative cursor-pointer transition-all duration-300",
                  plan.tier === "black" 
                    ? "w-64 h-44 md:w-72 md:h-52 z-20" 
                    : "w-56 h-36 md:w-64 md:h-40 z-10",
                  plan.tier === "light" && "md:-mr-6",
                  plan.tier === "plus" && "md:-ml-6",
                  selectedPlan === plan.tier && "ring-2 ring-wj-green ring-offset-2 ring-offset-background"
                )}
                style={{ 
                  transformStyle: "preserve-3d",
                  borderRadius: "1rem",
                }}
              >
                {/* Card Background */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: plan.style.background,
                    boxShadow: plan.style.shadow,
                  }}
                />

                {/* Selected Indicator */}
                {selectedPlan === plan.tier && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-wj-green rounded-full flex items-center justify-center z-30"
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </motion.div>
                )}

                {/* Card Content */}
                <div 
                  className="absolute inset-0 p-4 flex flex-col justify-between rounded-2xl border border-white/10"
                  style={{ color: plan.style.textColor }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold">WJ VISION</span>
                    <span 
                      className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: plan.tier === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.15)",
                      }}
                    >
                      {plan.name.toUpperCase().replace("E-PASS ", "")}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60">Member</p>
                    <p className="text-sm font-medium">{plan.label}</p>
                    <p className="text-lg font-bold mt-1">{plan.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Plan Details */}
          <AnimatePresence mode="wait">
            {selectedPlan && (
              <motion.div
                key={selectedPlan}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 rounded-2xl bg-muted/30 border border-border/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">
                    {membershipPlans.find(p => p.tier === selectedPlan)?.name}
                  </h4>
                  <span className="text-wj-green font-bold">
                    {membershipPlans.find(p => p.tier === selectedPlan)?.price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {membershipPlans.find(p => p.tier === selectedPlan)?.description}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {membershipPlans.find(p => p.tier === selectedPlan)?.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 text-wj-green flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={() => setIsUpgradeModalOpen(false)}
            >
              Maybe Later
            </Button>
            
            {selectedPlan && selectedPlan !== "light" ? (
              <Link to="/membership-plans">
                <Button className="bg-wj-green hover:bg-wj-green-dark text-white">
                  Upgrade to {membershipPlans.find(p => p.tier === selectedPlan)?.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button disabled className="opacity-50">
                Select a Plan
              </Button>
            )}
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

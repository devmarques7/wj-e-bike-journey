import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Wrench, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
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

const TOTAL_STEPS = 3;

export default function ServiceCalendarCompact() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const availableDates = getAvailableDates();

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
      setIsModalOpen(true);
      // Reset form
      setCurrentStep(1);
      setSelectedTime("");
      setSelectedService("");
      setAdditionalNotes("");
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
        return true; // Notes are optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
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
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className={cn("rounded-xl border border-border/30 pointer-events-auto")}
                modifiers={{
                  available: (date) => isDateAvailable(date) && !isDateBooked(date),
                  booked: (date) => isDateBooked(date),
                }}
                modifiersStyles={{
                  available: {
                    backgroundColor: "hsl(var(--wj-green) / 0.1)",
                    color: "hsl(var(--wj-green))",
                    cursor: "pointer",
                  },
                  booked: {
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    color: "hsl(var(--primary))",
                    fontWeight: "bold",
                  },
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
                <div className="w-3 h-3 rounded bg-wj-green/20 border border-wj-green/30" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
                <span>Booked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const timeSlots = [
  "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"
];

const serviceTypes = [
  { id: "spring-clean", name: "Spring Deep Clean", duration: "2-3 hours", price: "€49" },
  { id: "safety-audit", name: "Safety Audit", duration: "1-2 hours", price: "€29" },
  { id: "battery-check", name: "Battery Diagnostic", duration: "1 hour", price: "€19" },
  { id: "full-service", name: "Full Service", duration: "4-5 hours", price: "€89" },
];

export default function ServiceBooking() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<"dropoff" | "valet">("dropoff");
  const [isBooked, setIsBooked] = useState(false);

  const isBlackTier = user?.tier === "black";

  const handleBook = () => {
    setIsBooked(true);
    setTimeout(() => setIsBooked(false), 3000);
  };

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate(),
      full: date.toISOString().split("T")[0],
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wj-green/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-wj-green" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">Book Service</h3>
            <p className="text-sm text-muted-foreground">Workshop Concierge</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Service Type */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Service Type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {serviceTypes.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  selectedService === service.id
                    ? "border-wj-green bg-wj-green/10"
                    : "border-border/50 hover:border-border"
                )}
              >
                <p className="text-sm font-medium text-foreground">{service.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{service.duration}</span>
                  <span className="text-xs font-medium text-wj-green">{service.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Select Date
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {dates.map((d) => (
              <button
                key={d.full}
                onClick={() => setSelectedDate(d.full)}
                className={cn(
                  "flex-shrink-0 w-14 py-3 rounded-lg border text-center transition-all",
                  selectedDate === d.full
                    ? "border-wj-green bg-wj-green/10"
                    : "border-border/50 hover:border-border"
                )}
              >
                <p className="text-xs text-muted-foreground">{d.day}</p>
                <p className="text-lg font-light text-foreground">{d.date}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Available Slots
          </p>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm transition-all",
                  selectedTime === time
                    ? "border-wj-green bg-wj-green/10 text-wj-green"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Type - Only for Black tier */}
        {isBlackTier && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Delivery Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliveryType("dropoff")}
                className={cn(
                  "p-4 rounded-lg border flex items-center gap-3 transition-all",
                  deliveryType === "dropoff"
                    ? "border-wj-green bg-wj-green/10"
                    : "border-border/50"
                )}
              >
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Drop-off</p>
                  <p className="text-xs text-muted-foreground">Bring to store</p>
                </div>
              </button>
              <button
                onClick={() => setDeliveryType("valet")}
                className={cn(
                  "p-4 rounded-lg border flex items-center gap-3 transition-all",
                  deliveryType === "valet"
                    ? "border-wj-green bg-wj-green/10"
                    : "border-border/50"
                )}
              >
                <Truck className="h-5 w-5 text-wj-green" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Valet Pick-up</p>
                  <p className="text-xs text-wj-green">VIP Service</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Book Button */}
        <AnimatePresence mode="wait">
          {isBooked ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-wj-green text-white"
            >
              <Check className="h-5 w-5" />
              <span className="font-medium">Booking Confirmed!</span>
            </motion.div>
          ) : (
            <motion.div key="button">
              <Button
                onClick={handleBook}
                disabled={!selectedService || !selectedDate || !selectedTime}
                className="w-full gradient-wj h-12"
              >
                <Clock className="h-4 w-4 mr-2" />
                Confirm Booking
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

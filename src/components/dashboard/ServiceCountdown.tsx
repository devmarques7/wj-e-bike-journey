import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import bikeV8Side from "@/assets/bike-v8-side.png";

export default function ServiceCountdown() {
  const { user } = useAuth();
  
  // Mock service data - last service was 45 days ago, next in 45 days
  const lastServiceDate = new Date();
  lastServiceDate.setDate(lastServiceDate.getDate() - 45);
  
  const nextServiceDate = new Date();
  nextServiceDate.setDate(nextServiceDate.getDate() + 45);

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const diff = nextServiceDate.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const daysSinceLastService = Math.floor(
    (new Date().getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={bikeV8Side}
          alt="Bike"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
      </div>

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-wj-green" />
            <span className="text-sm font-medium text-foreground">Service Countdown</span>
          </div>

          {/* Last Service Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 mb-4">
            <CheckCircle className="h-5 w-5 text-wj-green" />
            <div>
              <p className="text-xs text-muted-foreground">Last Service</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(lastServiceDate)} ({daysSinceLastService} days ago)
              </p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Next Service In
          </p>
          <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hours" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Sec" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <span className="text-2xl font-bold text-wj-green">
                  {item.value.toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next Service Date */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-wj-green/10 border border-wj-green/20">
          <Calendar className="h-4 w-4 text-wj-green" />
          <span className="text-sm text-foreground">
            Scheduled: <span className="font-medium text-wj-green">{formatDate(nextServiceDate)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

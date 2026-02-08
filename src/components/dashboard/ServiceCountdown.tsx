import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle } from "lucide-react";
import UnicornBackground from "./UnicornBackground";

export default function ServiceCountdown() {
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
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden border border-border/30"
    >
      {/* UnicornStudio Background */}
      <div className="absolute inset-0">
        <UnicornBackground projectId="7R4lXYT5Qs1xTmsAJTwf" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-wj-green" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Service Countdown
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-wj-green/10 border border-wj-green/20">
            <CheckCircle className="h-3 w-3 text-wj-green" />
            <span className="text-xs text-wj-green">{daysSinceLastService}d ago</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="grid grid-cols-4 gap-2 w-full max-w-[280px]">
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hrs" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Sec" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <span className="text-3xl font-bold text-foreground tabular-nums">
                  {item.value.toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next Service Date */}
        <div className="flex items-center justify-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Next: <span className="text-foreground font-medium">{formatDate(nextServiceDate)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

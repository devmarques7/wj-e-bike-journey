import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import serviceBikeOverlay from "@/assets/service-bike-overlay.png";

export default function ServiceCountdown() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Mock service data - last service was 45 days ago, next in 45 days (90 day cycle)
  const serviceCycleDays = 90;
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

  const [progressPercent, setProgressPercent] = useState(50);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const diff = nextServiceDate.getTime() - now.getTime();
      const totalCycleMs = serviceCycleDays * 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - lastServiceDate.getTime();
      
      // Progress decreases as we approach maintenance (100% = just serviced, 0% = needs service now)
      const remaining = Math.max(0, Math.min(100, ((totalCycleMs - elapsedMs) / totalCycleMs) * 100));
      setProgressPercent(remaining);

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Video loop handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime < 0.5) {
        video.style.opacity = "0";
        setTimeout(() => {
          video.currentTime = 0;
          video.play();
          video.style.opacity = "1";
        }, 300);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
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

  // Determine if urgent (less than 20% remaining)
  const isUrgent = progressPercent < 20;
  const isCritical = progressPercent < 5;

  // Dynamic color classes based on progress
  const getStatusColor = () => {
    if (isCritical) return "text-destructive";
    if (isUrgent) return "text-amber-500";
    return "text-wj-green";
  };

  const getProgressColor = () => {
    if (isCritical) return "bg-destructive";
    if (isUrgent) return "bg-amber-500";
    return "bg-wj-green";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden"
    >
      {/* Layer 1: Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
      >
        <source src="/videos/service-countdown-bg.mp4" type="video/mp4" />
      </video>

      {/* Layer 2: Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />

      {/* Layer 3: Bike Image Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src={serviceBikeOverlay}
          alt="Bike"
          className="w-full h-full object-contain opacity-30 scale-110"
        />
      </div>

      {/* Layer 4: Additional gradient for content readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

      {/* Content Layer */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            {isUrgent ? (
              <AlertTriangle className={cn("h-5 w-5", getStatusColor())} />
            ) : (
              <Clock className="h-5 w-5 text-wj-green" />
            )}
            <span className={cn("text-sm font-medium", isUrgent ? getStatusColor() : "text-foreground")}>
              Service Countdown
            </span>
          </div>

          {/* Last Service Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 backdrop-blur-sm mb-4">
            <CheckCircle className="h-5 w-5 text-wj-green" />
            <div>
              <p className="text-xs text-muted-foreground">Last Service</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(lastServiceDate)} ({daysSinceLastService} days ago)
              </p>
            </div>
          </div>

          {/* Progress Bar - Discharging */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={cn("font-medium", getStatusColor())}>
                {isCritical ? "Maintenance Required!" : isUrgent ? "Maintenance Soon" : "Service Health"}
              </span>
              <span className={cn("font-bold", getStatusColor())}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                className={cn("h-full rounded-full transition-colors", getProgressColor())}
              />
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <p className={cn("text-xs uppercase tracking-wider mb-4", isUrgent ? getStatusColor() : "text-muted-foreground")}>
            {isCritical ? "Overdue!" : "Next Service In"}
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
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl backdrop-blur-sm border",
                  isUrgent 
                    ? "bg-destructive/10 border-destructive/30" 
                    : "bg-muted/30 border-border/30"
                )}
              >
                <span className={cn("text-2xl font-bold", getStatusColor())}>
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
        <div className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-xl border backdrop-blur-sm",
          isUrgent 
            ? "bg-destructive/10 border-destructive/30" 
            : "bg-wj-green/10 border-wj-green/20"
        )}>
          <Calendar className={cn("h-4 w-4", getStatusColor())} />
          <span className="text-sm text-foreground">
            Scheduled: <span className={cn("font-medium", getStatusColor())}>{formatDate(nextServiceDate)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

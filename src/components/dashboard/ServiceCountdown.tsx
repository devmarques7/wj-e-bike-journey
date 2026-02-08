import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import serviceBikeCorner from "@/assets/service-bike-corner.png";

export default function ServiceCountdown() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  
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
  const totalBars = 14;
  const filledBars = Math.round((progressPercent / 100) * totalBars);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const diff = nextServiceDate.getTime() - now.getTime();
      const totalCycleMs = serviceCycleDays * 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - lastServiceDate.getTime();
      
      // Progress decreases as we approach maintenance
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

  const isUrgent = progressPercent < 20;
  const isCritical = progressPercent < 5;

  const getBarColor = (index: number) => {
    const isActive = index < filledBars;
    if (!isActive) return "bg-muted/30";
    if (isCritical) return "bg-destructive";
    if (isUrgent) return "bg-amber-500";
    return "bg-wj-green";
  };

  const getStatusColor = () => {
    if (isCritical) return "text-destructive";
    if (isUrgent) return "text-amber-500";
    return "text-wj-green";
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) {
      navigate("/dashboard/service-booking");
    }
    setDragX(0);
    setIsDragging(false);
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
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />

      {/* Layer 3: Bike Image - Bottom Right Corner */}
      <div className="absolute bottom-0 right-0 w-[70%] h-[60%] pointer-events-none">
        <img
          src={serviceBikeCorner}
          alt="Bike"
          className="w-full h-full object-contain object-bottom opacity-60"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        {/* Header - Minimal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusColor().replace("text-", "bg-"))} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Service Health
            </span>
          </div>
          <span className={cn("text-sm font-bold", getStatusColor())}>
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Countdown Timer - Centered & Minimal */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className={cn("text-5xl font-bold tracking-tight", getStatusColor())}>
                {countdown.days}
              </span>
              <span className="text-lg text-muted-foreground">d</span>
              <span className={cn("text-3xl font-bold ml-2", getStatusColor())}>
                {countdown.hours.toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground">h</span>
              <span className={cn("text-3xl font-bold ml-2", getStatusColor())}>
                {countdown.minutes.toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground">m</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
              Until Next Service
            </p>
          </div>

          {/* Battery Bar - 14 Segments */}
          <div className="w-full max-w-xs">
            <div className="flex gap-1 w-full">
              {Array.from({ length: totalBars }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className={cn(
                    "flex-1 h-6 rounded-sm transition-colors duration-300",
                    getBarColor(totalBars - 1 - index)
                  )}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Service Due</span>
              <span>Optimal</span>
            </div>
          </div>
        </div>

        {/* Footer - Next Service Date & Swipe Button */}
        <div className="space-y-3">
          {/* Next Service Date */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Scheduled: <span className={cn("font-medium", getStatusColor())}>
                {nextServiceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </span>
          </div>

          {/* Swipe to Book Button */}
          <div className="relative h-14 rounded-2xl bg-muted/30 border border-border/30 backdrop-blur-sm overflow-hidden">
            {/* Track background hint */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
                Swipe to book service
                <ChevronRight className="h-3 w-3" />
                <ChevronRight className="h-3 w-3 -ml-2 opacity-60" />
                <ChevronRight className="h-3 w-3 -ml-2 opacity-30" />
              </span>
            </div>

            {/* Draggable Button */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 200 }}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDrag={(_, info) => setDragX(info.offset.x)}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.02 }}
              className={cn(
                "absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors",
                isDragging ? "bg-wj-green" : "bg-wj-green/80"
              )}
              style={{ 
                boxShadow: isDragging ? "0 0 20px hsl(var(--wj-green) / 0.5)" : "none"
              }}
            >
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </motion.div>
            </motion.div>

            {/* Progress fill on drag */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-wj-green/20 rounded-2xl"
              style={{ width: dragX + 48 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import serviceBikeFull from "@/assets/service-bike-full.png";

export default function ServiceCountdown() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const constraintsRef = useRef(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Swipe slider motion values (same as ServiceRequestCard)
  const x = useMotionValue(0);
  const sliderWidth = 240;
  const thumbWidth = 56;
  const maxDrag = sliderWidth - thumbWidth - 8;
  
  const backgroundColor = useTransform(
    x,
    [0, maxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.3)"]
  );
  
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
  const checkOpacity = useTransform(x, [maxDrag * 0.7, maxDrag], [0, 1]);
  
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

    video.play().catch(() => {});
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.8) {
      animate(x, maxDrag, { duration: 0.2 });
      setIsCompleted(true);
      setTimeout(() => {
        navigate("/dashboard/service-booking");
      }, 500);
    } else {
      animate(x, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden"
    >
      {/* Layer 1: Video Background - 100% opacity */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/service-countdown-bg.mp4" type="video/mp4" />
      </video>

      {/* Layer 2: Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Layer 3: Bike Image - Full width, aligned left, bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[75%] pointer-events-none">
        <img
          src={serviceBikeFull}
          alt="Bike"
          className="w-full h-full object-contain object-left-bottom"
        />
      </div>

      {/* Layer 4: Left side gradient for content readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />

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
        </div>

        {/* Countdown Timer - Left aligned, top positioned */}
        <div className="flex-1 flex flex-col items-start justify-start pt-2">
          <div className="text-left mb-6">
            <div className="flex items-baseline justify-start gap-1">
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

          {/* Battery Bar - 14 Segments with radius, left-to-right fill */}
          <div className="w-full max-w-xs relative">
            <div className="flex gap-1 w-full">
              {Array.from({ length: totalBars }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className={cn(
                    "flex-1 h-6 rounded-md transition-colors duration-300 relative",
                    getBarColor(index)
                  )}
                >
                  {/* Percentage label above last filled bar */}
                  {index === filledBars - 1 && filledBars > 0 && (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap",
                        getStatusColor()
                      )}
                    >
                      {Math.round(progressPercent)}%
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Service Due</span>
              <span>Optimal</span>
            </div>
          </div>
        </div>

        {/* Footer - Swipe Button (Same as ServiceRequestCard) */}
        <div>
          <motion.div
            ref={constraintsRef}
            style={{ backgroundColor }}
            className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden"
          >
            {/* Hint Text */}
            <motion.div 
              style={{ opacity: textOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="text-xs text-wj-green/70 font-medium tracking-wide">
                Slide to book service →
              </span>
            </motion.div>
            
            {/* Success Check */}
            <motion.div 
              style={{ opacity: checkOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <CheckCircle className="h-5 w-5 text-wj-green" />
            </motion.div>

            {/* Draggable Thumb */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: maxDrag }}
              dragElastic={0}
              onDragEnd={handleDragEnd}
              style={{ x }}
              className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
            >
              <ArrowRight className="h-5 w-5 text-background" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

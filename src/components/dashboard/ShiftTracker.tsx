import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Play, Pause, StopCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShiftState = "idle" | "active" | "paused";

export default function ShiftTracker() {
  const [shiftState, setShiftState] = useState<ShiftState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const constraintsRef = useRef(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const x = useMotionValue(0);
  const sliderWidth = 200;
  const thumbWidth = 48;
  const maxDrag = sliderWidth - thumbWidth - 8;
  
  const backgroundColor = useTransform(
    x,
    [0, maxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.3)"]
  );
  
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
  const checkOpacity = useTransform(x, [maxDrag * 0.7, maxDrag], [0, 1]);

  // Video smooth loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const timeLeft = video.duration - video.currentTime;
      
      if (timeLeft <= 1 && timeLeft > 0) {
        const fadeProgress = 1 - timeLeft;
        setVideoOpacity(1 - fadeProgress * 0.5);
      }
    };

    const handleEnded = () => {
      video.currentTime = 0;
      video.play();
      setVideoOpacity(0.5);
      requestAnimationFrame(() => setVideoOpacity(1));
    };

    video.play().catch(() => {});

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (shiftState === "active") {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [shiftState]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.8) {
      animate(x, maxDrag, { duration: 0.2 });
      setTimeout(() => {
        setShiftState("active");
        animate(x, 0, { duration: 0 });
      }, 300);
    } else {
      animate(x, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const handlePause = () => {
    setShiftState("paused");
  };

  const handleResume = () => {
    setShiftState("active");
  };

  const handleEndShift = () => {
    setShiftState("idle");
    setElapsedSeconds(0);
  };

  return (
    <div className="h-full relative group">
      {/* Animated Gradient Border */}
      <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
        <motion.div
          className="absolute -inset-[100%] w-[300%] h-[300%]"
          style={{
            background: shiftState === "active"
              ? "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 60deg, hsl(var(--wj-green) / 0.8) 120deg, hsl(var(--wj-green)) 180deg, hsl(var(--wj-green) / 0.8) 240deg, transparent 300deg, transparent 360deg)"
              : shiftState === "paused"
              ? "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 60deg, hsl(45 100% 50% / 0.8) 120deg, hsl(45 100% 50%) 180deg, hsl(45 100% 50% / 0.8) 240deg, transparent 300deg, transparent 360deg)"
              : "transparent",
          }}
          animate={{ rotate: shiftState !== "idle" ? 360 : 0 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative h-full rounded-2xl overflow-hidden bg-background"
      >
        {/* Video Background */}
        <motion.video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          animate={{ opacity: videoOpacity * 0.6 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/dashboard-background.mp4" type="video/mp4" />
        </motion.video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        
        {/* Content */}
        <div className="relative z-10 h-full p-4 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-wj-green/20 flex items-center justify-center mb-3 border border-wj-green/30">
              <Clock className="h-4 w-4 text-wj-green" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {shiftState === "idle" ? "Start Shift" : shiftState === "active" ? "Shift Active" : "Shift Paused"}
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {shiftState === "idle" 
                ? "Swipe to clock in" 
                : shiftState === "active"
                ? "Tracking your work hours"
                : "Timer paused"}
            </p>
          </div>

          {shiftState === "idle" ? (
            /* Swipe Slider */
            <motion.div
              ref={constraintsRef}
              style={{ backgroundColor }}
              className="relative h-12 rounded-full border border-wj-green/30 overflow-hidden"
            >
              <motion.div 
                style={{ opacity: textOpacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="text-[10px] text-wj-green/70 font-medium tracking-wide">
                  Slide to start →
                </span>
              </motion.div>
              
              <motion.div 
                style={{ opacity: checkOpacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <CheckCircle className="h-4 w-4 text-wj-green" />
              </motion.div>

              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="absolute left-1 top-1 bottom-1 w-10 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
              >
                <ArrowRight className="h-4 w-4 text-background" />
              </motion.div>
            </motion.div>
          ) : (
            /* Timer Display */
            <div className="space-y-3">
              {/* Timer */}
              <div className="text-center py-2">
                <p className={cn(
                  "text-2xl font-mono font-bold",
                  shiftState === "active" ? "text-wj-green" : "text-amber-500"
                )}>
                  {formatTime(elapsedSeconds)}
                </p>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {shiftState === "active" ? (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  >
                    <Pause className="h-3.5 w-3.5 mr-1.5" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={handleResume}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs border-wj-green/30 text-wj-green hover:bg-wj-green/10"
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Resume
                  </Button>
                )}
                <Button
                  onClick={handleEndShift}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                  End
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

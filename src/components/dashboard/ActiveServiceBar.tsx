import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Wrench, ChevronUp, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveServiceBarProps {
  taskName: string;
  bikeId: string;
  stepLabel: string;
  stepIndex: number;
  totalSteps: number;
  startTime: number; // timestamp when service started (Date.now())
  onReopen: () => void;
}

export default function ActiveServiceBar({
  taskName,
  bikeId,
  stepLabel,
  stepIndex,
  totalSteps,
  startTime,
  onReopen,
}: ActiveServiceBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((stepIndex) / totalSteps) * 100;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 lg:pl-[280px]"
    >
      <button
        onClick={onReopen}
        className="w-full group"
      >
        <div className="relative overflow-hidden rounded-2xl border border-wj-green/30 bg-background/80 backdrop-blur-xl shadow-lg shadow-black/10">
          {/* Progress bar at top */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30">
            <motion.div
              className="h-full bg-wj-green"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center gap-3 p-3">
            {/* Pulsing indicator */}
            <div className="relative w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4 text-wj-green" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-wj-green animate-pulse" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground truncate">{taskName}</p>
                <span className="text-[9px] text-muted-foreground font-mono">• {bikeId}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Step {stepIndex + 1}/{totalSteps} — {stepLabel}
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-wj-green/10 border border-wj-green/20 shrink-0">
              <Clock className="h-3 w-3 text-wj-green" />
              <span className="text-xs font-mono font-bold text-wj-green">{formatTime(elapsed)}</span>
            </div>

            {/* Reopen arrow */}
            <div className="w-8 h-8 rounded-full bg-wj-green/10 flex items-center justify-center shrink-0 group-hover:bg-wj-green/20 transition-colors">
              <ChevronUp className="h-4 w-4 text-wj-green" />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

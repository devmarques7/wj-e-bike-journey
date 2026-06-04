"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ArrowUpRight, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LocationTagProps {
  city?: string;
  country?: string;
  timezone?: string;
  className?: string;
}

/**
 * Compact pill showing the current store location.
 * Alternates with the local time every minute, and shows the time on hover.
 */
export function LocationTag({
  city = "Amsterdam",
  country = "NL",
  timezone = "Europe/Amsterdam",
}: LocationTagProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const elRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Restore saved position
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wj.locationTag.pos");
      if (raw) setPos(JSON.parse(raw));
    } catch {}
  }, []);

  // Default position: top-right corner, and keep bounds in sync
  useEffect(() => {
    const PAD = 16;
    const compute = () => {
      const el = elRef.current;
      const w = el?.offsetWidth ?? 160;
      const h = el?.offsetHeight ?? 32;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setBounds({
        left: PAD,
        top: PAD,
        right: Math.max(PAD, vw - w - PAD),
        bottom: Math.max(PAD, vh - h - PAD),
      });
      setPos((p) => {
        if (!p) return { x: Math.max(PAD, vw - w - PAD), y: PAD + 56 };
        return {
          x: Math.min(Math.max(p.x, PAD), Math.max(PAD, vw - w - PAD)),
          y: Math.min(Math.max(p.y, PAD), Math.max(PAD, vh - h - PAD)),
        };
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      try {
        setCurrentTime(
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: timezone,
          }),
        );
      } catch {
        setCurrentTime(
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
      }
    };
    updateTime();
    const tick = setInterval(updateTime, 1000);
    return () => clearInterval(tick);
  }, [timezone]);

  useEffect(() => {
    // toggle every 60s
    const swap = setInterval(() => setShowTime((s) => !s), 60_000);
    return () => clearInterval(swap);
  }, []);

  const displayTime = isHovered || showTime;

  return (
    <motion.div
      ref={elRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={bounds}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info) => {
        setDragging(false);
        const next = {
          x: Math.min(Math.max((pos?.x ?? 0) + info.offset.x, bounds.left), bounds.right),
          y: Math.min(Math.max((pos?.y ?? 0) + info.offset.y, bounds.top), bounds.bottom),
        };
        setPos(next);
        try { localStorage.setItem("wj.locationTag.pos", JSON.stringify(next)); } catch {}
      }}
      animate={pos ? { x: pos.x, y: pos.y } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 36 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "fixed", left: 0, top: 0, touchAction: "none" }}
      className={cn(
        "group z-[9999] hidden sm:flex items-center gap-2 rounded-full border border-border/40 bg-background/60 backdrop-blur px-3 py-1.5 shadow-lg shadow-black/10 transition-colors duration-500 hover:border-wj-green/40",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/60 -ml-1" />
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wj-green opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-wj-green" />
      </span>
      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="relative h-4 overflow-hidden min-w-[90px]">
        <AnimatePresence mode="wait" initial={false}>
          {displayTime ? (
            <motion.span
              key="time"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 text-xs font-medium text-foreground tabular-nums"
            >
              {currentTime}
            </motion.span>
          ) : (
            <motion.span
              key="loc"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 text-xs font-medium text-foreground"
            >
              {city}, {country}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export default LocationTag;
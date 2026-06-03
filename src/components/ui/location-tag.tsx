"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
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
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative hidden sm:flex items-center gap-2 rounded-full border border-border/40 bg-background/40 backdrop-blur px-3 py-1.5 transition-all duration-500 hover:border-wj-green/40",
      )}
    >
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
    </div>
  );
}

export default LocationTag;
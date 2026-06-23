"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { GripVertical, Play, Pause, Square, Loader2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useShift } from "@/hooks/useShift";
const fmtHMS = (totalSec: number) => {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

/**
 * Floating, draggable shift status pill for staff.
 * Shows current shift state (active / paused / idle / completed) with a live
 * timer. Click to expand and access Start / Resume / Pause / Finish actions.
 */
export function ShiftTag() {
  const {
    userId,
    loading,
    working,
    status,
    elapsedSec,
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    finish: handleFinishAction,
  } = useShift();
  const [open, setOpen] = useState(false);

  const elRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragMoved = useRef(false);

  // Restore saved position
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wj.shiftTag.pos");
      if (raw) setPos(JSON.parse(raw));
    } catch {}
  }, []);

  // Default position (top-right, slightly below header) + bounds
  useEffect(() => {
    const PAD = 16;
    const compute = () => {
      const el = elRef.current;
      const w = el?.offsetWidth ?? 170;
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

  // Collapse when clicking outside the pill / panel
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const root = elRef.current;
      if (root && !root.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const dotClass = {
    idle: "bg-muted-foreground/50",
    active: "bg-wj-green",
    paused: "bg-amber-400",
    completed: "bg-sky-400",
  }[status];

  const label = {
    idle: "Not started",
    active: "Active",
    paused: "Paused",
    completed: "Completed",
  }[status];

  const handleFinish = async () => {
    await handleFinishAction();
    setOpen(false);
  };

  if (typeof document === "undefined") return null;
  if (!userId) return null;

  return createPortal(
    <motion.div
      ref={elRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={bounds}
      onDragStart={() => {
        setDragging(true);
        dragMoved.current = false;
      }}
      onDrag={(_, info) => {
        if (Math.abs(info.offset.x) > 3 || Math.abs(info.offset.y) > 3) dragMoved.current = true;
      }}
      onDragEnd={(_, info) => {
        setDragging(false);
        const next = {
          x: Math.min(Math.max((pos?.x ?? 0) + info.offset.x, bounds.left), bounds.right),
          y: Math.min(Math.max((pos?.y ?? 0) + info.offset.y, bounds.top), bounds.bottom),
        };
        setPos(next);
        try { localStorage.setItem("wj.shiftTag.pos", JSON.stringify(next)); } catch {}
      }}
      animate={pos ? { x: pos.x, y: pos.y } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 36 }}
      style={{ position: "fixed", left: 0, top: 0, touchAction: "none" }}
      className="z-[9999] hidden sm:flex flex-col items-stretch"
    >
      {/* Pill */}
      <button
        type="button"
        onClick={() => {
          if (dragMoved.current) return;
          setOpen((o) => !o);
        }}
        className={cn(
          "group flex items-center gap-2 rounded-full border border-border/40 bg-background/60 backdrop-blur px-3 py-1.5 shadow-lg shadow-black/10 transition-colors duration-300 hover:border-wj-green/40",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/60 -ml-1" />
        <span className="relative flex h-2 w-2">
          {status === "active" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wj-green opacity-60" />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotClass)} />
        </span>
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground tabular-nums min-w-[64px] text-left">
          {loading ? "—" : fmtHMS(elapsedSec)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden md:inline">
          {label}
        </span>
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mt-2 rounded-2xl border border-border/40 bg-background/80 backdrop-blur-xl shadow-xl shadow-black/20 p-2 flex flex-col gap-1.5 min-w-[200px]"
          >
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Today's shift
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  status === "active" && "text-wj-green",
                  status === "paused" && "text-amber-400",
                  status === "completed" && "text-sky-400",
                  status === "idle" && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>

            {status === "idle" && (
              <ActionButton onClick={handleStart} working={working} icon={Play} label="Start" tone="green" />
            )}
            {status === "active" && (
              <>
                <ActionButton onClick={handlePause} working={working} icon={Pause} label="Pause" tone="amber" />
                <ActionButton onClick={handleFinish} working={working} icon={Square} label="Finish" tone="red" />
              </>
            )}
            {status === "paused" && (
              <>
                <ActionButton onClick={handleResume} working={working} icon={Play} label="Resume" tone="green" />
                <ActionButton onClick={handleFinish} working={working} icon={Square} label="Finish" tone="red" />
              </>
            )}
            {status === "completed" && (
              <div className="px-2 py-2 text-[11px] text-muted-foreground text-center">
                Shift completed for today.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}

function ActionButton({
  onClick,
  working,
  icon: Icon,
  label,
  tone,
}: {
  onClick: () => void;
  working: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "green" | "amber" | "red";
}) {
  const toneCls = {
    green: "hover:bg-wj-green/10 hover:text-wj-green",
    amber: "hover:bg-amber-500/10 hover:text-amber-400",
    red: "hover:bg-destructive/10 hover:text-destructive",
  }[tone];
  return (
    <button
      type="button"
      disabled={working}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground transition-colors disabled:opacity-50",
        toneCls,
      )}
    >
      {working ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}

export default ShiftTag;
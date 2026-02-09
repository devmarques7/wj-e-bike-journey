import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Generate mock workload data for current month
const generateWorkloadData = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: Record<string, number> = {};
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Random workload 0-5 (number of tasks)
    const workload = Math.floor(Math.random() * 6);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    data[dateKey] = workload;
  }
  
  return data;
};

const getHeatColor = (value: number) => {
  if (value === 0) return "bg-muted/30";
  if (value === 1) return "bg-wj-green/20";
  if (value === 2) return "bg-wj-green/40";
  if (value === 3) return "bg-wj-green/60";
  if (value === 4) return "bg-wj-green/80";
  return "bg-wj-green";
};

const getHeatLabel = (value: number) => {
  if (value === 0) return "No tasks";
  if (value === 1) return "Light";
  if (value <= 2) return "Moderate";
  if (value <= 4) return "Busy";
  return "Very busy";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StaffCalendarHeatmap() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const workloadData = useMemo(
    () => generateWorkloadData(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: { date: Date | null; key: string }[] = [];
    
    // Padding for alignment
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, key: `pad-${i}` });
    }
    
    // Actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date,
        key: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }
    
    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString("en-US", { month: "long" });

  // Stats
  const totalTasks = Object.values(workloadData).reduce((a, b) => a + b, 0);
  const busyDays = Object.values(workloadData).filter(v => v >= 3).length;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-wj-green" />
            <h3 className="text-sm font-medium text-foreground">Workload</h3>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-foreground">
            {monthName} {currentYear}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[8px] text-muted-foreground uppercase">
                {day[0]}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, key }) => {
              if (!date) {
                return <div key={key} className="aspect-square" />;
              }

              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const workload = workloadData[key] ?? 0;
              const isToday = date.toDateString() === today.toDateString();
              const isPast = date < today && !isToday;

              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + (parseInt(key.split("-")[2]) * 0.01) }}
                      className={cn(
                        "aspect-square rounded-sm flex items-center justify-center text-[9px] cursor-pointer transition-all hover:ring-1 hover:ring-wj-green/50",
                        isWeekend && "opacity-30",
                        isToday && "ring-1 ring-wj-green",
                        !isWeekend && getHeatColor(workload),
                        isPast && "opacity-60"
                      )}
                    >
                      {date.getDate()}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border-border text-xs">
                    <p className="font-medium">
                      {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    {!isWeekend && (
                      <p className="text-muted-foreground">
                        {workload} tasks • {getHeatLabel(workload)}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={cn("w-3 h-3 rounded-sm", getHeatColor(level))}
                />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">
              {totalTasks} tasks this month
            </span>
            <span className="text-wj-green font-medium">
              {busyDays} busy days
            </span>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

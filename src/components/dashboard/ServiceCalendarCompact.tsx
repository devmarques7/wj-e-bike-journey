import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

// Mock available dates (next 30 days, excluding weekends)
const getAvailableDates = () => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(date);
    }
  }
  return dates;
};

// Mock booked dates
const bookedDates = [
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
];

export default function ServiceCalendarCompact() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const availableDates = getAvailableDates();

  const isDateAvailable = (date: Date) => {
    return availableDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-3xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-wj-green" />
            Book a Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-xl border border-border/30"
              modifiers={{
                available: (date) => isDateAvailable(date) && !isDateBooked(date),
                booked: (date) => isDateBooked(date),
              }}
              modifiersStyles={{
                available: {
                  backgroundColor: "hsl(var(--wj-green) / 0.1)",
                  color: "hsl(var(--wj-green))",
                },
                booked: {
                  backgroundColor: "hsl(var(--primary) / 0.2)",
                  color: "hsl(var(--primary))",
                  fontWeight: "bold",
                },
              }}
              disabled={(date) => 
                date < new Date() || 
                (!isDateAvailable(date) && !isDateBooked(date))
              }
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-wj-green/20 border border-wj-green/30" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
              <span>Booked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

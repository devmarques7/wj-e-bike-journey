import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock appointments data
const mockAppointments = [
  {
    id: 1,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: "10:00",
    service: "Full Tune-Up",
    location: "WJ Service Center Amsterdam",
    status: "confirmed",
  },
  {
    id: 2,
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    time: "14:30",
    service: "Battery Inspection",
    location: "WJ Mobile Service",
    status: "pending",
  },
];

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

export default function ServiceCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const availableDates = getAvailableDates();

  const isDateAvailable = (date: Date) => {
    return availableDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const isDateBooked = (date: Date) => {
    return mockAppointments.some(
      (apt) => apt.date.toDateString() === date.toDateString()
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-3xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-wj-green" />
            Service Calendar
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

          {/* Appointments Section */}
          <div className="pt-4 border-t border-border/30">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-wj-green" />
              My Appointments
            </h4>
            <div className="space-y-3">
              {mockAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl bg-muted/30 border border-border/20 hover:border-wj-green/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {apt.service}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {apt.time}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        apt.status === "confirmed"
                          ? "border-wj-green/50 text-wj-green"
                          : "border-amber-500/50 text-amber-500"
                      )}
                    >
                      {apt.status === "confirmed" && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {apt.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle2, Calendar, AlertCircle } from "lucide-react";
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
  {
    id: 3,
    date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    time: "09:00",
    service: "Brake Adjustment",
    location: "WJ Service Center Rotterdam",
    status: "confirmed",
  },
];

export default function ServiceAppointmentsList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-3xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-wj-green" />
            My Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockAppointments.map((apt, index) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/20 hover:border-wj-green/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {apt.service}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {apt.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at {apt.time}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-1",
                    apt.status === "confirmed"
                      ? "border-wj-green/50 text-wj-green bg-wj-green/10"
                      : "border-amber-500/50 text-amber-500 bg-amber-500/10"
                  )}
                >
                  {apt.status === "confirmed" ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {apt.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {apt.location}
              </div>
            </motion.div>
          ))}

          {/* Empty State Placeholder */}
          {mockAppointments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No upcoming appointments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

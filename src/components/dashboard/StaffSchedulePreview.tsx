import { motion } from "framer-motion";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const upcomingSlots = [
  { time: "09:30", duration: "45 min", service: "Brake Adjustment", status: "current" },
  { time: "11:00", duration: "2h", service: "Full Service", status: "next" },
  { time: "14:00", duration: "1h", service: "Wheel Truing", status: "upcoming" },
  { time: "15:30", duration: "45 min", service: "Chain Replacement", status: "upcoming" },
];

export default function StaffSchedulePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-wj-green" />
          <h3 className="text-lg font-medium text-foreground">Today's Schedule</h3>
        </div>
        <Link
          to="/dashboard/staff/schedule"
          className="flex items-center gap-1 text-xs text-wj-green hover:underline"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {upcomingSlots.map((slot, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              slot.status === "current"
                ? "bg-wj-green/10 border border-wj-green/30"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="text-center min-w-[50px]">
              <p className={`text-sm font-semibold ${slot.status === "current" ? "text-wj-green" : "text-foreground"}`}>
                {slot.time}
              </p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{slot.service}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {slot.duration}
              </div>
            </div>
            {slot.status === "current" && (
              <span className="px-2 py-0.5 rounded-full bg-wj-green/20 text-wj-green text-[10px] font-semibold">
                NOW
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

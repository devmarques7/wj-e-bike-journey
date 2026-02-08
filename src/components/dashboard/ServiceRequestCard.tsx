import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServiceRequestCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full rounded-3xl overflow-hidden bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border border-destructive/20 p-6 flex flex-col justify-between"
    >
      <div>
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Urgent Service
        </h3>
        <p className="text-sm text-muted-foreground">
          Need immediate assistance? Request an emergency service visit.
        </p>
      </div>

      <Button 
        className="mt-4 w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl group"
      >
        Request Now
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </motion.div>
  );
}

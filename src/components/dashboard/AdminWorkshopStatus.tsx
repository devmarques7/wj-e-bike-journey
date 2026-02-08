import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminWorkshopStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Wrench className="h-5 w-5 text-wj-green" />
            Workshop Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Capacity</span>
              <span className="text-sm font-medium text-amber-500">87%</span>
            </div>
            <Progress value={87} className="h-2.5" />
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
              <p className="text-xl font-light text-foreground">12</p>
              <p className="text-xs text-muted-foreground">In Queue</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
              <p className="text-xl font-light text-foreground">8</p>
              <p className="text-xs text-muted-foreground">On Bench</p>
            </div>
            <div className="p-3 rounded-xl bg-wj-green/10 border border-wj-green/20">
              <p className="text-xl font-light text-wj-green">5</p>
              <p className="text-xs text-muted-foreground">Ready</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Today's Commitment</p>
            <p className="text-sm text-foreground">
              Ready by <span className="font-medium text-wj-green">5:30 PM</span> for all current bookings
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

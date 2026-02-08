import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const memberSegments = [
  { tier: "Light", count: 1420, percentage: 50, color: "bg-muted-foreground" },
  { tier: "Plus", count: 892, percentage: 31, color: "bg-wj-green" },
  { tier: "Black", count: 535, percentage: 19, color: "bg-foreground" },
];

export default function AdminMemberSegments() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Users className="h-5 w-5 text-wj-green" />
            Member Segments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberSegments.map((segment) => (
            <div key={segment.tier}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground font-medium">{segment.tier}</span>
                <span className="text-sm text-muted-foreground">{segment.count}</span>
              </div>
              <Progress value={segment.percentage} className="h-2" />
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-2xl font-light text-foreground">2,847</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const topProducts = [
  { name: "WJ V8 Urban", sales: 324, revenue: "€842,400", trend: "+18%" },
  { name: "WJ V8 Sport", sales: 256, revenue: "€716,800", trend: "+12%" },
  { name: "WJ V8 Prestige", sales: 189, revenue: "€661,500", trend: "+24%" },
];

export default function AdminSalesRanking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-full"
    >
      <Card className="h-full bg-background/60 backdrop-blur-md border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <BarChart3 className="h-5 w-5 text-wj-green" />
            Sales Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-sm font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground truncate">{product.name}</span>
                  <span className="text-sm text-wj-green font-medium">{product.trend}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{product.sales} units</span>
                  <span>{product.revenue}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

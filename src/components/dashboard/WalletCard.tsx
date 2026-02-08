import { motion } from "framer-motion";
import { Wallet, TrendingUp, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function WalletCard() {
  const { user } = useAuth();
  
  // Mock wallet data based on user tier
  const walletData = {
    light: { points: 250, level: "Bronze", nextReward: 500 },
    plus: { points: 1200, level: "Silver", nextReward: 2000 },
    black: { points: 4500, level: "Gold", nextReward: 5000 },
  };

  const data = walletData[user?.tier || "light"];
  const progress = (data.points / data.nextReward) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full rounded-3xl overflow-hidden bg-gradient-to-br from-wj-green/10 via-wj-green/5 to-transparent border border-wj-green/20 p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-wj-green/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-wj-green" />
          </div>
          <div className="flex items-center gap-1 text-wj-green text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>+120</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1">My Wallet</h3>
        <p className="text-3xl font-bold text-wj-green mb-1">
          {data.points.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground ml-1">pts</span>
        </p>
        <p className="text-xs text-muted-foreground">{data.level} Member</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progress to next reward</span>
          <span>{data.nextReward - data.points} pts to go</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full bg-gradient-to-r from-wj-green to-wj-green/70 rounded-full"
          />
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Gift className="h-3 w-3 text-wj-green" />
          <span>Free accessory at {data.nextReward} pts</span>
        </div>
      </div>
    </motion.div>
  );
}

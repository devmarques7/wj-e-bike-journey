import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, QrCode, History, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VIDPassport() {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wj-green/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-wj-green" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">V-ID Passport</h3>
            <p className="text-sm text-muted-foreground">Blockchain-verified identity</p>
          </div>
        </div>
      </div>

      {/* 3D Card */}
      <div className="p-6">
        <div 
          className="relative h-48 perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 rounded-xl glass overflow-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-wj-forest via-secondary to-wj-deep" />
              <div className="relative p-5 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Vehicle ID</p>
                    <p className="text-lg font-mono text-white mt-1">{user?.bikeId}</p>
                  </div>
                  <QrCode className="h-8 w-8 text-white/30" />
                </div>
                
                <div>
                  <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Model</p>
                  <p className="text-white font-medium">{user?.bikeName}</p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Owner</p>
                    <p className="text-sm text-white">{user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Since</p>
                    <p className="text-sm text-white">{user?.purchaseDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 rounded-xl glass overflow-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-wj-forest to-wj-deep" />
              <div className="relative p-5 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Blockchain Hash</p>
                  <p className="text-xs font-mono text-white/80 mt-1 truncate">
                    0x7f9a8b2c4e6d1f3a5b7c9d0e2f4a6b8c
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-wj-green" />
                    <div>
                      <p className="text-xs text-white">12 Service Records</p>
                      <p className="text-[10px] text-white/50">All verified on-chain</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-wj-green" />
                    <div>
                      <p className="text-xs text-white">Resale Value Protected</p>
                      <p className="text-[10px] text-white/50">98% value retention</p>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-center text-white/30">Tap to flip</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: "Total Distance", value: `${(user?.totalKm || 0).toLocaleString()}km` },
            { label: "Daily Avg", value: `${user?.estimatedDailyKm}km` },
            { label: "CO₂ Saved", value: "1.2t" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-light text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

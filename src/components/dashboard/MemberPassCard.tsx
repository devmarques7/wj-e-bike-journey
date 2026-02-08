import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Crown, Shield, Sparkles, Star, Calendar, Bike } from "lucide-react";
import { useAuth, MemberTier } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MemberPassCardProps {
  bikeId?: string;
  bikeName?: string;
  purchaseDate?: string;
}

const tierConfig: Record<MemberTier, { label: string; icon: typeof Crown; gradient: string; badge: string }> = {
  light: {
    label: "Light Member",
    icon: Star,
    gradient: "from-zinc-400 via-zinc-300 to-zinc-500",
    badge: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30",
  },
  plus: {
    label: "Plus Member",
    icon: Sparkles,
    gradient: "from-amber-400 via-yellow-300 to-amber-500",
    badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  },
  black: {
    label: "Black Member",
    icon: Crown,
    gradient: "from-neutral-900 via-neutral-800 to-neutral-700",
    badge: "bg-white/10 text-white border-white/20",
  },
};

export default function MemberPassCard({ bikeId, bikeName, purchaseDate }: MemberPassCardProps) {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);

  const tier = user?.tier || "light";
  const config = tierConfig[tier];
  const TierIcon = config.icon;

  const displayBikeId = bikeId || user?.bikeId || "V8-2024-XX-00000";
  const displayBikeName = bikeName || user?.bikeName || "WJ V8";
  const displayPurchaseDate = purchaseDate || user?.purchaseDate || "2024-01-01";

  // Generate QR code data URL (simple placeholder - in production would use a QR library)
  const qrData = JSON.stringify({
    bikeId: displayBikeId,
    bikeName: displayBikeName,
    owner: user?.name,
    email: user?.email,
    tier: tier,
    purchaseDate: displayPurchaseDate,
    totalKm: user?.totalKm,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden h-full"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-wj-green/10 flex items-center justify-center">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-wj-green" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-medium text-foreground">Member Pass</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Tap card to reveal QR</p>
          </div>
        </div>
      </div>

      {/* 3D Flip Card */}
      <div className="p-4 sm:p-6">
        <div
          className="relative h-48 sm:h-56 perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of Card */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)} />
              
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-white/50" />
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border border-white/50" />
              </div>

              <div className="relative p-4 sm:p-5 h-full flex flex-col justify-between">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] sm:text-xs font-medium", config.badge)}>
                      <TierIcon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-wider">WJ VISION</p>
                  </div>
                </div>

                {/* Middle - Bike Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4 text-white/70" />
                    <p className="text-white font-medium text-sm sm:text-base">{displayBikeName}</p>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-white/80">{displayBikeId}</p>
                </div>

                {/* Bottom Row */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-wider">Owner</p>
                    <p className="text-xs sm:text-sm text-white">{user?.name || "Member"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-wider">Since</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3 text-white/70" />
                      <p className="text-xs sm:text-sm text-white">{displayPurchaseDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back of Card - QR Code */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-muted" />
              
              <div className="relative p-4 sm:p-5 h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                {/* QR Code Placeholder - In production, use a QR library */}
                <div className="relative">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-xl p-2 sm:p-3 shadow-lg">
                    <div className="w-full h-full bg-foreground/5 rounded-lg flex items-center justify-center relative overflow-hidden">
                      {/* Simple QR pattern placeholder */}
                      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                        {Array.from({ length: 49 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-2 h-2 sm:w-3 sm:h-3 rounded-sm",
                              Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"
                            )}
                          />
                        ))}
                      </div>
                      {/* Center logo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-wj-green rounded-md flex items-center justify-center">
                          <span className="text-[8px] sm:text-[10px] font-bold text-white">WJ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <QrCode className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 text-wj-green" />
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Scan to verify</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Contains all bike & owner data
                  </p>
                </div>

                <p className="text-[9px] sm:text-[10px] text-muted-foreground/50">Tap to flip back</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bike Stats Summary */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
          <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/30">
            <p className="text-sm sm:text-lg font-light text-foreground">
              {(user?.totalKm || 0).toLocaleString()}km
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">Total Distance</p>
          </div>
          <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/30">
            <p className="text-sm sm:text-lg font-light text-foreground">
              {user?.estimatedDailyKm || 0}km
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">Daily Average</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

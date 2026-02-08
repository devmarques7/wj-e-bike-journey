import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Crown, Sparkles, Star, Calendar, Bike } from "lucide-react";
import { useAuth, MemberTier } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MemberPassCardProps {
  bikeId?: string;
  bikeName?: string;
  purchaseDate?: string;
}

const tierConfig: Record<MemberTier, { label: string; icon: typeof Crown; badge: string }> = {
  light: {
    label: "Light Member",
    icon: Star,
    badge: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30",
  },
  plus: {
    label: "Plus Member",
    icon: Sparkles,
    badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  },
  black: {
    label: "Black Member",
    icon: Crown,
    badge: "bg-white/10 text-white border-white/20",
  },
};

export default function MemberPassCard({ bikeId, bikeName, purchaseDate }: MemberPassCardProps) {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backVideoRef = useRef<HTMLVideoElement>(null);

  const tier = user?.tier || "light";
  const config = tierConfig[tier];
  const TierIcon = config.icon;

  const displayBikeId = bikeId || user?.bikeId || "V8-2024-XX-00000";
  const displayBikeName = bikeName || user?.bikeName || "WJ V8";
  const displayPurchaseDate = purchaseDate || user?.purchaseDate || "2024-01-01";

  // Video loop logic
  useEffect(() => {
    const videos = [videoRef.current, backVideoRef.current].filter(Boolean);
    
    videos.forEach(video => {
      if (!video) return;
      
      const handleTimeUpdate = () => {
        if (video.duration - video.currentTime < 0.5) {
          video.currentTime = 0;
          video.play();
        }
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
    });

    return () => {
      videos.forEach(video => {
        if (video) {
          video.removeEventListener("timeupdate", () => {});
        }
      });
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative h-full w-full min-h-[450px] perspective-1000 cursor-pointer"
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
          className="absolute inset-0 rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Video Background */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/member-pass-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

          {/* Card Content */}
          <div className="relative z-10 h-full w-full flex flex-col p-5 sm:p-6">
            {/* Header Row */}
            <div className="flex items-start justify-between">
              <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-medium", config.badge)}>
                <TierIcon className="h-3 w-3" />
                {config.label}
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-widest">WJ VISION</p>
            </div>

            {/* Center Content - Takes remaining space */}
            <div className="flex-1 flex flex-col justify-center items-center text-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-wj-green/20 border border-wj-green/30 flex items-center justify-center">
                <Bike className="h-8 w-8 sm:h-10 sm:w-10 text-wj-green" />
              </div>
              <div>
                <p className="text-white font-medium text-lg sm:text-xl">{displayBikeName}</p>
                <p className="text-sm sm:text-base font-mono text-white/60 mt-1">{displayBikeId}</p>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-end justify-between pt-4 border-t border-white/10">
              <div>
                <p className="text-[9px] sm:text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Owner</p>
                <p className="text-sm sm:text-base text-white font-medium">{user?.name || "Member"}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Since</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="h-3.5 w-3.5 text-white/60" />
                  <p className="text-sm sm:text-base text-white">{displayPurchaseDate}</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1 text-center py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <p className="text-base sm:text-lg font-light text-white">
                  {(user?.totalKm || 0).toLocaleString()}km
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/50">Total Distance</p>
              </div>
              <div className="flex-1 text-center py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <p className="text-base sm:text-lg font-light text-white">
                  {user?.estimatedDailyKm || 0}km
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/50">Daily Average</p>
              </div>
            </div>

            {/* Tap hint */}
            <p className="text-center text-[9px] sm:text-[10px] text-white/30 mt-4">Tap to reveal QR</p>
          </div>
        </div>

        {/* Back of Card - QR Code */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Video Background */}
          <video
            ref={backVideoRef}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/member-pass-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />

          {/* QR Content */}
          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-5 sm:p-6 gap-4 sm:gap-6">
            {/* QR Code */}
            <div className="relative">
              <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white rounded-2xl p-3 sm:p-4 shadow-2xl">
                <div className="w-full h-full bg-foreground/5 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="grid grid-cols-9 gap-0.5">
                    {Array.from({ length: 81 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm",
                          Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-wj-green rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-sm sm:text-base font-bold text-white">WJ</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-wj-green rounded-full flex items-center justify-center shadow-lg">
                <QrCode className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-base sm:text-lg font-medium text-white">Scan to Verify</p>
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Contains complete bike & ownership data
              </p>
            </div>

            {/* Bike ID badge */}
            <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <p className="text-xs sm:text-sm font-mono text-white/80">{displayBikeId}</p>
            </div>

            {/* Tap hint */}
            <p className="text-[9px] sm:text-[10px] text-white/30">Tap to flip back</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Star, Wifi } from "lucide-react";
import { useAuth, MemberTier } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MemberPassCardProps {
  bikeId?: string;
  bikeName?: string;
  purchaseDate?: string;
}

const tierConfig: Record<MemberTier, { label: string; icon: typeof Crown; badge: string }> = {
  light: {
    label: "Light",
    icon: Star,
    badge: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30",
  },
  plus: {
    label: "Plus",
    icon: Sparkles,
    badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  },
  black: {
    label: "Black",
    icon: Crown,
    badge: "bg-white/10 text-white border-white/20",
  },
};

// Format bike ID as credit card number (groups of 4)
function formatAsCardNumber(id: string): string {
  const cleaned = id.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const padded = cleaned.padEnd(16, '0').slice(0, 16);
  return padded.match(/.{1,4}/g)?.join('  ') || padded;
}

export default function MemberPassCard({ bikeId, bikeName, purchaseDate }: MemberPassCardProps) {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const tier = user?.tier || "light";
  const config = tierConfig[tier];
  const TierIcon = config.icon;

  const displayBikeId = bikeId || user?.bikeId || "V8-2024-XX-00000";
  const displayBikeName = bikeName || user?.bikeName || "WJ V8";
  const displayPurchaseDate = purchaseDate || user?.purchaseDate || "2024-01";
  
  // Format date as MM/YY for credit card style
  const formattedDate = displayPurchaseDate ? 
    new Date(displayPurchaseDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }).replace('/', '/') 
    : '01/24';

  // Video loop logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime < 0.5) {
        video.currentTime = 0;
        video.play();
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative w-full cursor-pointer aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] max-h-[500px]"
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of Card - Credit Card Style */}
        <motion.div 
          className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
          animate={{ 
            rotateY: isFlipped ? 180 : 0,
            opacity: isFlipped ? 0 : 1
          }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
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

          {/* Credit Card Layout */}
          <div className="relative z-10 h-full w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8">
            {/* Top Row - Brand & Contactless */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-wider">WJ VISION</p>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-white/40 tracking-widest uppercase mt-0.5">{displayBikeName}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Wifi className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white/60 rotate-90" />
              </div>
            </div>

            {/* Chip */}
            <div className="flex items-center gap-3 sm:gap-4 my-2 sm:my-4">
              <div className="w-10 h-7 sm:w-12 sm:h-9 lg:w-14 lg:h-10 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-lg">
                <div className="w-full h-full grid grid-cols-3 gap-0.5 p-0.5 sm:p-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-amber-600/30 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-1 sm:space-y-2">
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-mono text-white tracking-[0.1em] sm:tracking-[0.15em] font-light break-all">
                {formatAsCardNumber(displayBikeId)}
              </p>
            </div>

            {/* Bottom Row - Name, Valid, Tier */}
            <div className="flex items-end justify-between pt-2 sm:pt-4 gap-2">
              <div className="space-y-2 sm:space-y-3 min-w-0 flex-shrink">
                <div>
                  <p className="text-[7px] sm:text-[8px] lg:text-[9px] text-white/40 uppercase tracking-widest">Card Holder</p>
                  <p className="text-xs sm:text-sm lg:text-base text-white font-medium uppercase tracking-wide truncate">
                    {user?.name || "MEMBER NAME"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-end gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[7px] sm:text-[8px] lg:text-[9px] text-white/40 uppercase tracking-widest">Valid</p>
                  <p className="text-xs sm:text-sm lg:text-base text-white font-mono">{formattedDate}</p>
                </div>
                <div className={cn("inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[9px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wider", config.badge)}>
                  <TierIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back of Card - Minimal with Video Background */}
        <motion.div
          className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
          animate={{ 
            rotateY: isFlipped ? 0 : -180,
            opacity: isFlipped ? 1 : 0
          }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Video Background */}
          <video
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/member-pass-back-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />

          {/* Only Footer Text */}
          <div className="relative z-10 h-full w-full flex items-end justify-center pb-6 sm:pb-8">
            <p className="text-[10px] sm:text-xs text-white/60 tracking-widest uppercase">Scan QR Code</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

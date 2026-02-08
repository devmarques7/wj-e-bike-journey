import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Crown, Sparkles, Star, Wifi } from "lucide-react";
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
      className="relative h-full w-full min-h-[450px] perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of Card - Credit Card Style */}
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

          {/* Credit Card Layout */}
          <div className="relative z-10 h-full w-full flex flex-col justify-between p-6 sm:p-8">
            {/* Top Row - Brand & Contactless */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg sm:text-xl font-bold text-white tracking-wider">WJ VISION</p>
                <p className="text-[10px] sm:text-xs text-white/40 tracking-widest uppercase mt-0.5">{displayBikeName}</p>
              </div>
              <div className="flex items-center gap-3">
                <Wifi className="h-6 w-6 sm:h-7 sm:w-7 text-white/60 rotate-90" />
              </div>
            </div>

            {/* Chip */}
            <div className="flex items-center gap-4 my-4">
              <div className="w-12 h-9 sm:w-14 sm:h-10 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-lg">
                <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-amber-600/30 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <p className="text-xl sm:text-2xl md:text-3xl font-mono text-white tracking-[0.15em] font-light">
                {formatAsCardNumber(displayBikeId)}
              </p>
            </div>

            {/* Bottom Row - Name, Valid, Tier */}
            <div className="flex items-end justify-between pt-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-widest">Card Holder</p>
                  <p className="text-sm sm:text-base text-white font-medium uppercase tracking-wide">
                    {user?.name || "MEMBER NAME"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-end gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-widest">Valid</p>
                  <p className="text-sm sm:text-base text-white font-mono">{formattedDate}</p>
                </div>
                <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-semibold uppercase tracking-wider", config.badge)}>
                  <TierIcon className="h-3 w-3" />
                  {config.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card - QR Code with Green Background */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-wj-green/30 shadow-2xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Green Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-wj-green via-wj-forest to-wj-deep" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />

          {/* QR Content */}
          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-6 sm:p-8 gap-6">
            {/* QR Code */}
            <div className="relative">
              <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-2xl p-4 shadow-2xl">
                <div className="w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="grid grid-cols-9 gap-0.5">
                    {Array.from({ length: 81 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 sm:w-4 sm:h-4 rounded-sm",
                          Math.random() > 0.4 ? "bg-wj-deep" : "bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-wj-green rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-base sm:text-lg font-bold text-white">WJ</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <QrCode className="h-5 w-5 text-wj-green" />
              </div>
            </div>

            {/* Scan Text */}
            <div className="text-center">
              <p className="text-lg sm:text-xl font-light text-white">Scan to Verify</p>
              <p className="text-xs sm:text-sm text-white/60 mt-1 font-mono">{formatAsCardNumber(displayBikeId)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

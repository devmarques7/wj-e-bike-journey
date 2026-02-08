import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useRef, useEffect } from "react";

export default function WalletCard() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Card data based on tier
  const cardData = {
    light: { tier: "LIGHT", number: "4532 •••• •••• 8901", color: "from-zinc-400 to-zinc-600" },
    plus: { tier: "PLUS", number: "4532 •••• •••• 2847", color: "from-blue-400 to-blue-600" },
    black: { tier: "BLACK", number: "4532 •••• •••• 1562", color: "from-amber-400 to-amber-600" },
  };

  const data = cardData[user?.tier || "light"];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime < 0.5) {
        video.style.opacity = "0";
        setTimeout(() => {
          video.currentTime = 0;
          video.play();
          video.style.opacity = "1";
        }, 300);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="h-full rounded-3xl overflow-hidden relative group"
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: 1 }}
      >
        <source src="/videos/wallet-background.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />

      {/* Card Content */}
      <div className="relative z-10 h-full p-5 flex flex-col justify-between min-h-[180px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-medium">Member Card</p>
            <h3 className="text-sm font-semibold text-white tracking-tight">WJ Vision</h3>
          </div>
          <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${data.color} text-[9px] font-bold uppercase tracking-wider text-white`}>
            {data.tier}
          </div>
        </div>

        {/* Card Number */}
        <div className="space-y-1">
          <p className="text-white/40 text-[9px] uppercase tracking-widest">Card Number</p>
          <p className="text-white text-sm font-mono tracking-[0.15em]">{data.number}</p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Member</p>
            <p className="text-white text-xs font-medium truncate max-w-[120px]">{user?.name || "Guest"}</p>
          </div>
          
          <Link to="/dashboard/wallet">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all"
            >
              My Wallet
              <ChevronRight className="h-3 w-3" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

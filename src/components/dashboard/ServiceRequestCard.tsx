import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Bike, CheckCircle, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "./EmptyState";

export default function ServiceRequestCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [planLoading, setPlanLoading] = useState(true);
  const [hasUrgentService, setHasUrgentService] = useState(false);
  const [planName, setPlanName] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const constraintsRef = useRef(null);
  
  const x = useMotionValue(0);
  const sliderWidth = 240;
  const thumbWidth = 56;
  const maxDrag = sliderWidth - thumbWidth - 8;
  
  const backgroundColor = useTransform(
    x,
    [0, maxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.3)"]
  );
  
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
  const checkOpacity = useTransform(x, [maxDrag * 0.7, maxDrag], [0, 1]);

  // Resolve user's plan and check if urgent service is included.
  // Heuristic: tier_level >= 2 (Plus/Black) OR features mention urgent/priority/unlimited/same-day/concierge.
  useEffect(() => {
    if (!user) {
      setPlanLoading(false);
      return;
    }
    // Demo users: derive from tier
    if (user.isDemo) {
      const tier = (user.tier || "free").toLowerCase();
      setPlanName(tier.toUpperCase());
      setHasUrgentService(tier === "plus" || tier === "black");
      setPlanLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_versions:plan_version_id(features, plans:plan_id(slug, name, tier_level))")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      const row: any = data?.[0];
      const plan = row?.plan_versions?.plans;
      const features: string[] = Array.isArray(row?.plan_versions?.features)
        ? row.plan_versions.features
        : [];
      const tier = Number(plan?.tier_level ?? 0);
      const keywords = /(urgent|priority|unlimited|same-day|concierge|24\/7)/i;
      const enabled = tier >= 2 || features.some((f) => keywords.test(String(f)));
      if (!cancelled) {
        setPlanName(plan?.name || (plan?.slug ? String(plan.slug).toUpperCase() : "FREE"));
        setHasUrgentService(enabled);
        setPlanLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.isDemo, user?.tier]);

  // Smooth video loop transition with fade
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const timeLeft = video.duration - video.currentTime;
      
      // Start fading out 1 second before video ends
      if (timeLeft <= 1 && timeLeft > 0) {
        const fadeProgress = 1 - timeLeft; // 0 to 1
        setVideoOpacity(1 - fadeProgress * 0.5); // Fade to 0.5 opacity
      }
    };

    const handleEnded = () => {
      // Reset to beginning
      video.currentTime = 0;
      video.play();
      
      // Fade back in smoothly
      setVideoOpacity(0.5);
      requestAnimationFrame(() => {
        setVideoOpacity(1);
      });
    };

    // Ensure video plays on mount
    video.play().catch(() => {});

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.8) {
      animate(x, maxDrag, { duration: 0.2 });
      setIsCompleted(true);
      setTimeout(() => {
        navigate("/urgent-service");
      }, 500);
    } else {
      animate(x, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };

  if (!user?.bikeId) {
    return (
      <div className="h-full rounded-3xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-center min-h-[180px]">
        <EmptyState
          icon={Bike}
          title="No urgent requests"
          description="Link a bike to enable urgent service requests."
        />
      </div>
    );
  }

  // Plan does not include urgent service → show locked state with upgrade CTA.
  if (!planLoading && !hasUrgentService) {
    return (
      <div className="h-full relative">
        <div className="h-full rounded-3xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md p-6 flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center mb-4 border border-border/40">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Urgent Service
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Not included in your {planName || "current"} plan. Upgrade to unlock immediate assistance.
            </p>
          </div>
          <Link
            to="/dashboard/wallet"
            className="mt-4 h-12 rounded-full border border-wj-green/30 bg-wj-green/10 hover:bg-wj-green/20 transition-colors flex items-center justify-center text-xs font-medium text-wj-green tracking-wide"
          >
            Upgrade plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative group">
      {/* Animated Gradient Border */}
      <div className="absolute -inset-[1px] rounded-3xl overflow-hidden">
        <motion.div
          className="absolute -inset-[100%] w-[300%] h-[300%]"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 60deg, hsl(var(--wj-green) / 0.8) 120deg, hsl(var(--wj-green)) 180deg, hsl(var(--wj-green) / 0.8) 240deg, transparent 300deg, transparent 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      
      {/* Inner Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative h-full rounded-3xl overflow-hidden bg-background"
      >
        {/* Video Background */}
        <motion.video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          animate={{ opacity: videoOpacity }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/urgent-service-bg.mp4" type="video/mp4" />
        </motion.video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        
        {/* Content */}
        <div className="relative z-10 h-full p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-wj-green/20 flex items-center justify-center mb-4 border border-wj-green/30">
              <Bike className="h-5 w-5 text-wj-green" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Urgent Service
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need immediate assistance?
            </p>
          </div>

          {/* Swipe Slider */}
          <div className="mt-4">
            <motion.div
              ref={constraintsRef}
              style={{ backgroundColor }}
              className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden"
            >
              {/* Hint Text */}
              <motion.div 
                style={{ opacity: textOpacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="text-xs text-wj-green/70 font-medium tracking-wide">
                  Slide to request →
                </span>
              </motion.div>
              
              {/* Success Check */}
              <motion.div 
                style={{ opacity: checkOpacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <CheckCircle className="h-5 w-5 text-wj-green" />
              </motion.div>

              {/* Draggable Thumb */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
              >
                <ArrowRight className="h-5 w-5 text-background" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

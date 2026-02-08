import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Bike,
  Calendar,
  Wrench,
  Heart,
  Crown,
  CreditCard,
  X,
} from "lucide-react";
import { useAuth, MemberTier } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  tier?: MemberTier[];
}

// Menu items without Settings
const menuNavItems: NavItem[] = [
  { icon: CreditCard, label: "V-ID", href: "/dashboard" },
  { icon: Bike, label: "Bike", href: "/dashboard/bike" },
  { icon: Calendar, label: "Service", href: "/dashboard/service" },
  { icon: Wrench, label: "Care", href: "/dashboard/maintenance" },
  { icon: Heart, label: "Favorites", href: "/dashboard/favorites" },
  { icon: Crown, label: "VIP", href: "/dashboard/concierge", tier: ["black"] },
];

export default function MobileFooterNav() {
  const [showAllMenu, setShowAllMenu] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = menuNavItems.filter((item) => {
    if (!item.tier) return true;
    return user?.tier && item.tier.includes(user.tier);
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    if (href === "/dashboard/bike") {
      return location.pathname === "/dashboard/bike";
    }
    return location.pathname === href;
  };

  // Calculate position along the arc for each item
  const getArcPosition = (index: number, total: number) => {
    // Spread items from -60deg to +60deg along the arc
    const startAngle = -55;
    const endAngle = 55;
    const angleStep = (endAngle - startAngle) / (total - 1);
    const angle = startAngle + (angleStep * index);
    const radians = (angle * Math.PI) / 180;
    
    // Arc radius and vertical offset calculations
    const radius = 95;
    const x = Math.sin(radians) * radius;
    const y = Math.cos(radians) * radius * 0.35;
    
    return { x, y, angle };
  };

  return (
    <>
      {/* Spacer */}
      <div className="lg:hidden h-24" />

      {/* Footer Navigation - Minimalist Full Width Arc */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="relative">
          {/* Arc Background */}
          <svg
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-16"
          >
            <path
              d="M0,20 Q50,0 100,20 L100,20 L0,20 Z"
              className="fill-card"
            />
          </svg>
          
          {/* Arc border glow */}
          <svg
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-16"
          >
            <path
              d="M0,20 Q50,0 100,20"
              fill="none"
              className="stroke-wj-green/30"
              strokeWidth="0.3"
            />
          </svg>

          {/* Navigation Icons */}
          <div className="relative flex items-end justify-center gap-8 pb-4 pt-1">
            <Link to="/dashboard" className="relative z-10 -mb-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive("/dashboard")
                    ? "bg-wj-green text-primary-foreground shadow-lg shadow-wj-green/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <CreditCard className="h-4 w-4" />
              </motion.div>
              <span className={cn(
                "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                isActive("/dashboard") ? "text-wj-green" : "text-muted-foreground"
              )}>
                V-ID
              </span>
            </Link>

            <button
              onClick={() => setShowAllMenu(true)}
              className="relative z-10 -mt-8"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-wj-green flex items-center justify-center shadow-xl shadow-wj-green/40"
              >
                <motion.div
                  animate={{ rotate: showAllMenu ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Home className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-wj-green/20"
              />
            </button>

            <Link to="/dashboard/service" className="relative z-10 -mb-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive("/dashboard/service")
                    ? "bg-wj-green text-primary-foreground shadow-lg shadow-wj-green/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
              </motion.div>
              <span className={cn(
                "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                isActive("/dashboard/service") ? "text-wj-green" : "text-muted-foreground"
              )}>
                Service
              </span>
            </Link>
          </div>

          <div className="h-4 bg-card" />
        </div>
      </div>

      {/* Expanded Arc Menu */}
      <AnimatePresence>
        {showAllMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllMenu(false)}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-md z-50"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="relative h-48">
                {/* Full Width Arc */}
                <svg
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                  className="absolute bottom-0 left-0 w-full h-full"
                >
                  <path
                    d="M0,50 Q50,5 100,50 L100,50 L0,50 Z"
                    className="fill-card"
                  />
                </svg>
                
                {/* Arc border */}
                <svg
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                  className="absolute bottom-0 left-0 w-full h-full"
                >
                  <path
                    d="M0,50 Q50,5 100,50"
                    fill="none"
                    className="stroke-wj-green/20"
                    strokeWidth="0.15"
                  />
                </svg>

                {/* Close Button at center top */}
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setShowAllMenu(false)}
                  className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center border border-border/50"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>

                {/* Items Following the Arc Curve */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                  <div className="relative w-full max-w-sm h-36">
                    {filteredNavItems.map((item, index) => {
                      const { x, y } = getArcPosition(index, filteredNavItems.length);
                      const isItemActive = isActive(item.href);
                      
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ delay: index * 0.04, duration: 0.2 }}
                          className="absolute left-1/2 bottom-6"
                          style={{
                            transform: `translateX(calc(-50% + ${x}px)) translateY(${-y}px)`,
                          }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setShowAllMenu(false)}
                            className="flex flex-col items-center gap-1"
                          >
                            <motion.div
                              whileTap={{ scale: 0.9 }}
                              className={cn(
                                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                                isItemActive
                                  ? "bg-wj-green text-primary-foreground shadow-lg shadow-wj-green/30"
                                  : "bg-muted/90 text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </motion.div>
                            <span
                              className={cn(
                                "text-[9px] font-medium whitespace-nowrap",
                                isItemActive ? "text-wj-green" : "text-muted-foreground"
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Safe area */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-card" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

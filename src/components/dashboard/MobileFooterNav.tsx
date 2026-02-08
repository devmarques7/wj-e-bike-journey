import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Bike,
  Calendar,
  Wrench,
  Heart,
  Settings,
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

const allNavItems: NavItem[] = [
  { icon: Home, label: "Overview", href: "/dashboard" },
  { icon: Bike, label: "My Bike", href: "/dashboard/bike" },
  { icon: Calendar, label: "Book Service", href: "/dashboard/service" },
  { icon: Wrench, label: "Maintenance", href: "/dashboard/maintenance" },
  { icon: Heart, label: "Favorites", href: "/dashboard/favorites" },
  { icon: Crown, label: "VIP Concierge", href: "/dashboard/concierge", tier: ["black"] },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function MobileFooterNav() {
  const [showAllMenu, setShowAllMenu] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = allNavItems.filter((item) => {
    if (!item.tier) return true;
    return user?.tier && item.tier.includes(user.tier);
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/bike";
    }
    return location.pathname === href;
  };

  return (
    <>
      {/* Spacer */}
      <div className="lg:hidden h-24" />

      {/* Footer Navigation - Minimalist Full Width Arc */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Full Width Half Moon */}
        <div className="relative">
          {/* Arc Background - Using system colors */}
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
          
          {/* Subtle top border glow */}
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
            {/* Left Icon - V-ID */}
            <Link to="/dashboard" className="relative z-10 -mb-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive("/dashboard") && location.pathname === "/dashboard"
                    ? "bg-wj-green text-primary-foreground shadow-lg shadow-wj-green/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <motion.div
                  animate={isActive("/dashboard") ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <CreditCard className="h-4 w-4" />
                </motion.div>
              </motion.div>
              <span
                className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                  isActive("/dashboard") ? "text-wj-green" : "text-muted-foreground"
                )}
              >
                V-ID
              </span>
            </Link>

            {/* Center Button - Menu */}
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
              {/* Pulse Ring */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-wj-green/20"
              />
            </button>

            {/* Right Icon - Service */}
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
                <motion.div
                  animate={isActive("/dashboard/service") ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Calendar className="h-4 w-4" />
                </motion.div>
              </motion.div>
              <span
                className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                  isActive("/dashboard/service") ? "text-wj-green" : "text-muted-foreground"
                )}
              >
                Service
              </span>
            </Link>
          </div>

          {/* Safe area bottom fill */}
          <div className="h-4 bg-card" />
        </div>
      </div>

      {/* Expanded Menu Overlay */}
      <AnimatePresence>
        {showAllMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllMenu(false)}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-md z-50"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="relative">
                {/* Full Width Arc for Menu */}
                <svg
                  viewBox="0 0 100 35"
                  preserveAspectRatio="none"
                  className="absolute bottom-0 left-0 w-full h-[280px]"
                >
                  <path
                    d="M0,35 Q50,0 100,35 L100,35 L0,35 Z"
                    className="fill-card"
                  />
                </svg>
                
                {/* Arc border */}
                <svg
                  viewBox="0 0 100 35"
                  preserveAspectRatio="none"
                  className="absolute bottom-0 left-0 w-full h-[280px]"
                >
                  <path
                    d="M0,35 Q50,0 100,35"
                    fill="none"
                    className="stroke-border"
                    strokeWidth="0.2"
                  />
                </svg>

                {/* Close Button */}
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setShowAllMenu(false)}
                  className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center border border-border/50"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>

                {/* Navigation Grid */}
                <div className="relative pt-14 pb-4 px-8">
                  {/* Top Row */}
                  <div className="flex justify-center gap-6 mb-3">
                    {filteredNavItems.slice(0, 3).map((item, index) => {
                      const isItemActive = location.pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setShowAllMenu(false)}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <motion.div
                              whileTap={{ scale: 0.9 }}
                              className={cn(
                                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                                isItemActive
                                  ? "bg-wj-green text-primary-foreground shadow-md shadow-wj-green/30"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </motion.div>
                            <span
                              className={cn(
                                "text-[10px] font-medium",
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

                  {/* Bottom Row */}
                  <div className="flex justify-center gap-6">
                    {filteredNavItems.slice(3).map((item, index) => {
                      const isItemActive = location.pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (index + 3) * 0.04 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setShowAllMenu(false)}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <motion.div
                              whileTap={{ scale: 0.9 }}
                              className={cn(
                                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                                isItemActive
                                  ? "bg-wj-green text-primary-foreground shadow-md shadow-wj-green/30"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </motion.div>
                            <span
                              className={cn(
                                "text-[10px] font-medium",
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

                {/* User Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative px-6 pb-5 flex items-center justify-center gap-2"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-7 h-7 rounded-full bg-muted border border-border/50"
                  />
                  <div className="text-center">
                    <p className="font-medium text-foreground text-xs">{user?.name}</p>
                    <p className="text-[9px] text-muted-foreground capitalize">{user?.tier} member</p>
                  </div>
                  <Link
                    to="/"
                    onClick={() => setShowAllMenu(false)}
                    className="ml-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-full bg-muted/50 border border-border/30"
                  >
                    Exit
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

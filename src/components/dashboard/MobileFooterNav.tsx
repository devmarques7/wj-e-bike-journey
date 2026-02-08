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
      {/* Spacer to prevent content from being hidden behind footer */}
      <div className="lg:hidden h-28" />

      {/* Footer Navigation - Half Moon Design */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Half Moon Background */}
        <div className="relative">
          {/* Blue Half Moon Arc */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[80px] bg-gradient-to-t from-wj-blue-dark to-wj-blue rounded-t-full shadow-lg"
            style={{
              clipPath: "ellipse(140px 80px at 50% 100%)",
              boxShadow: "0 -8px 30px -5px hsl(var(--wj-blue) / 0.4)"
            }}
          />
          
          {/* Navigation Icons floating above the arc */}
          <div className="relative flex items-end justify-center gap-1 pb-3 pt-2">
            {/* Left Icon - V-ID */}
            <Link
              to="/dashboard"
              className="relative z-10 mb-6"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                  isActive("/dashboard") && location.pathname === "/dashboard"
                    ? "bg-wj-neutral text-wj-blue"
                    : "bg-wj-neutral/20 backdrop-blur-sm text-wj-neutral border border-wj-neutral/30"
                )}
              >
                <motion.div
                  animate={isActive("/dashboard") ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <CreditCard className="h-5 w-5" />
                </motion.div>
              </motion.div>
              <span
                className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                  isActive("/dashboard") ? "text-wj-neutral" : "text-wj-neutral/70"
                )}
              >
                V-ID
              </span>
            </Link>

            {/* Center Button - Dashboard/Menu */}
            <button
              onClick={() => setShowAllMenu(true)}
              className="relative z-10 mb-10 mx-2"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-wj-neutral flex items-center justify-center shadow-xl"
                style={{
                  boxShadow: "0 8px 25px -5px hsl(var(--wj-blue) / 0.5)"
                }}
              >
                <motion.div
                  animate={{ rotate: showAllMenu ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Home className="h-6 w-6 text-wj-blue" />
                </motion.div>
              </motion.div>
              {/* Pulse Ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-wj-neutral/30"
              />
            </button>

            {/* Right Icon - Service */}
            <Link
              to="/dashboard/service"
              className="relative z-10 mb-6"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                  isActive("/dashboard/service")
                    ? "bg-wj-neutral text-wj-blue"
                    : "bg-wj-neutral/20 backdrop-blur-sm text-wj-neutral border border-wj-neutral/30"
                )}
              >
                <motion.div
                  animate={isActive("/dashboard/service") ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Calendar className="h-5 w-5" />
                </motion.div>
              </motion.div>
              <span
                className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                  isActive("/dashboard/service") ? "text-wj-neutral" : "text-wj-neutral/70"
                )}
              >
                Service
              </span>
            </Link>
          </div>

          {/* Bottom Bar for safe area */}
          <div className="h-5 bg-gradient-to-t from-wj-blue-dark to-wj-blue-dark" />
        </div>
      </div>

      {/* Full Menu Overlay - Gear Style */}
      <AnimatePresence>
        {showAllMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllMenu(false)}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />

            {/* Radial Menu Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
              {/* Menu Container */}
              <div className="relative">
                {/* Extended Blue Half Moon for Menu */}
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[320px] bg-gradient-to-t from-wj-blue-dark via-wj-blue to-wj-blue rounded-t-[100%] shadow-2xl"
                />
                
                {/* Close Button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={() => setShowAllMenu(false)}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-wj-neutral/10 backdrop-blur-sm flex items-center justify-center border border-wj-neutral/20"
                >
                  <X className="h-5 w-5 text-wj-neutral" />
                </motion.button>

                {/* Navigation Grid - Gear Layout */}
                <div className="relative pt-16 pb-6 px-6">
                  {/* Top Row */}
                  <div className="flex justify-center gap-5 mb-4">
                    {filteredNavItems.slice(0, 3).map((item, index) => {
                      const isItemActive = location.pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setShowAllMenu(false)}
                            className="flex flex-col items-center gap-2"
                          >
                            <motion.div
                              whileTap={{ scale: 0.9 }}
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                                isItemActive
                                  ? "bg-wj-neutral text-wj-blue"
                                  : "bg-wj-neutral/15 backdrop-blur-sm text-wj-neutral border border-wj-neutral/20"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </motion.div>
                            <span
                              className={cn(
                                "text-[10px] font-medium text-center",
                                isItemActive ? "text-wj-neutral" : "text-wj-neutral/80"
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
                  <div className="flex justify-center gap-5">
                    {filteredNavItems.slice(3).map((item, index) => {
                      const isItemActive = location.pathname === item.href;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (index + 3) * 0.05 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setShowAllMenu(false)}
                            className="flex flex-col items-center gap-2"
                          >
                            <motion.div
                              whileTap={{ scale: 0.9 }}
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                                isItemActive
                                  ? "bg-wj-neutral text-wj-blue"
                                  : "bg-wj-neutral/15 backdrop-blur-sm text-wj-neutral border border-wj-neutral/20"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </motion.div>
                            <span
                              className={cn(
                                "text-[10px] font-medium text-center",
                                isItemActive ? "text-wj-neutral" : "text-wj-neutral/80"
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

                {/* User Info at Bottom */}
                <div className="relative px-6 pb-6 flex items-center justify-center gap-3">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full bg-wj-neutral/20 border border-wj-neutral/30"
                  />
                  <div className="text-center">
                    <p className="font-medium text-wj-neutral text-sm">{user?.name}</p>
                    <p className="text-[10px] text-wj-neutral/70 capitalize">{user?.tier} member</p>
                  </div>
                  <Link
                    to="/"
                    onClick={() => setShowAllMenu(false)}
                    className="ml-2 text-[10px] text-wj-neutral/60 hover:text-wj-neutral transition-colors px-2 py-1 rounded-full bg-wj-neutral/10"
                  >
                    Exit
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

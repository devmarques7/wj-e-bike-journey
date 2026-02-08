import { useState, useEffect } from "react";
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
  const [previousPath, setPreviousPath] = useState(location.pathname);
  const [animationDirection, setAnimationDirection] = useState<"left" | "right">("right");

  const filteredNavItems = allNavItems.filter((item) => {
    if (!item.tier) return true;
    return user?.tier && item.tier.includes(user.tier);
  });

  // Track navigation direction for animations
  useEffect(() => {
    const currentIndex = filteredNavItems.findIndex(item => item.href === location.pathname);
    const previousIndex = filteredNavItems.findIndex(item => item.href === previousPath);
    
    if (currentIndex > previousIndex) {
      setAnimationDirection("left");
    } else {
      setAnimationDirection("right");
    }
    
    setPreviousPath(location.pathname);
  }, [location.pathname]);

  // Main footer items: E-ID (left), Dashboard (center), Service (right)
  const mainNavItems = [
    { icon: CreditCard, label: "V-ID", href: "/dashboard", isCenter: false },
    { icon: Home, label: "Dashboard", href: "/dashboard", isCenter: true },
    { icon: Calendar, label: "Service", href: "/dashboard/service", isCenter: false },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/bike";
    }
    return location.pathname === href;
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind footer */}
      <div className="lg:hidden h-20" />

      {/* Footer Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom"
      >
        <div className="flex items-center justify-around px-4 py-2">
          {/* Left - V-ID Passport */}
          <Link
            to="/dashboard"
            className="flex flex-col items-center gap-1 py-2 px-4"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                isActive("/dashboard")
                  ? "bg-wj-green/10"
                  : "bg-transparent"
              )}
            >
              <motion.div
                animate={isActive("/dashboard") ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <CreditCard
                  className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    isActive("/dashboard")
                      ? "text-wj-green"
                      : "text-muted-foreground"
                  )}
                />
              </motion.div>
            </motion.div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors duration-300",
                isActive("/dashboard")
                  ? "text-wj-green"
                  : "text-muted-foreground"
              )}
            >
              V-ID
            </span>
          </Link>

          {/* Center - Dashboard (Circular Active Button) */}
          <button
            onClick={() => setShowAllMenu(true)}
            className="relative -mt-6"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full bg-wj-green flex items-center justify-center shadow-lg shadow-wj-green/30"
            >
              <motion.div
                animate={{ rotate: showAllMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <Home className="h-6 w-6 text-background" />
              </motion.div>
            </motion.div>
            {/* Pulse animation */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-wj-green/30"
            />
          </button>

          {/* Right - Book Service */}
          <Link
            to="/dashboard/service"
            className="flex flex-col items-center gap-1 py-2 px-4"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                isActive("/dashboard/service")
                  ? "bg-wj-green/10"
                  : "bg-transparent"
              )}
            >
              <motion.div
                animate={isActive("/dashboard/service") ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Calendar
                  className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    isActive("/dashboard/service")
                      ? "text-wj-green"
                      : "text-muted-foreground"
                  )}
                />
              </motion.div>
            </motion.div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors duration-300",
                isActive("/dashboard/service")
                  ? "text-wj-green"
                  : "text-muted-foreground"
              )}
            >
              Service
            </span>
          </Link>
        </div>
      </motion.nav>

      {/* Full Menu Overlay */}
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

            {/* Menu Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border/50 z-50 max-h-[70vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Menu</h3>
                  <p className="text-xs text-muted-foreground">All navigation options</p>
                </div>
                <button
                  onClick={() => setShowAllMenu(false)}
                  className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Navigation Grid */}
              <div className="px-6 pb-8 grid grid-cols-3 gap-4 overflow-y-auto">
                {filteredNavItems.map((item, index) => {
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
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300",
                          isItemActive
                            ? "bg-wj-green/10 border border-wj-green/30"
                            : "bg-muted/30 border border-transparent hover:bg-muted/50"
                        )}
                      >
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                          animate={isItemActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            isItemActive
                              ? "bg-wj-green text-background"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                        <span
                          className={cn(
                            "text-xs font-medium text-center",
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

              {/* User Info */}
              <div className="px-6 pb-6 pt-2 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.tier} member</p>
                  </div>
                  <Link
                    to="/"
                    onClick={() => setShowAllMenu(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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

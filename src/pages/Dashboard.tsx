import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import PredictiveCareCard from "@/components/dashboard/PredictiveCareCard";
import VIDPassport from "@/components/dashboard/VIDPassport";
import ServiceBooking from "@/components/dashboard/ServiceBooking";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 hidden lg:block"
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl lg:text-2xl font-light text-foreground"
              >
                Welcome back, <span className="text-wj-green">{user?.name?.split(" ")[0]}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground mt-1"
              >
                Your e-bike journey at a glance
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.bikeName}</p>
                <p className="text-xs text-muted-foreground font-mono">{user?.bikeId}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-wj-green/10 flex items-center justify-center">
                <span className="text-wj-green text-base lg:text-lg">🚲</span>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Mobile Welcome Header */}
        <div className="lg:hidden px-4 py-4 border-b border-border/30">
          <h1 className="text-lg font-light text-foreground">
            Welcome, <span className="text-wj-green">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your e-bike journey at a glance
          </p>
        </div>

        {/* Content Grid */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              <VIDPassport />
              <PredictiveCareCard />
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              <ServiceBooking />
              
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border/50 p-4 sm:p-6"
              >
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">Membership Benefits</h3>
                <div className="space-y-2 sm:space-y-3">
                  {user?.tier === "black" && (
                    <>
                      <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-wj-green/5 border border-wj-green/20">
                        <span className="text-base sm:text-lg">🎯</span>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-foreground">Priority Service</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">24h turnaround guarantee</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-wj-green/5 border border-wj-green/20">
                        <span className="text-base sm:text-lg">🚐</span>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-foreground">Valet Pick-up</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Free doorstep service</p>
                        </div>
                      </div>
                    </>
                  )}
                  {user?.tier === "plus" && (
                    <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50 border border-border/50">
                      <span className="text-base sm:text-lg">⚡</span>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-foreground">Extended Warranty</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">3-year coverage included</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50 border border-border/50">
                    <span className="text-base sm:text-lg">🔧</span>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-foreground">Seasonal Checkups</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Included in your plan</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

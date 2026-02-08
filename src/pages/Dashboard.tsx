import { motion } from "framer-motion";
import MobileFooterNav from "@/components/dashboard/MobileFooterNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BikeShowcase from "@/components/dashboard/BikeShowcase";
import ServiceRequestCard from "@/components/dashboard/ServiceRequestCard";
import WalletCard from "@/components/dashboard/WalletCard";
import ServiceCountdown from "@/components/dashboard/ServiceCountdown";
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <DashboardHeader />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-wider">
            <span className="text-foreground">WJ</span>
            <span className="text-wj-green"> VISION</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 lg:p-6">
          {/* 12 Column Grid Layout */}
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            {/* Bike Showcase - Columns 1-5 */}
            <div className="col-span-12 lg:col-span-5">
              <BikeShowcase />
            </div>

            {/* Middle Section - Columns 6-8 */}
            <div className="col-span-12 lg:col-span-3 grid grid-rows-2 gap-4 lg:gap-6">
              <ServiceRequestCard />
              <WalletCard />
            </div>

            {/* Service Countdown - Columns 9-12 */}
            <div className="col-span-12 lg:col-span-4">
              <ServiceCountdown />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Footer Navigation */}
      <div className="lg:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
}

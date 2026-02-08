import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BikeShowcase from "@/components/dashboard/BikeShowcase";
import ServiceRequestCard from "@/components/dashboard/ServiceRequestCard";
import WalletCard from "@/components/dashboard/WalletCard";
import ServiceCountdown from "@/components/dashboard/ServiceCountdown";
import RevisionHistoryTable from "@/components/dashboard/RevisionHistoryTable";
import AccessoryCarousel from "@/components/dashboard/AccessoryCarousel";
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
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
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

        {/* Revision History + Accessory Carousel */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <RevisionHistoryTable />
          </div>
          
          {/* Accessory Carousel - 4 columns */}
          <div className="col-span-12 lg:col-span-4">
            <AccessoryCarousel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BikeShowcase from "@/components/dashboard/BikeShowcase";
import MemberPassCard from "@/components/dashboard/MemberPassCard";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for multiple bikes (in production, this would come from API)
const mockUserBikes = [
  {
    id: 1,
    bikeId: "V8-2024-NL-00421",
    bikeName: "WJ V8 Urban",
    purchaseDate: "2024-01-15",
    image: "/src/assets/bike-v8-front.png",
  },
  // Add more bikes here if user has multiple
];

export default function EPassPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  // For demo, we use the user's single bike
  // In production, this would be an array from the API
  const userBikes = [
    {
      id: 1,
      bikeId: user?.bikeId || "V8-2024-XX-00000",
      bikeName: user?.bikeName || "WJ V8",
      purchaseDate: user?.purchaseDate || "2024-01-01",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <h1 className="text-xl sm:text-2xl font-light text-foreground">E-Pass</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your digital identity & membership cards
          </p>
        </motion.div>

        {/* Bikes Sections - Stack if multiple bikes */}
        {userBikes.map((bike, index) => (
          <motion.div
            key={bike.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Section Header for multiple bikes */}
            {userBikes.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-muted-foreground px-2">
                  Bike {index + 1} - {bike.bikeName}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
            )}

            {/* 10-Column Grid: BikeShowcase (6) + MemberPassCard (4) */}
            <div className="grid grid-cols-12 gap-4 lg:gap-6">
              {/* Bike Showcase - 6 columns */}
              <div className="col-span-12 lg:col-span-6">
                <BikeShowcase />
              </div>

              {/* Member Pass Card - 4 columns (using 6 on 12-grid = 4 on 10-grid equivalent) */}
              <div className="col-span-12 lg:col-span-6 xl:col-span-4">
                <MemberPassCard
                  bikeId={bike.bikeId}
                  bikeName={bike.bikeName}
                  purchaseDate={bike.purchaseDate}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}

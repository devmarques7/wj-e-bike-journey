import { motion } from "framer-motion";
import { ArrowLeft, Crown, Shield, Wrench, Clock, Gift, Sparkles, TrendingUp, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileFooterNav from "@/components/dashboard/MobileFooterNav";

// Privileges by tier
const tierPrivileges = {
  light: {
    name: "Light",
    price: "Free",
    period: "with bike purchase",
    description: "Essential coverage for everyday riders",
    privileges: [
      { name: "2-year warranty", included: true },
      { name: "E-ID Digital Passport", included: true },
      { name: "Basic theft protection", included: true },
      { name: "Priority service", included: false },
      { name: "Free annual maintenance", included: false },
      { name: "Guaranteed resale value", included: false },
    ],
  },
  plus: {
    name: "Plus",
    price: "€14.99",
    period: "/month",
    description: "Enhanced protection & peace of mind",
    privileges: [
      { name: "5-year warranty", included: true },
      { name: "E-ID Digital Passport", included: true },
      { name: "Premium theft protection", included: true },
      { name: "Priority service", included: true },
      { name: "Free annual maintenance", included: true },
      { name: "Guaranteed resale value", included: false },
    ],
  },
  black: {
    name: "Black",
    price: "€24.99",
    period: "/month",
    description: "The ultimate ownership experience",
    privileges: [
      { name: "Lifetime warranty", included: true },
      { name: "E-ID Digital Passport", included: true },
      { name: "Complete theft coverage", included: true },
      { name: "VIP priority service", included: true },
      { name: "Unlimited maintenance", included: true },
      { name: "Guaranteed 60% resale", included: true },
    ],
  },
};

// Mock maintenance history with points
const maintenanceHistory = [
  { id: 1, date: "2024-01-15", service: "Full Bike Tune-Up", points: 150, status: "completed" },
  { id: 2, date: "2024-02-20", service: "Brake Adjustment", points: 75, status: "completed" },
  { id: 3, date: "2024-03-10", service: "Chain Replacement", points: 100, status: "completed" },
  { id: 4, date: "2024-04-05", service: "Wheel Truing", points: 80, status: "completed" },
  { id: 5, date: "2024-05-22", service: "Battery Diagnostics", points: 120, status: "completed" },
  { id: 6, date: "2024-06-18", service: "Software Update", points: 50, status: "completed" },
  { id: 7, date: "2024-07-30", service: "Annual Inspection", points: 200, status: "completed" },
  { id: 8, date: "2024-08-14", service: "Tire Replacement", points: 90, status: "completed" },
];

const cardStyles = {
  light: { gradient: "from-zinc-400 to-zinc-600", badge: "bg-zinc-500" },
  plus: { gradient: "from-blue-400 to-blue-600", badge: "bg-blue-500" },
  black: { gradient: "from-amber-400 to-amber-600", badge: "bg-amber-500" },
};

export default function MyWallet() {
  const { user } = useAuth();
  const tier = user?.tier || "light";
  const tierData = tierPrivileges[tier];
  const styles = cardStyles[tier];
  
  const totalPoints = maintenanceHistory.reduce((sum, item) => sum + item.points, 0);

  const nextTier = tier === "light" ? "plus" : tier === "plus" ? "black" : null;
  const nextTierData = nextTier ? tierPrivileges[nextTier] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <DashboardHeader />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-wider">
            <span className="text-foreground">My</span>
            <span className="text-wj-green"> Wallet</span>
          </span>
          <div className="w-5" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 pb-24 lg:pb-8">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
          {/* Back Button - Desktop */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">My Wallet</h1>
            <p className="text-muted-foreground text-sm">Manage your membership and track your rewards</p>
          </motion.div>

          {/* Card + Privileges Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Member Card - Left */}
            <div className="col-span-12 lg:col-span-5">
              <div className="relative aspect-[1.6/1] rounded-3xl overflow-hidden bg-gradient-to-br from-background to-secondary border border-border/50">
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-wj-green blur-3xl" />
                  <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-wj-green blur-2xl" />
                </div>

                {/* Card Content */}
                <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Member Card</p>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">WJ Vision</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                      {tierData.name}
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Card Number</p>
                    <p className="text-foreground text-lg font-mono tracking-[0.15em]">4532 •••• •••• {tier === "light" ? "8901" : tier === "plus" ? "2847" : "1562"}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Member</p>
                      <p className="text-foreground text-sm font-medium">{user?.name || "Guest"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Total Points</p>
                      <p className="text-wj-green text-lg font-bold">{totalPoints.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privileges - Right */}
            <div className="col-span-12 lg:col-span-7">
              <div className="h-full rounded-3xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-wj-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{tierData.name} Member Privileges</h3>
                    <p className="text-xs text-muted-foreground">{tierData.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tierData.privileges.map((privilege, index) => (
                    <motion.div
                      key={privilege.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${privilege.included ? "bg-wj-green/5 border border-wj-green/20" : "bg-muted/30 border border-border/30"}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${privilege.included ? "bg-wj-green/20" : "bg-muted"}`}>
                        <Check className={`h-3.5 w-3.5 ${privilege.included ? "text-wj-green" : "text-muted-foreground/30"}`} />
                      </div>
                      <span className={`text-sm ${privilege.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {privilege.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Points Table + Upgrade Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Maintenance & Points Table - 8 columns */}
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-wj-green" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Points History</h3>
                        <p className="text-xs text-muted-foreground">Earn points with every maintenance</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-wj-green">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-bold">+{totalPoints} pts</span>
                    </div>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Service</TableHead>
                        <TableHead className="text-muted-foreground text-right">Points</TableHead>
                        <TableHead className="text-muted-foreground text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceHistory.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.03 }}
                          className="border-border/30 hover:bg-muted/30"
                        >
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground">{item.service}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-wj-green font-semibold">+{item.points}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="px-2 py-0.5 rounded-full bg-wj-green/10 text-wj-green text-xs font-medium capitalize">
                              {item.status}
                            </span>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Upgrade Plan Section - 4 columns */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Current Plan */}
              <div className="rounded-3xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-wj-green/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-wj-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
                    <p className="text-xs text-muted-foreground">Your active subscription</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-wj-green/10 to-transparent border border-wj-green/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${styles.gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                      {tierData.name}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-foreground">{tierData.price}</span>
                      <span className="text-xs text-muted-foreground">{tierData.period}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{tierData.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Member since {user?.purchaseDate ? new Date(user.purchaseDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Jan 2024"}</span>
                  </div>
                </div>
              </div>

              {/* Upgrade Section */}
              {nextTierData && (
                <div className="rounded-3xl border border-wj-green/30 bg-gradient-to-br from-wj-green/5 to-transparent p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-wj-green/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-wj-green" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Upgrade Your Plan</h3>
                      <p className="text-xs text-muted-foreground">Unlock more benefits</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${cardStyles[nextTier].gradient} text-xs font-bold uppercase tracking-wider text-white`}>
                        {nextTierData.name}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-foreground">{nextTierData.price}</span>
                        <span className="text-xs text-muted-foreground">{nextTierData.period}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {nextTierData.privileges
                        .filter((p) => p.included && !tierData.privileges.find((tp) => tp.name === p.name && tp.included))
                        .slice(0, 3)
                        .map((privilege) => (
                          <div key={privilege.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Gift className="h-3.5 w-3.5 text-wj-green" />
                            <span>{privilege.name}</span>
                          </div>
                        ))}
                    </div>

                    <Button className="w-full gradient-wj text-white hover:opacity-90">
                      Upgrade to {nextTierData.name}
                    </Button>
                  </div>
                </div>
              )}

              {!nextTierData && (
                <div className="rounded-3xl border border-wj-green/30 bg-gradient-to-br from-wj-green/5 to-transparent p-6 text-center">
                  <Crown className="h-8 w-8 text-wj-green mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">You're at the top!</h3>
                  <p className="text-xs text-muted-foreground">You have the highest membership tier with all benefits unlocked.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Mobile Footer Navigation */}
      <div className="lg:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
}

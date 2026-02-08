import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, Bike, Wrench, Heart, Crown, CreditCard, LayoutGrid } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Overview" },
  { href: "/dashboard/v-id", icon: CreditCard, label: "V-ID" },
  { href: "/dashboard/bike", icon: Bike, label: "Bike" },
  { href: "/dashboard/service", icon: Wrench, label: "Service" },
  { href: "/dashboard/favorites", icon: Heart, label: "Favorites" },
  { href: "/dashboard/vip", icon: Crown, label: "VIP" },
];

export default function DashboardHeader() {
  const { user } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50"
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left - Company Name */}
        <Link to="/" className="flex items-center gap-1">
          <span className="text-lg font-bold tracking-wider">
            <span className="text-foreground">WJ</span>
            <span className="text-wj-green"> VISION</span>
          </span>
        </Link>

        {/* Center - Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-wj-green/10 text-wj-green"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <motion.span
                  initial={false}
                  animate={{
                    width: isActive ? "auto" : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium overflow-hidden whitespace-nowrap"
                >
                  {isActive && item.label}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wj-green rounded-full" />
          </button>
          <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-wj-green/50 transition-all">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-wj-green/10 text-wj-green text-sm font-medium">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </motion.header>
  );
}

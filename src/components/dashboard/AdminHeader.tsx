import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  ChevronLeft, 
  Bell, 
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Users,
  Wrench,
  Calendar,
  CreditCard,
  Package,
  Contact,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const quickNavItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard/admin" },
  { icon: Wrench, label: "Workshop", href: "/dashboard/admin/workshop" },
  { icon: Calendar, label: "Manage", href: "/dashboard/admin/manage" },
  { icon: CreditCard, label: "Plans", href: "/dashboard/admin/plans" },
  { icon: Users, label: "Staff", href: "/dashboard/admin/members" },
  { icon: Package, label: "Inventory", href: "/dashboard/admin/inventory" },
  { icon: Contact, label: "CRM", href: "/dashboard/admin/crm" },
];

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return location.pathname === "/dashboard/admin";
    }
    return location.pathname === href;
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 px-6 py-4 bg-background/60 backdrop-blur-xl border border-border/30 rounded-2xl"
    >
      <div className="flex items-center justify-between relative">
        {/* Left: Brand + Back */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-wj-green transition-colors" />
            <span className="text-lg font-bold tracking-wider">
              <span className="text-foreground">WJ</span>
              <span className="text-wj-green"> COMMAND</span>
            </span>
          </Link>
        </div>

        {/* Quick Nav — centered, animated icon pills with expanding label on active/hover */}
        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {quickNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href} aria-label={item.label}>
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  initial="rest"
                  whileHover={active ? "active" : "hover"}
                  animate={active ? "active" : "rest"}
                  className={cn(
                    "group flex items-center h-9 rounded-full px-2.5 transition-colors duration-200 relative overflow-hidden",
                    active
                      ? "bg-wj-green/15 text-wj-green"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <motion.div
                    variants={{
                      rest: { width: 0, opacity: 0, marginLeft: 0 },
                      hover: { width: 80, opacity: 0.85, marginLeft: 8 },
                      active: { width: 80, opacity: 1, marginLeft: 8 },
                    }}
                    transition={{
                      width: { type: "spring", stiffness: 350, damping: 32 },
                      opacity: { duration: 0.18 },
                      marginLeft: { duration: 0.18 },
                    }}
                    className="overflow-hidden flex items-center"
                  >
                    <span className="text-xs font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Right: Status + User */}
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-wj-green/10 text-wj-green text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-wj-green animate-pulse" />
            Live
          </span>

          <ThemeToggle />

          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-wj-green" />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-wj-green">Admin</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-wj-green/30">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-wj-green/10 text-wj-green text-xs font-semibold">
                    {user?.name ? getInitials(user.name) : "AD"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/admin/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}

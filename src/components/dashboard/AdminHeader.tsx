import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  ChevronLeft, 
  Bell, 
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  Wrench,
  Calendar,
  CreditCard,
  Package
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

const quickNavItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard/admin" },
  { icon: Wrench, label: "Workshop", href: "/dashboard/admin/workshop" },
  { icon: Calendar, label: "Manage", href: "/dashboard/admin/manage" },
  { icon: CreditCard, label: "Plans", href: "/dashboard/admin/plans" },
  { icon: Users, label: "Staff", href: "/dashboard/admin/members" },
  { icon: Package, label: "Inventory", href: "/dashboard/admin/inventory" },
];

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
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
      <div className="flex items-center justify-between">
        {/* Left: Brand + Back */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-wj-green transition-colors" />
            <span className="text-lg font-bold tracking-wider">
              <span className="text-foreground">WJ</span>
              <span className="text-wj-green"> COMMAND</span>
            </span>
          </Link>
          
          {/* Quick Nav Pills */}
          <div className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-border/30">
            {quickNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors",
                  isActive(item.href)
                    ? "bg-wj-green/20 text-wj-green font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Status + User */}
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-wj-green/10 text-wj-green text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-wj-green animate-pulse" />
            Live
          </span>

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

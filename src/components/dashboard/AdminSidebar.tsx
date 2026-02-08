import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard/admin" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/admin/analytics" },
  { icon: ShoppingCart, label: "Orders", href: "/dashboard/admin/orders" },
  { icon: Users, label: "Members", href: "/dashboard/admin/members" },
  { icon: Wrench, label: "Workshop", href: "/dashboard/admin/workshop" },
  { icon: Bell, label: "Notifications", href: "/dashboard/admin/notifications" },
  { icon: Settings, label: "Settings", href: "/dashboard/admin/settings" },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-64 min-h-screen bg-secondary flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/20">
        <Link to="/" className="flex items-center gap-2 group">
          <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-wj-green transition-colors" />
          <span className="text-lg font-bold tracking-wider">
            <span className="text-secondary-foreground">WJ</span>
            <span className="text-wj-green"> COMMAND</span>
          </span>
        </Link>
      </div>

      {/* Admin Info */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-10 h-10 rounded-full bg-muted"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-secondary-foreground truncate">{user?.name}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-wj-green text-white">
              ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-wj-green/20 text-wj-green"
                      : "text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-secondary-foreground/70 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
}

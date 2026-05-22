import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wrench,
  Plus,
  Package,
  Menu,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Boxes,
  Tag,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const primary = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard/admin" },
  { icon: Wrench, label: "Workshop", href: "/dashboard/admin/workshop" },
  { icon: Package, label: "Inventory", href: "/dashboard/admin/inventory" },
];

const more = [
  { icon: Calendar, label: "Manage", href: "/dashboard/admin/manage" },
  { icon: CreditCard, label: "Plans", href: "/dashboard/admin/plans" },
  { icon: Users, label: "Members", href: "/dashboard/admin/members" },
  { icon: Settings, label: "Settings", href: "/dashboard/admin/settings" },
];

const addItems = [
  { icon: Boxes, label: "New Product", href: "/dashboard/admin/inventory/products" },
  { icon: Tag, label: "New Category", href: "/dashboard/admin/inventory/categories" },
  { icon: MapPin, label: "New Location", href: "/dashboard/admin/inventory/locations" },
];

export default function AdminFloatingNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) =>
    href === "/dashboard/admin"
      ? location.pathname === href
      : location.pathname.startsWith(href);

  return (
    <>
      <div className="lg:hidden h-24" />
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="lg:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/40 bg-background/80 backdrop-blur-xl px-2 py-2 shadow-2xl shadow-black/30 max-w-[calc(100vw-2rem)]">
          {primary.slice(0, 2).map((item) => (
            <NavBtn key={item.href} item={item} active={isActive(item.href)} onClick={() => navigate(item.href)} />
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative -my-3 mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-wj-green text-primary-foreground shadow-lg shadow-wj-green/40 active:scale-95 transition-transform">
                <Plus className="h-5 w-5" />
                <motion.span
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-wj-green/30"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2 w-56">
              <DropdownMenuLabel>Quick Add</DropdownMenuLabel>
              {addItems.map((a) => (
                <DropdownMenuItem key={a.label} onClick={() => navigate(a.href)} className="gap-2">
                  <a.icon className="h-4 w-4 text-wj-green" />
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NavBtn
            item={primary[2]}
            active={isActive(primary[2].href)}
            onClick={() => navigate(primary[2].href)}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors active:scale-95",
                  "hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-52">
              <DropdownMenuLabel>More</DropdownMenuLabel>
              {more.map((m) => (
                <DropdownMenuItem key={m.href} onClick={() => navigate(m.href)} className="gap-2">
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="gap-2">Back to site</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.nav>
    </>
  );
}

function NavBtn({
  item,
  active,
  onClick,
}: {
  item: { icon: React.ElementType; label: string; href: string };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all active:scale-95",
        active
          ? "bg-wj-green/15 text-wj-green"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {active && <span className="hidden xs:inline sm:inline">{item.label}</span>}
    </button>
  );
}
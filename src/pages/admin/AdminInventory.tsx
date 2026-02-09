import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp,
  ShoppingCart,
  Bike,
  Settings
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const inventoryKPIs = [
  {
    label: "Total SKUs",
    value: "847",
    change: "+24",
    trend: "up" as const,
    icon: Package,
  },
  {
    label: "Low Stock Items",
    value: "12",
    change: "-3",
    trend: "up" as const,
    icon: AlertTriangle,
  },
  {
    label: "Monthly Turnover",
    value: "€142k",
    change: "+18%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    label: "Pending Orders",
    value: "34",
    change: "+8",
    trend: "down" as const,
    icon: ShoppingCart,
  },
];

const inventoryItems = [
  { id: 1, name: "V8 Sport Frame", category: "Frames", stock: 24, minStock: 10, price: "€1,299", status: "in_stock" },
  { id: 2, name: "V8 Urban Frame", category: "Frames", stock: 18, minStock: 10, price: "€1,099", status: "in_stock" },
  { id: 3, name: "Premium Battery Pack", category: "Electronics", stock: 5, minStock: 15, price: "€599", status: "low_stock" },
  { id: 4, name: "Carbon Fork Set", category: "Components", stock: 32, minStock: 8, price: "€349", status: "in_stock" },
  { id: 5, name: "Display Unit V3", category: "Electronics", stock: 2, minStock: 10, price: "€189", status: "critical" },
  { id: 6, name: "Hydraulic Brakes Set", category: "Components", stock: 45, minStock: 20, price: "€129", status: "in_stock" },
  { id: 7, name: "Premium Chain Kit", category: "Components", stock: 8, minStock: 15, price: "€89", status: "low_stock" },
  { id: 8, name: "Motor Unit 750W", category: "Electronics", stock: 15, minStock: 10, price: "€449", status: "in_stock" },
];

const categories = [
  { name: "Frames", items: 124, value: "€158,400" },
  { name: "Electronics", items: 256, value: "€89,200" },
  { name: "Components", items: 312, value: "€45,600" },
  { name: "Accessories", items: 155, value: "€12,800" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in_stock":
      return <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 text-[10px]">In Stock</Badge>;
    case "low_stock":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Low Stock</Badge>;
    case "critical":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Critical</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
};

export default function AdminInventory() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl sm:text-2xl font-light text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stock levels and parts management
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {inventoryKPIs.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Inventory Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border/30">
                <h3 className="text-sm font-medium text-foreground">Stock Overview</h3>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Item</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Category</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Stock</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Min. Stock</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Price</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{item.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-xs font-medium",
                            item.stock <= item.minStock * 0.3 ? "text-red-400" :
                            item.stock <= item.minStock ? "text-amber-400" :
                            "text-foreground"
                          )}>
                            {item.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.minStock}</TableCell>
                        <TableCell className="text-xs">{item.price}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </div>

          {/* Categories - 4 columns */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Categories Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Categories</h3>
              </div>
              
              <div className="space-y-3">
                {categories.map((cat, index) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.items} items</p>
                    </div>
                    <span className="text-xs text-wj-green font-medium">{cat.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Quick Actions</h3>
              </div>
              
              <div className="space-y-2">
                <button className="w-full p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                  <p className="text-xs font-medium text-foreground">Reorder Low Stock</p>
                  <p className="text-[10px] text-muted-foreground">12 items need attention</p>
                </button>
                <button className="w-full p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                  <p className="text-xs font-medium text-foreground">Export Inventory</p>
                  <p className="text-[10px] text-muted-foreground">Download as CSV</p>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  Wallet,
  History,
  Lock,
  Settings2,
  ArrowLeftRight,
  ShoppingCart,
  Download,
  FolderTree,
  MapPin,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import KPICarousel from "@/components/dashboard/KPICarousel";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useInventoryRows,
  useInventoryKPIs,
  useMovements,
  type InventoryRow,
  type MovementRow,
} from "@/hooks/inventory/useInventoryData";
import { useProducts, useCategories, useLocations } from "@/hooks/inventory/useCatalogCrud";
import AdjustStockModal from "@/components/dashboard/inventory/AdjustStockModal";
import ReceiveStockModal from "@/components/dashboard/inventory/ReceiveStockModal";
import TransferStockModal from "@/components/dashboard/inventory/TransferStockModal";
import ReorderModal from "@/components/dashboard/inventory/ReorderModal";
import MovementDetailDrawer from "@/components/dashboard/inventory/MovementDetailDrawer";
import { usePermissions } from "@/hooks/usePermissions";
import { downloadCSV } from "@/lib/csv";
import { ArrowUpRight, Plus, Upload } from "lucide-react";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    n,
  );

const statusOf = (r: InventoryRow) => {
  const real = r.qty_available - r.qty_reserved;
  if (real <= 0) return { l: "Out", c: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (real <= r.low_stock_threshold * 0.5)
    return { l: "Critical", c: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (real <= r.low_stock_threshold)
    return { l: "Low Stock", c: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  return { l: "In Stock", c: "bg-wj-green/20 text-wj-green border-wj-green/30" };
};

export default function AdminInventory() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { can } = usePermissions();
  const { rows, loading } = useInventoryRows();
  const kpi = useInventoryKPIs(rows);
  const { movements } = useMovements(80);
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "low" | "incoming" | "movements">("all");
  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null);
  const [receiveRow, setReceiveRow] = useState<InventoryRow | null>(null);
  const [transferRow, setTransferRow] = useState<InventoryRow | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [movementSel, setMovementSel] = useState<MovementRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.variant.sku} ${r.variant.name} ${r.variant.product.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const real = r.qty_available - r.qty_reserved;
      if (tab === "low" && real > r.low_stock_threshold) return false;
      if (tab === "incoming" && r.qty_incoming <= 0) return false;
      return true;
    });
  }, [rows, search, tab]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("inventory.view")) return <Navigate to="/dashboard" replace />;

  const kpiCards = [
    { label: "Total SKUs", value: String(kpi.skus), change: `${rows.length} rows`, trend: "up" as const, icon: Package },
    {
      label: "Low Stock",
      value: String(kpi.lowStock),
      change: kpi.lowStock > 0 ? "Action" : "OK",
      trend: kpi.lowStock > 0 ? ("down" as const) : ("up" as const),
      icon: AlertTriangle,
    },
    { label: "Incoming", value: String(kpi.incoming), change: "units", trend: "up" as const, icon: ArrowDownToLine },
    { label: "Stock Value", value: fmtEur(kpi.value), change: "live", trend: "up" as const, icon: Wallet },
    { label: "Products", value: String(products.length), change: `${products.filter((p: any) => p.is_active).length} active`, trend: "up" as const, icon: Package },
    { label: "Categories", value: String(categories.length), change: `${locations.length} locations`, trend: "up" as const, icon: FolderTree },
  ];

  const exportStock = () =>
    downloadCSV(
      `inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((r) => ({
        sku: r.variant.sku,
        product: r.variant.product.name,
        variant: r.variant.name,
        location: r.location.name,
        qty_available: r.qty_available,
        qty_reserved: r.qty_reserved,
        qty_incoming: r.qty_incoming,
        low_stock_threshold: r.low_stock_threshold,
        reorder_point: r.reorder_point,
      })),
    );

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">Stock levels, movements and replenishment</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {can("product.view") && (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/admin/inventory/products"><Package className="h-4 w-4 mr-1" /> Products</Link>
              </Button>
            )}
            {can("category.manage") && (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/admin/inventory/categories"><FolderTree className="h-4 w-4 mr-1" /> Categories</Link>
              </Button>
            )}
            {can("location.manage") && (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/admin/inventory/locations"><MapPin className="h-4 w-4 mr-1" /> Locations</Link>
              </Button>
            )}
            {can("inventory.reorder") && (
              <Button size="sm" onClick={() => setReorderOpen(true)} className="bg-wj-green hover:bg-wj-green/90">
                <ShoppingCart className="h-4 w-4 mr-1" /> Reorder
              </Button>
            )}
            {can("inventory.export") && (
              <Button size="sm" variant="outline" onClick={exportStock}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            )}
          </div>
        </motion.div>

        {/* KPIs */}
        <KPICarousel desktopGridClassName="md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 lg:gap-6">
          {kpiCards.map((k, i) => (
            <AdminKPICard key={k.label} {...k} index={i} />
          ))}
        </KPICarousel>

        {/* Catalog quick panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: "products",
              icon: Package,
              title: "Products",
              count: products.length,
              sub: `${products.filter((p: any) => p.is_active).length} active · ${products.filter((p: any) => p.is_featured).length} featured`,
              href: "/dashboard/admin/inventory/products",
              can: can("product.view"),
              recent: products.slice(0, 3).map((p: any) => ({ id: p.id, label: p.name, meta: p.product_type })),
            },
            {
              key: "categories",
              icon: FolderTree,
              title: "Categories",
              count: categories.length,
              sub: `${new Set(categories.map((c: any) => c.type)).size} types`,
              href: "/dashboard/admin/inventory/categories",
              can: can("category.manage"),
              recent: categories.slice(0, 3).map((c: any) => ({ id: c.id, label: c.name, meta: c.type })),
            },
            {
              key: "locations",
              icon: MapPin,
              title: "Locations",
              count: locations.length,
              sub: `${locations.filter((l: any) => l.is_active).length} active`,
              href: "/dashboard/admin/inventory/locations",
              can: can("location.manage"),
              recent: locations.slice(0, 3).map((l: any) => ({ id: l.id, label: l.name, meta: l.location_type })),
            },
          ]
            .filter((p) => p.can)
            .map((p, i) => (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="group relative bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 hover:border-wj-green/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-wj-green/10 border border-wj-green/20 flex items-center justify-center">
                      <p.icon className="h-4 w-4 text-wj-green" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.title}</div>
                      <div className="text-2xl font-light text-foreground leading-tight">{p.count}</div>
                    </div>
                  </div>
                  <Link
                    to={p.href}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    aria-label={`Open ${p.title}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="text-[11px] text-muted-foreground mt-2">{p.sub}</div>

                <div className="mt-4 space-y-1.5 min-h-[72px]">
                  {p.recent.length === 0 && (
                    <div className="text-[11px] text-muted-foreground/70 italic">No entries yet</div>
                  )}
                  {p.recent.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs border-b border-border/20 last:border-0 pb-1.5"
                    >
                      <span className="truncate text-foreground/90">{r.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground ml-2 shrink-0">
                        {r.meta}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2">
                    <Link to={p.href}>
                      <ArrowUpRight className="h-3 w-3 mr-1" /> Manage
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2 text-wj-green hover:text-wj-green">
                    <Link to={p.href}>
                      <Plus className="h-3 w-3 mr-1" /> New
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2 ml-auto">
                    <Link to={p.href}>
                      <Upload className="h-3 w-3 mr-1" /> Import
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
        </div>

        {/* Tabs + Search */}
        <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="bg-muted/40">
                <TabsTrigger value="all" className="text-xs">All Stock</TabsTrigger>
                <TabsTrigger value="low" className="text-xs">
                  Low Stock {kpi.lowStock > 0 && <span className="ml-1 text-amber-400">·{kpi.lowStock}</span>}
                </TabsTrigger>
                <TabsTrigger value="incoming" className="text-xs">Incoming</TabsTrigger>
                <TabsTrigger value="movements" className="text-xs">Movements</TabsTrigger>
              </TabsList>
            </Tabs>
            {tab !== "movements" && (
              <Input
                placeholder="Search SKU or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background/60 max-w-xs"
              />
            )}
          </div>

          {/* Stock tables */}
          {tab !== "movements" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Product</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden md:table-cell">Location</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Avail.</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right hidden sm:table-cell">Reserved</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right hidden md:table-cell">Incoming</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right hidden lg:table-cell">Threshold</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right hidden lg:table-cell">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                        No inventory yet. Add products and variants to get started.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((r) => {
                    const s = statusOf(r);
                    const real = r.qty_available - r.qty_reserved;
                    return (
                      <TableRow key={r.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="text-xs">
                          <div className="font-medium text-foreground">{r.variant.product.name}</div>
                          <div className="text-[10px] text-muted-foreground">{r.variant.name}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          {r.variant.sku}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {r.location.name}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-xs text-right font-medium",
                            real <= 0
                              ? "text-red-400"
                              : real <= r.low_stock_threshold
                              ? "text-amber-400"
                              : "text-foreground",
                          )}
                        >
                          {r.qty_available}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground hidden sm:table-cell">
                          {r.qty_reserved}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground hidden md:table-cell">
                          {r.qty_incoming}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground hidden lg:table-cell">
                          {r.low_stock_threshold}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px]", s.c)}>{s.l}</Badge>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <div className="inline-flex items-center gap-2">
                            {can("inventory.receive") && (
                              <button onClick={() => setReceiveRow(r)} className="text-xs text-wj-green hover:underline inline-flex items-center gap-1">
                                <ArrowDownToLine className="h-3 w-3" /> Receive
                              </button>
                            )}
                            {can("inventory.transfer") && (
                              <button onClick={() => setTransferRow(r)} className="text-xs text-foreground/80 hover:underline inline-flex items-center gap-1">
                                <ArrowLeftRight className="h-3 w-3" /> Move
                              </button>
                            )}
                            {can("inventory.adjust") && (
                              <button onClick={() => setAdjustRow(r)} className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1">
                                <Settings2 className="h-3 w-3" /> Adjust
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Movements log */}
          {tab === "movements" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">When</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Product</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden md:table-cell">Location</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Δ</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                        No movements yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {movements.map((m) => (
                    <TableRow key={m.id} onClick={() => setMovementSel(m)} className="border-border/30 hover:bg-muted/30 cursor-pointer">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {m.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {m.variant?.product?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {m.variant?.sku ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                        {m.location?.name ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-xs text-right font-medium",
                          m.qty_delta > 0 ? "text-wj-green" : "text-red-400",
                        )}
                      >
                        {m.qty_delta > 0 ? `+${m.qty_delta}` : m.qty_delta}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                        {m.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AdjustStockModal row={adjustRow} onClose={() => setAdjustRow(null)} />
      <ReceiveStockModal row={receiveRow} onClose={() => setReceiveRow(null)} />
      <TransferStockModal row={transferRow} onClose={() => setTransferRow(null)} />
      <ReorderModal open={reorderOpen} rows={rows} onClose={() => setReorderOpen(false)} />
      <MovementDetailDrawer movement={movementSel} onClose={() => setMovementSel(null)} />
    </AdminDashboardLayout>
  );
}

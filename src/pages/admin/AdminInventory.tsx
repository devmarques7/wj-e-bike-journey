import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  Wallet,
  Settings2,
  ArrowLeftRight,
  ShoppingCart,
  Download,
  FolderTree,
  MapPin,
  ArrowUpRight,
  Plus,
  Upload,
  MoreVertical,
  History,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import KPICarousel from "@/components/dashboard/KPICarousel";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const fmtEur = (n: number) =>
  new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const statusOf = (r: InventoryRow) => {
  const real = r.qty_available - r.qty_reserved;
  if (real <= 0) return { l: "Out", c: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (real <= r.low_stock_threshold * 0.5)
    return { l: "Critical", c: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (real <= r.low_stock_threshold)
    return { l: "Low", c: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
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

  // Top selling products inferred from outgoing movements (negative qty_delta)
  const topProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type?: string; outQty: number }>();
    for (const m of movements) {
      if (m.qty_delta >= 0) continue;
      const pid = m.variant?.product?.id;
      const pname = m.variant?.product?.name;
      if (!pid || !pname) continue;
      const cur = map.get(pid) ?? { id: pid, name: pname, outQty: 0 };
      cur.outQty += Math.abs(m.qty_delta);
      map.set(pid, cur);
    }
    // Enrich with product_type
    for (const [id, entry] of map) {
      const p = products.find((x: any) => x.id === id);
      if (p) entry.type = p.product_type;
    }
    const ranked = Array.from(map.values()).sort((a, b) => b.outQty - a.outQty).slice(0, 4);
    // Fallback: if no movements yet, show featured then active
    if (ranked.length === 0) {
      return products
        .slice()
        .sort((a: any, b: any) => Number(b.is_featured) - Number(a.is_featured))
        .slice(0, 4)
        .map((p: any) => ({ id: p.id, name: p.name, type: p.product_type, outQty: 0 }));
    }
    return ranked;
  }, [movements, products]);

  // Inventory aggregated per location
  const stockByLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.location.id, (m.get(r.location.id) ?? 0) + r.qty_available);
    return m;
  }, [rows]);

  // Top categories by product count
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products as any[]) {
      if (!p.category_id) continue;
      counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
    }
    return (categories as any[])
      .map((c) => ({ id: c.id, name: c.name, type: c.type, count: counts.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [products, categories]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("inventory.view")) return <Navigate to="/dashboard" replace />;

  const kpiCards = [
    { label: "Stock Value", value: fmtEur(kpi.value), change: "live", trend: "up" as const, icon: Wallet },
    { label: "Total SKUs", value: String(kpi.skus), change: `${rows.length} rows`, trend: "up" as const, icon: Package },
    {
      label: "Low Stock",
      value: String(kpi.lowStock),
      change: kpi.lowStock > 0 ? "Action" : "OK",
      trend: kpi.lowStock > 0 ? ("down" as const) : ("up" as const),
      icon: AlertTriangle,
    },
    { label: "Incoming", value: String(kpi.incoming), change: "units", trend: "up" as const, icon: ArrowDownToLine },
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
        {/* Header */}
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
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/admin/inventory/history">
                <History className="h-4 w-4 mr-1" /> History
              </Link>
            </Button>
            {(can("inventory.reorder") || can("inventory.receive")) && (
              <Button
                size="sm"
                onClick={() => setReorderOpen(true)}
                className="bg-wj-green hover:bg-wj-green/90"
              >
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

        {/* KPIs — 4 essentials */}
        <KPICarousel desktopGridClassName="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6">
          {kpiCards.map((k, i) => (
            <AdminKPICard key={k.label} {...k} index={i} />
          ))}
        </KPICarousel>

        {/* Main grid: table on the left, catalog panels on the right */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Table */}
          <div className="xl:col-span-2 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="bg-muted/40">
                  <TabsTrigger value="all" className="text-xs">All Stock</TabsTrigger>
                  <TabsTrigger value="low" className="text-xs">
                    Low {kpi.lowStock > 0 && <span className="ml-1 text-amber-400">·{kpi.lowStock}</span>}
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

            {tab !== "movements" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Product</TableHead>
                      <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">SKU</TableHead>
                      <TableHead className="text-muted-foreground text-xs hidden md:table-cell">Location</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right">Avail.</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right hidden sm:table-cell">Res.</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right hidden md:table-cell">In</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right hidden lg:table-cell">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
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
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{r.variant.sku}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{r.location.name}</TableCell>
                          <TableCell className={cn("text-xs text-right font-medium", real <= 0 ? "text-red-400" : real <= r.low_stock_threshold ? "text-amber-400" : "text-foreground")}>
                            {r.qty_available}
                          </TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground hidden sm:table-cell">{r.qty_reserved}</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground hidden md:table-cell">{r.qty_incoming}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px]", s.c)}>{s.l}</Badge>
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                {can("inventory.receive") && (
                                  <DropdownMenuItem onClick={() => setReceiveRow(r)} className="text-xs gap-2">
                                    <ArrowDownToLine className="h-3.5 w-3.5 text-wj-green" />
                                    Receive
                                  </DropdownMenuItem>
                                )}
                                {can("inventory.transfer") && (
                                  <DropdownMenuItem onClick={() => setTransferRow(r)} className="text-xs gap-2">
                                    <ArrowLeftRight className="h-3.5 w-3.5" />
                                    Move
                                  </DropdownMenuItem>
                                )}
                                {can("inventory.adjust") && (
                                  <DropdownMenuItem onClick={() => setAdjustRow(r)} className="text-xs gap-2">
                                    <Settings2 className="h-3.5 w-3.5" />
                                    Adjust
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

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
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px] capitalize">{m.movement_type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-foreground">{m.variant?.product?.name ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{m.variant?.sku ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{m.location?.name ?? "—"}</TableCell>
                        <TableCell className={cn("text-xs text-right font-medium", m.qty_delta > 0 ? "text-wj-green" : "text-red-400")}>
                          {m.qty_delta > 0 ? `+${m.qty_delta}` : m.qty_delta}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{m.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Right: Catalog — Row 1 (Products) full / Row 2 (Categories + Locations) split */}
          <div className="grid grid-cols-2 gap-4 content-start">
            <div className="col-span-2 flex items-center justify-between px-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Catalog</div>
              <Link to="/dashboard/admin/inventory/products" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>

            {/* Row 1 — Top Products */}
            {can("product.view") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="col-span-2 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-5 hover:border-wj-green/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-wj-green/10 border border-wj-green/20 flex items-center justify-center">
                      <Package className="h-4 w-4 text-wj-green" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top Products</div>
                      <div className="text-2xl font-light text-foreground leading-tight">{products.length}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {products.filter((p: any) => p.is_active).length} active · {products.filter((p: any) => p.is_featured).length} featured
                      </div>
                    </div>
                  </div>
                  <Link to="/dashboard/admin/inventory/products" className="text-muted-foreground hover:text-foreground">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {topProducts.length === 0 && (
                    <div className="text-[11px] text-muted-foreground/70 italic">No products yet</div>
                  )}
                  {topProducts.map((p, i) => (
                    <Link
                      key={p.id}
                      to={`/dashboard/admin/inventory/products/${p.id}`}
                      className="flex items-center justify-between gap-3 text-xs border-b border-border/20 last:border-0 pb-2 group/item"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-muted-foreground tabular-nums w-4">{String(i + 1).padStart(2, "0")}</span>
                        <span className="truncate text-foreground/90 group-hover/item:text-wj-green transition-colors">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.type && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.type}</span>}
                        <span className="text-[10px] tabular-nums text-wj-green">
                          {p.outQty > 0 ? `${p.outQty} out` : "—"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2">
                    <Link to="/dashboard/admin/inventory/products"><ArrowUpRight className="h-3 w-3 mr-1" /> Manage</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2 text-wj-green hover:text-wj-green">
                    <Link to="/dashboard/admin/inventory/products"><Plus className="h-3 w-3 mr-1" /> New</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2 ml-auto">
                    <Link to="/dashboard/admin/inventory/products"><Upload className="h-3 w-3 mr-1" /> Import</Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Row 2 — Categories */}
            {can("category.manage") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 hover:border-wj-green/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-wj-green/10 border border-wj-green/20 flex items-center justify-center">
                      <FolderTree className="h-3.5 w-3.5 text-wj-green" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Categories</div>
                      <div className="text-xl font-light text-foreground leading-tight">{categories.length}</div>
                    </div>
                  </div>
                  <Link to="/dashboard/admin/inventory/categories" className="text-muted-foreground hover:text-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-1.5 min-h-[88px]">
                  {topCategories.length === 0 && (
                    <div className="text-[10px] text-muted-foreground/70 italic">No categories</div>
                  )}
                  {topCategories.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[11px] border-b border-border/20 last:border-0 pb-1">
                      <span className="truncate text-foreground/90">{c.name}</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground ml-2 shrink-0">{c.count}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20">
                  <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 text-wj-green hover:text-wj-green">
                    <Link to="/dashboard/admin/inventory/categories"><Plus className="h-3 w-3 mr-0.5" /> New</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 ml-auto">
                    <Link to="/dashboard/admin/inventory/categories"><Upload className="h-3 w-3 mr-0.5" /> Import</Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Row 2 — Locations */}
            {can("location.manage") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 hover:border-wj-green/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-wj-green/10 border border-wj-green/20 flex items-center justify-center">
                      <MapPin className="h-3.5 w-3.5 text-wj-green" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Locations</div>
                      <div className="text-xl font-light text-foreground leading-tight">{locations.length}</div>
                    </div>
                  </div>
                  <Link to="/dashboard/admin/inventory/locations" className="text-muted-foreground hover:text-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-1.5 min-h-[88px]">
                  {locations.length === 0 && (
                    <div className="text-[10px] text-muted-foreground/70 italic">No locations</div>
                  )}
                  {(locations as any[]).slice(0, 4).map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-[11px] border-b border-border/20 last:border-0 pb-1">
                      <span className="truncate text-foreground/90">{l.name}</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground ml-2 shrink-0">
                        {stockByLocation.get(l.id) ?? 0}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20">
                  <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 text-wj-green hover:text-wj-green">
                    <Link to="/dashboard/admin/inventory/locations"><Plus className="h-3 w-3 mr-0.5" /> New</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 ml-auto">
                    <Link to="/dashboard/admin/inventory/locations"><Upload className="h-3 w-3 mr-0.5" /> Import</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
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
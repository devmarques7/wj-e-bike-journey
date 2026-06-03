import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  History,
  Download,
  Search,
  Filter,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Layers,
  RotateCcw,
  CalendarRange,
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useMovementHistory, type MovementHistoryRow } from "@/hooks/inventory/useMovementHistory";
import { useLocations } from "@/hooks/inventory/useCatalogCrud";
import MovementDetailDrawer from "@/components/dashboard/inventory/MovementDetailDrawer";
import { downloadCSV } from "@/lib/csv";

const MOVEMENT_TYPES = [
  "sale",
  "return",
  "adjustment",
  "transfer",
  "incoming",
  "reservation",
  "reservation_release",
] as const;

const QUICK_RANGES: { key: string; label: string; days: number | null }[] = [
  { key: "today", label: "Today", days: 0 },
  { key: "7d", label: "7D", days: 7 },
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "12m", label: "12M", days: 365 },
  { key: "all", label: "All", days: null },
];

const typeColor = (t: string) => {
  switch (t) {
    case "incoming":
    case "return":
      return "bg-wj-green/15 text-wj-green border-wj-green/30";
    case "sale":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "transfer":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "adjustment":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "reservation":
    case "reservation_release":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    default:
      return "bg-muted/30 text-muted-foreground border-border/40";
  }
};

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const actorLabel = (r: MovementHistoryRow) =>
  r.actor?.full_name?.trim() ||
  r.actor?.email ||
  (r.created_by ? `#${r.created_by.slice(0, 6)}` : "System");

export default function AdminInventoryHistory() {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { data: locations } = useLocations();

  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState<string>("all");
  const [locationId, setLocationId] = useState<string>("all");
  const [actorId, setActorId] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [quickRange, setQuickRange] = useState<string>("all");
  const [selected, setSelected] = useState<MovementHistoryRow | null>(null);

  const { rows, loading, summary, refetch } = useMovementHistory({
    search,
    movementType,
    locationId,
    actorId,
    from: from || null,
    to: to || null,
    limit: 1000,
  });

  // Build distinct actors from the result set for the filter dropdown
  const actors = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) {
      if (!r.created_by) continue;
      m.set(r.created_by, actorLabel(r));
    }
    return Array.from(m.entries()).map(([id, label]) => ({ id, label }));
  }, [rows]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("inventory.view")) return <Navigate to="/dashboard" replace />;

  const resetFilters = () => {
    setSearch("");
    setMovementType("all");
    setLocationId("all");
    setActorId("all");
    setFrom("");
    setTo("");
    setQuickRange("all");
  };

  const applyQuickRange = (key: string) => {
    setQuickRange(key);
    const cfg = QUICK_RANGES.find((r) => r.key === key);
    if (!cfg || cfg.days === null) {
      setFrom("");
      setTo("");
      return;
    }
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - cfg.days);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    setFrom(iso(start));
    setTo(iso(today));
  };

  const exportCSV = () =>
    downloadCSV(
      `inventory-history-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((r) => ({
        when: r.created_at,
        type: r.movement_type,
        delta: r.qty_delta,
        product: r.variant?.product?.name ?? "",
        variant: r.variant?.name ?? "",
        sku: r.variant?.sku ?? "",
        location: r.location?.name ?? "",
        actor: actorLabel(r),
        actor_email: r.actor?.email ?? "",
        reference_type: r.reference_type ?? "",
        reference_id: r.reference_id ?? "",
        notes: r.notes ?? "",
      }))
    );

  const kpis = [
    { label: "Movements", value: summary.total, icon: Layers, color: "text-foreground" },
    { label: "Units In", value: summary.inQty, icon: ArrowDownToLine, color: "text-wj-green" },
    { label: "Units Out", value: summary.outQty, icon: ArrowUpFromLine, color: "text-red-400" },
    { label: "Actors", value: summary.actors, icon: Users, color: "text-foreground" },
  ];

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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-wj-green/10 border border-wj-green/20 flex items-center justify-center">
              <History className="h-5 w-5 text-wj-green" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-light text-foreground">Inventory History</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Every stock movement — who, where, when and how
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={refetch}>
              <RotateCcw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            {can("inventory.export") && (
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            )}
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center">
                <k.icon className={cn("h-4 w-4", k.color)} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <div className={cn("text-2xl font-light leading-tight tabular-nums", k.color)}>
                  {k.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
            {/* Quick date range chips */}
            <div className="flex items-center gap-1 flex-wrap">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              {QUICK_RANGES.map((r) => {
                const active = quickRange === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => applyQuickRange(r.key)}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors",
                      active
                        ? "bg-wj-green/15 border-wj-green/40 text-wj-green"
                        : "bg-background/40 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search SKU, product, notes, user…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background/60 pl-9"
              />
            </div>
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger className="bg-background/60 lg:col-span-2">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="bg-background/60 lg:col-span-2">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {(locations as any[]).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actorId} onValueChange={setActorId}>
              <SelectTrigger className="bg-background/60 lg:col-span-2">
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actors</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
              <DatePicker
                value={from}
                onChange={(v) => {
                  setFrom(v);
                  setQuickRange("custom");
                }}
                placeholder="De"
                className="bg-background/60 min-w-0 flex-1"
              />
              <DatePicker
                value={to}
                onChange={(v) => {
                  setTo(v);
                  setQuickRange("custom");
                }}
                placeholder="Até"
                className="bg-background/60 min-w-0 flex-1"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={resetFilters} className="text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">When</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Product</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden md:table-cell">SKU</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden md:table-cell">Where</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Who</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Δ Qty</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">Reference</TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden xl:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-10">
                      Loading history…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-10">
                      No movements match the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="border-border/30 hover:bg-muted/30 cursor-pointer"
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmtWhen(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] capitalize", typeColor(r.movement_type))}
                      >
                        {r.movement_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">
                        {r.variant?.product?.name ?? "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.variant?.name ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {r.variant?.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {r.location?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="text-foreground/90">{actorLabel(r)}</div>
                      {r.actor?.email && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                          {r.actor.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs text-right font-medium tabular-nums",
                        r.qty_delta > 0 ? "text-wj-green" : r.qty_delta < 0 ? "text-red-400" : "text-muted-foreground"
                      )}
                    >
                      {r.qty_delta > 0 ? `+${r.qty_delta}` : r.qty_delta}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                      {r.reference_type ? (
                        <span className="capitalize">
                          {r.reference_type}
                          {r.reference_id ? ` · #${r.reference_id.slice(0, 6)}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden xl:table-cell max-w-[260px] truncate">
                      {r.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 0 && (
            <div className="px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground flex justify-between">
              <span>{rows.length} movement(s)</span>
              <span>Click a row for full detail</span>
            </div>
          )}
        </div>
      </div>

      <MovementDetailDrawer movement={selected as any} onClose={() => setSelected(null)} />
    </AdminDashboardLayout>
  );
}
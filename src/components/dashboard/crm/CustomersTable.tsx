import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown, Download, Search, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadCSV } from "@/lib/csv";
import { type CrmCustomer, type LifecycleStage, deleteCustomerProfile } from "@/hooks/crm/useCrmData";
import { LIFECYCLE_META, healthColor, initials, relativeTime } from "./colors";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import CustomerEditDialog from "./CustomerEditDialog";

interface Props {
  rows: CrmCustomer[];
  loading?: boolean;
  onMutate?: () => void;
}

export default function CustomersTable({ rows, loading, onMutate }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canEdit = can("crm.edit");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [healthMin, setHealthMin] = useState(0);
  const [rowSelection, setRowSelection] = useState({});
  const [editing, setEditing] = useState<CrmCustomer | null>(null);

  const HeaderHint = ({ label, hintKey, sortable, column }: { label: string; hintKey: string; sortable?: boolean; column?: any }) => (
    <div className="flex items-center gap-1">
      {sortable ? (
        <button className="flex items-center gap-1" onClick={() => column?.toggleSorting()}>
          {label} <ArrowUpDown className="h-3 w-3" />
        </button>
      ) : (
        <span>{label}</span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground/60 hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" sideOffset={8} className="max-w-[220px] text-[11px] leading-snug">
          {t(`crm.table.column_hints.${hintKey}`)}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const handleDelete = async (c: CrmCustomer) => {
    if (!confirm(t("crm.table.confirm_delete", { name: c.full_name }))) return;
    try {
      await deleteCustomerProfile(c.id);
      toast.success(t("crm.table.deleted"));
      onMutate?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [rows]);

  const allPlans = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.plan_name && set.add(r.plan_name));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (planFilter !== "all" && r.plan_name !== planFilter) return false;
      if (stageFilter !== "all" && r.lifecycle_stage !== stageFilter) return false;
      if (tagFilter !== "all" && !r.tags?.includes(tagFilter)) return false;
      if (r.health_score < healthMin) return false;
      return true;
    });
  }, [rows, search, planFilter, stageFilter, tagFilter, healthMin]);

  const columns = useMemo<ColumnDef<CrmCustomer>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <HeaderHint label={t("crm.table.columns.customer")} hintKey="customer" sortable column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-wj-green/10 text-wj-green text-[10px]">
                {initials(row.original.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.original.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "plan_name",
        header: () => <HeaderHint label={t("crm.table.columns.plan")} hintKey="plan" />,
        cell: ({ row }) =>
          row.original.plan_name ? (
            <Badge variant="outline" className="text-[10px]">{row.original.plan_name}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "lifecycle_stage",
        header: () => <HeaderHint label={t("crm.table.columns.stage")} hintKey="stage" />,
        cell: ({ row }) => {
          const meta = LIFECYCLE_META[row.original.lifecycle_stage];
          return (
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: meta.color, color: meta.color }}
            >
              {t(`crm.lifecycle.${row.original.lifecycle_stage}`)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "health_score",
        header: ({ column }) => (
          <HeaderHint label={t("crm.table.columns.health")} hintKey="health" sortable column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-[90px]">
            <Progress
              value={row.original.health_score}
              className="h-1.5 w-16"
              style={{ ["--progress-color" as any]: healthColor(row.original.health_score) }}
            />
            <span className="font-mono text-xs" style={{ color: healthColor(row.original.health_score) }}>
              {row.original.health_score}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "churn_risk_score",
        header: ({ column }) => (
          <HeaderHint label={t("crm.table.columns.risk")} hintKey="risk" sortable column={column} />
        ),
        cell: ({ row }) => {
          const v = row.original.churn_risk_score;
          const color = v >= 70 ? "#f87171" : v >= 40 ? "#fb923c" : "#94a3b8";
          return (
            <div className="flex items-center gap-2 min-w-[90px]">
              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
              </div>
              <span className="font-mono text-xs" style={{ color }}>{v}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "ltv_estimated",
        header: ({ column }) => (
          <HeaderHint label={t("crm.table.columns.ltv")} hintKey="ltv" sortable column={column} />
        ),
        cell: ({ row }) => <span className="font-mono text-xs">€{Number(row.original.ltv_estimated).toFixed(0)}</span>,
      },
      {
        accessorKey: "last_contact_at",
        header: () => <HeaderHint label={t("crm.table.columns.last_contact")} hintKey="last_contact" />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{relativeTime(row.original.last_contact_at)}</span>,
      },
      {
        accessorKey: "tags",
        header: () => <HeaderHint label={t("crm.table.columns.tags")} hintKey="tags" />,
        cell: ({ row }) => {
          const tags = row.original.tags ?? [];
          const visible = tags.slice(0, 3);
          const extra = tags.length - visible.length;
          return (
            <div className="flex flex-wrap gap-1">
              {visible.map((t) => (
                <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
              ))}
              {extra > 0 && <Badge variant="outline" className="text-[9px]">+{extra}</Badge>}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => navigate(`/dashboard/admin/crm/${row.original.id}`)}>
                {t("crm.actions.view_profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/dashboard/admin/crm/${row.original.id}?action=contact`)}>
                {t("crm.actions.log_contact")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/dashboard/admin/crm/${row.original.id}?action=note`)}>
                {t("crm.actions.add_note")}
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setEditing(row.original)}>
                    {t("crm.actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(row.original)}
                    className="text-red-400 focus:text-red-400"
                  >
                    {t("crm.actions.delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
      },
    ],
    [navigate, canEdit, t],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  const exportCsv = () => {
    const data = filtered.map((r) => ({
      name: r.full_name,
      email: r.email,
      phone: r.phone,
      plan: r.plan_name,
      stage: r.lifecycle_stage,
      health: r.health_score,
      churn_risk: r.churn_risk_score,
      ltv: r.ltv_estimated,
      tags: r.tags?.join("|") ?? "",
    }));
    downloadCSV(`crm-customers-${new Date().toISOString().slice(0, 10)}.csv`, data);
  };

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("crm.table.search")}
            className="pl-7 h-9 bg-background/60"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("crm.table.all_plans")}</SelectItem>
            {allPlans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("crm.table.all_stages")}</SelectItem>
            {Object.keys(LIFECYCLE_META).map((k) => (
              <SelectItem key={k} value={k}>{t(`crm.lifecycle.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("crm.table.all_tags")}</SelectItem>
              {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-background/60">
          <span className="text-xs text-muted-foreground">{t("crm.table.health_min")}</span>
          <Slider value={[healthMin]} onValueChange={(v) => setHealthMin(v[0])} max={100} step={5} className="w-24" />
          <span className="text-xs font-mono w-6">{healthMin}</span>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="ml-auto">
          <Download className="h-3.5 w-3.5 mr-2" /> CSV
        </Button>
      </div>

      {/* Bulk bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-wj-green/10 border border-wj-green/30">
          <span className="text-sm font-medium">{t("crm.table.selected", { n: selectedCount })}</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline">{t("crm.actions.send_campaign")}</Button>
            <Button size="sm" variant="outline">{t("crm.actions.add_tag")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>{t("crm.actions.clear")}</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/30 bg-background/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-xs text-muted-foreground py-8">
                  {t("crm.table.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-xs text-muted-foreground py-8">
                  {t("crm.table.empty")}
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => navigate(`/dashboard/admin/crm/${row.original.id}`)}
                className={cn(
                  "cursor-pointer hover:bg-muted/30",
                  row.original.churn_risk_score >= 70 && "border-l-2 border-l-red-500",
                  row.original.health_score < 30 && "bg-red-500/[0.03]",
                )}
              >
                {row.getVisibleCells().map((c) => (
                  <TableCell key={c.id} className="py-3">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t("crm.table.count", { n: filtered.length })} · {t("crm.table.page_of", { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount() || 1 })}
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-7 px-2">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-7 px-2">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <CustomerEditDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        customer={editing}
        onSaved={onMutate}
      />
    </div>
    </TooltipProvider>
  );
}
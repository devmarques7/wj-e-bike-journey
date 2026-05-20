import { useState } from "react";
import { Navigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useLocations, upsertLocation, deleteLocation, type Location } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import FieldLabel from "@/components/dashboard/inventory/FieldLabel";
import ImportLocationsDialog from "@/components/dashboard/inventory/ImportLocationsDialog";

const TYPES = ["warehouse", "store_floor", "virtual"];

export default function AdminInventoryLocations() {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { data, loading, refetch } = useLocations();
  const [editing, setEditing] = useState<Location | "new" | null>(null);
  const [form, setForm] = useState<Partial<Location>>({});
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("location.manage")) return <Navigate to="/dashboard" replace />;

  const open = (l: Location | "new") => {
    setEditing(l);
    setForm(l === "new" ? { name: "", location_type: "warehouse", is_active: true } : l);
  };

  const save = async () => {
    if (!form.name) return toast({ title: "Name required", variant: "destructive" });
    setBusy(true);
    try {
      await upsertLocation({ ...(form as any) });
      toast({ title: "Saved" });
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (l: Location) => {
    if (!confirm(`Delete ${l.name}?`)) return;
    try {
      await deleteLocation(l.id);
      toast({ title: "Deleted" });
      refetch();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-light">Locations</h1>
            <p className="text-sm text-muted-foreground">Warehouses, store floor, virtual</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
            <Button onClick={() => open("new")} className="bg-wj-green hover:bg-wj-green/90">
              <Plus className="h-4 w-4 mr-2" /> New location
            </Button>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl divide-y divide-border/20">
          {loading && <div className="p-6 text-center text-xs text-muted-foreground">Loading...</div>}
          {!loading && data.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" /> No locations yet.
            </div>
          )}
          {data.map((l) => (
            <div key={l.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{l.name}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{l.location_type.replace("_", " ")}</Badge>
                  {!l.is_active && <Badge className="text-[10px] bg-red-500/20 text-red-400">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{l.address ?? "—"}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => open(l)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => remove(l)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="font-light">{editing === "new" ? "New location" : "Edit location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <FieldLabel label="Name" required hint="Internal name for this stock location (e.g. 'Amsterdam Warehouse', 'Rotterdam Store Floor')." />
              <Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-background/60" />
            </div>
            <div>
              <FieldLabel label="Type" required hint="Warehouse = backstock, Store floor = customer-facing display, Virtual = digital or drop-shipped stock not physically held." />
              <Select value={form.location_type} onValueChange={(v) => setForm((f) => ({ ...f, location_type: v as any }))}>
                <SelectTrigger className="bg-background/60"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel label="Address" hint="Optional physical address. Used by the workshop for routing, transfers and pickup instructions." />
              <Input value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="bg-background/60" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <FieldLabel label="Active" hint="When inactive, this location stops appearing in stock adjustment, receive and transfer dialogs." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-wj-green hover:bg-wj-green/90">
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImportLocationsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refetch}
      />
    </AdminDashboardLayout>
  );
}
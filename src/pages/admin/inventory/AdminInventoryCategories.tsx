import { useState } from "react";
import { Navigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderTree, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useCategories, upsertCategory, deleteCategory, type Category } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import FieldLabel from "@/components/dashboard/inventory/FieldLabel";
import ImportCategoriesDialog from "@/components/dashboard/inventory/ImportCategoriesDialog";
import ExportDataButton from "@/components/dashboard/inventory/ExportDataButton";
import InventoryBackHeader from "@/components/dashboard/inventory/InventoryBackHeader";

const TYPES = ["bike", "accessory", "service", "part", "insurance"];
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminInventoryCategories() {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { data, loading, refetch } = useCategories();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [form, setForm] = useState<Partial<Category>>({});
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("category.manage")) return <Navigate to="/dashboard" replace />;

  const open = (c: Category | "new") => {
    setEditing(c);
    setForm(c === "new" ? { name: "", slug: "", type: "accessory", is_active: true, display_order: 0 } : c);
  };

  const save = async () => {
    if (!form.name) return toast({ title: "Name required", variant: "destructive" });
    setBusy(true);
    try {
      await upsertCategory({ ...(form as any), slug: form.slug || slugify(form.name!) });
      toast({ title: "Saved" });
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await deleteCategory(c.id);
      toast({ title: "Deleted" });
      refetch();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <InventoryBackHeader current="Categories" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-light">Categories</h1>
            <p className="text-sm text-muted-foreground">Catalog hierarchy</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
            <ExportDataButton table="categories" filename="categories" />
            <Button onClick={() => open("new")} className="bg-wj-green hover:bg-wj-green/90">
              <Plus className="h-4 w-4 mr-2" /> New category
            </Button>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl divide-y divide-border/20">
          {loading && <div className="p-6 text-center text-xs text-muted-foreground">Loading...</div>}
          {!loading && data.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-40" /> No categories yet.
            </div>
          )}
          {data.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{c.name}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{c.type}</Badge>
                  {!c.is_active && <Badge className="text-[10px] bg-red-500/20 text-red-400">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">/{c.slug} · order {c.display_order}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => open(c)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="font-light">{editing === "new" ? "New category" : "Edit category"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FieldLabel label="Name" required hint="Display name of the category as shown in the navigation and on the storefront (e.g. 'Helmets', 'Urban Bikes')." />
              <Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-background/60" />
            </div>
            <div>
              <FieldLabel label="Slug" hint="URL identifier (e.g. /categories/helmets). Lowercase, numbers and dashes only. Leave empty to auto-generate from the name." />
              <Input value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="bg-background/60" placeholder="auto" />
            </div>
            <div>
              <FieldLabel label="Type" required hint="High-level group this category belongs to. Used to scope filters in the storefront and admin reports." />
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                <SelectTrigger className="bg-background/60"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel label="Parent" hint="Optional parent category to build a hierarchy (e.g. 'Helmets' under 'Safety'). Leave as None for a top-level category." />
              <Select value={form.parent_id ?? "none"} onValueChange={(v) => setForm((f) => ({ ...f, parent_id: v === "none" ? null : v }))}>
                <SelectTrigger className="bg-background/60"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {data.filter((c) => c.id !== (editing as Category)?.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel label="Display order" hint="Lower numbers appear first in menus and lists. Use multiples of 10 (10, 20, 30) to leave room for reordering later." />
              <Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} className="bg-background/60" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <FieldLabel label="Active" hint="Inactive categories are hidden from the storefront menus but kept for historical data." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-wj-green hover:bg-wj-green/90">
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImportCategoriesDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refetch}
      />
    </AdminDashboardLayout>
  );
}
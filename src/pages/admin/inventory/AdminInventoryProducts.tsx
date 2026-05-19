import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useProducts, deleteProduct } from "@/hooks/inventory/useCatalogCrud";
import { toast } from "@/hooks/use-toast";
import ProductEditDialog from "@/components/dashboard/inventory/ProductEditDialog";
import type { Product } from "@/hooks/inventory/useCatalogCrud";

export default function AdminInventoryProducts() {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { data, loading, refetch } = useProducts();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q));
  }, [data, search]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("product.view")) return <Navigate to="/dashboard" replace />;

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}? This removes variants & inventory rows.`)) return;
    try {
      await deleteProduct(p.id);
      toast({ title: "Product deleted" });
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
            <h1 className="text-xl sm:text-2xl font-light">Products</h1>
            <p className="text-sm text-muted-foreground">Catalog management</p>
          </div>
          {can("product.create") && (
            <Button onClick={() => setEditing("new")} className="bg-wj-green hover:bg-wj-green/90">
              <Plus className="h-4 w-4 mr-2" /> New product
            </Button>
          )}
        </div>

        <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex gap-3">
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-background/60 max-w-xs" />
          </div>
          <div className="divide-y divide-border/20">
            {loading && <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>}
            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No products yet.
              </div>
            )}
            {filtered.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/dashboard/admin/inventory/products/${p.id}`} className="text-sm font-medium hover:text-wj-green">
                      {p.name}
                    </Link>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.product_type}</Badge>
                    {!p.is_active && <Badge className="text-[10px] bg-red-500/20 text-red-400">Inactive</Badge>}
                    {p.is_featured && <Badge className="text-[10px] bg-wj-green/20 text-wj-green">Featured</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">€{p.base_price} · /{p.slug}</p>
                </div>
                <div className="flex gap-1">
                  {can("product.update") && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {can("product.delete") && (
                    <Button size="sm" variant="ghost" onClick={() => remove(p)} className="text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ProductEditDialog
        product={editing === "new" ? null : editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />
    </AdminDashboardLayout>
  );
}
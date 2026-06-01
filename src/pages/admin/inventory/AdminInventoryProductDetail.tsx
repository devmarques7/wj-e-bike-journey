import { useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useProduct, deleteVariant, type Variant } from "@/hooks/inventory/useCatalogCrud";
import ProductEditDialog from "@/components/dashboard/inventory/ProductEditDialog";
import VariantEditDialog from "@/components/dashboard/inventory/VariantEditDialog";
import { toast } from "@/hooks/use-toast";

export default function AdminInventoryProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { product, variants, loading, refetch } = useProduct(id);
  const [editProduct, setEditProduct] = useState(false);
  const [editVariant, setEditVariant] = useState<Variant | "new" | null>(null);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!can("product.view")) return <Navigate to="/dashboard" replace />;

  const removeVariant = async (v: Variant) => {
    if (!confirm(`Delete variant ${v.sku}?`)) return;
    try {
      await deleteVariant(v.id);
      toast({ title: "Variant deleted" });
      refetch();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">

        {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {!loading && !product && <p className="text-xs text-muted-foreground">Product not found.</p>}

        {product && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-light">{product.name}</h1>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{product.product_type}</Badge>
                  <Badge variant="outline" className="text-[10px]">€{product.base_price}</Badge>
                  {!product.is_active && <Badge className="text-[10px] bg-red-500/20 text-red-400">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{product.short_description ?? "—"}</p>
              </div>
              {can("product.update") && (
                <Button onClick={() => setEditProduct(true)} variant="outline">
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
              )}
            </div>

            <div className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <h2 className="text-sm font-medium">Variants ({variants.length})</h2>
                {can("variant.create") && (
                  <Button size="sm" onClick={() => setEditVariant("new")} className="bg-wj-green hover:bg-wj-green/90">
                    <Plus className="h-4 w-4 mr-1" /> Add variant
                  </Button>
                )}
              </div>
              <div className="divide-y divide-border/20">
                {variants.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">No variants yet.</div>
                )}
                {variants.map((v) => (
                  <div key={v.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{v.name}</p>
                        {v.is_default && <Badge className="text-[10px] bg-wj-green/20 text-wj-green">Default</Badge>}
                        {!v.is_active && <Badge className="text-[10px] bg-red-500/20 text-red-400">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">SKU {v.sku} · {v.price_override ? `€${v.price_override}` : `€${product.base_price}`}</p>
                    </div>
                    <div className="flex gap-1">
                      {can("variant.update") && (
                        <Button size="sm" variant="ghost" onClick={() => setEditVariant(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {can("variant.delete") && (
                        <Button size="sm" variant="ghost" onClick={() => removeVariant(v)} className="text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {product && (
        <ProductEditDialog
          product={product}
          open={editProduct}
          onClose={() => setEditProduct(false)}
          onSaved={refetch}
        />
      )}
      {product && (
        <VariantEditDialog
          productId={product.id}
          productType={product.product_type}
          variant={editVariant === "new" ? null : editVariant}
          open={!!editVariant}
          onClose={() => setEditVariant(null)}
          onSaved={refetch}
        />
      )}
    </AdminDashboardLayout>
  );
}
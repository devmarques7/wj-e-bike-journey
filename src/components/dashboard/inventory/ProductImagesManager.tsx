import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import FieldLabel from "./FieldLabel";

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  is_primary: boolean;
  display_order: number;
}

interface Props {
  productId: string;
}

const BUCKET = "product-images";

export default function ProductImagesManager({ productId }: Props) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refetch = async () => {
    const { data } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("display_order");
    setImages((data as ProductImage[]) ?? []);
  };

  useEffect(() => {
    if (productId) refetch();
  }, [productId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const isFirst = images.length === 0;
        const { error: insErr } = await supabase.from("product_images").insert({
          product_id: productId,
          url: pub.publicUrl,
          alt: file.name,
          is_primary: isFirst,
          display_order: images.length,
        });
        if (insErr) throw insErr;
      }
      toast({ title: "Images uploaded" });
      refetch();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (img: ProductImage) => {
    if (!confirm("Delete this image?")) return;
    try {
      // try strip path from public URL
      const marker = `/${BUCKET}/`;
      const idx = img.url.indexOf(marker);
      if (idx > -1) {
        const path = img.url.slice(idx + marker.length);
        await supabase.storage.from(BUCKET).remove([path]);
      }
      await supabase.from("product_images").delete().eq("id", img.id);
      refetch();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const setPrimary = async (img: ProductImage) => {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", img.id);
    refetch();
  };

  return (
    <div className="col-span-2 space-y-2">
      <FieldLabel
        label="Product photos"
        hint="Upload one or more images for this product. The first image marked with a star becomes the primary photo used in listings, PDP and cart previews. Recommended ratio 1:1 or 4:3, max 5MB each."
      />
      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border/30 aspect-square bg-muted/20">
            <img src={img.url} alt={img.alt ?? ""} className="w-full h-full object-cover" />
            {img.is_primary && (
              <span className="absolute top-1 left-1 bg-wj-green text-white text-[9px] px-1.5 py-0.5 rounded">PRIMARY</span>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {!img.is_primary && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-white" onClick={() => setPrimary(img)}>
                  <Star className="h-3 w-3" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => remove(img)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-lg border border-dashed border-border/40 hover:border-wj-green hover:bg-wj-green/5 flex flex-col items-center justify-center text-muted-foreground text-[10px] gap-1 transition-colors"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
    </div>
  );
}
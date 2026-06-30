import { useState, useEffect } from "react";
import { Search, Check, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type LinkedBike = {
  id: string;
  model: string | null;
  serial: string | null;
  color: string | null;
};

type BikeProduct = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  color_hex: string | null;
};

interface BikePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered?: (bike: LinkedBike) => void;
}

export default function BikePickerDialog({
  open,
  onOpenChange,
  onRegistered,
}: BikePickerDialogProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [bikeProducts, setBikeProducts] = useState<BikeProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"search" | "serial">("search");
  const [selectedProduct, setSelectedProduct] = useState<BikeProduct | null>(null);
  const [serial, setSerial] = useState("");
  const [serialError, setSerialError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRealUser = !!user && !user.isDemo && user.role === "customer";

  useEffect(() => {
    if (!open || bikeProducts.length > 0) return;
    setLoadingProducts(true);
    supabase
      .from("products")
      .select("id, name, slug, base_price, color_hex")
      .eq("product_type", "bike")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          toast.error(t("bike_showcase.picker.load_error", { defaultValue: "Could not load bikes" }));
        } else {
          setBikeProducts(data ?? []);
        }
        setLoadingProducts(false);
      });
  }, [open, bikeProducts.length, t]);

  useEffect(() => {
    if (!open) {
      setStep("search");
      setSelectedProduct(null);
      setSerial("");
      setSerialError(null);
      setSearch("");
    }
  }, [open]);

  const handlePickProduct = (product: BikeProduct) => {
    setSelectedProduct(product);
    setSerial("");
    setSerialError(null);
    setStep("serial");
  };

  const handleConfirmRegister = async () => {
    if (!user || !selectedProduct) return;
    const trimmed = serial.trim().toUpperCase();
    if (trimmed.length < 4) {
      setSerialError(t("bike_showcase.picker.serial_short", { defaultValue: "Enter the full serial number printed on your bike frame." }));
      return;
    }
    setSerialError(null);
    setSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from("customer_bikes")
        .select("id")
        .eq("serial", trimmed)
        .maybeSingle();
      if (existing) {
        setSerialError(t("bike_showcase.picker.serial_exists", { defaultValue: "This serial number is already registered. Contact support if you believe this is an error." }));
        return;
      }
      let { data: cp } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cp?.id) {
        const { data: created, error: cpErr } = await supabase
          .from("customer_profiles")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (cpErr) throw cpErr;
        cp = created;
      }
      const { data: bike, error } = await supabase
        .from("customer_bikes")
        .insert({
          customer_id: cp!.id,
          model: selectedProduct.name,
          color: selectedProduct.color_hex,
          serial: trimmed,
          is_active: true,
        })
        .select("id, model, serial, color")
        .single();
      if (error) throw error;
      onRegistered?.(bike as LinkedBike);
      onOpenChange(false);
      toast.success(t("bike_showcase.picker.registered", { name: selectedProduct.name, defaultValue: `{{name}} registered to your account` }));
    } catch (e: any) {
      const msg = e?.message || t("bike_showcase.picker.error", { defaultValue: "Failed to register bike" });
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
        setSerialError(t("bike_showcase.picker.serial_exists", { defaultValue: "This serial number is already registered." }));
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = bikeProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "search"
              ? t("bike_showcase.picker.title_search", { defaultValue: "Select your bike" })
              : t("bike_showcase.picker.title_serial", { defaultValue: "Confirm your serial" })}
          </DialogTitle>
          <DialogDescription>
            {step === "search"
              ? t("bike_showcase.picker.desc_search", { defaultValue: "Search and pick the WJ model you own. You can register more than one." })
              : t("bike_showcase.picker.desc_serial", { defaultValue: "Each bike has a unique serial number printed on its frame. Enter it to link this exact bike to your account." })}
          </DialogDescription>
        </DialogHeader>
        {step === "search" ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("bike_showcase.picker.search_placeholder", { defaultValue: "Search models…" })}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  {t("bike_showcase.picker.no_bikes", { defaultValue: "No bikes found." })}
                </p>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePickProduct(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-wj-green/60 hover:bg-wj-green/5 transition-colors text-left"
                  >
                    <span
                      className="w-9 h-9 rounded-full border border-border/60 shrink-0"
                      style={{ background: p.color_hex || "hsl(var(--muted))" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        € {Number(p.base_price).toLocaleString("en-NL", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <Check className="h-4 w-4 text-muted-foreground/40" />
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-wj-green/40 bg-wj-green/5">
              <span
                className="w-10 h-10 rounded-full border border-border/60 shrink-0"
                style={{ background: selectedProduct?.color_hex || "hsl(var(--muted))" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedProduct?.name}</p>
                <p className="text-[11px] text-muted-foreground">{t("bike_showcase.picker.selected_model", { defaultValue: "Selected model" })}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                {t("bike_showcase.picker.serial_label", { defaultValue: "Serial number" })}
              </label>
              <Input
                value={serial}
                onChange={(e) => {
                  setSerial(e.target.value);
                  if (serialError) setSerialError(null);
                }}
                placeholder={t("bike_showcase.picker.serial_placeholder", { defaultValue: "e.g. WJ-V8-2024-NL-00156" })}
                className="font-mono uppercase tracking-wider"
                autoFocus
                disabled={submitting}
              />
              {serialError ? (
                <p className="text-xs text-destructive">{serialError}</p>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-wj-green" />
                  {t("bike_showcase.picker.serial_hint", { defaultValue: "Find this number engraved on the frame or printed under the saddle." })}
                </p>
              )}
            </div>
            <div className="mt-auto flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("search")}
                disabled={submitting}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back", { defaultValue: "Back" })}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRegister}
                disabled={submitting || serial.trim().length < 4}
                className="flex-1 bg-wj-green hover:bg-wj-green/90"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("bike_showcase.picker.register_btn", { defaultValue: "Register this bike" })
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

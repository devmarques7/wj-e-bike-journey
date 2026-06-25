import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { Bike, Plus, Check, Loader2, Search, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import bikeFull from "@/assets/bike-full.png";
import bikePanel from "@/assets/bike-panel.png";
import bikeHeadlight from "@/assets/bike-headlight.png";
import bikeWheel from "@/assets/bike-wheel.png";
import bikeChain from "@/assets/bike-chain.png";
import bikeBrakes from "@/assets/bike-brakes.png";

const bikeFeatures = [
  {
    image: bikeFull,
    title: "WJ V8 Prestige",
    feature: "Sua Bike",
    description: "Adquirida em 15 Jan 2024",
    stats: [
      { label: "Km Total", value: "1,247" },
      { label: "Bateria", value: "92%" },
    ],
  },
  {
    image: bikePanel,
    title: "Smart Display",
    feature: "Painel Digital",
    description: "LCD de alta resolução com conectividade",
    stats: [
      { label: "Velocidade Máx", value: "45 km/h" },
      { label: "Autonomia", value: "80 km" },
    ],
  },
  {
    image: bikeHeadlight,
    title: "LED Premium",
    feature: "Faróis Inteligentes",
    description: "Iluminação automática com sensor de luz ambiente",
    stats: [
      { label: "Potência", value: "1200 lm" },
      { label: "Alcance", value: "50m" },
    ],
  },
  {
    image: bikeWheel,
    title: "Kenda Fat Tire",
    feature: "Rodas All-Terrain",
    description: "Pneus 20x4.0 para máxima aderência",
    stats: [
      { label: "Aro", value: "20\"" },
      { label: "Pressão", value: "15 PSI" },
    ],
  },
  {
    image: bikeChain,
    title: "Shimano 7-Speed",
    feature: "Transmissão",
    description: "Sistema de marchas de alta performance",
    stats: [
      { label: "Marchas", value: "7" },
      { label: "Última Manutenção", value: "12 dias" },
    ],
  },
  {
    image: bikeBrakes,
    title: "Disco Hidráulico",
    feature: "Sistema de Freios",
    description: "Freios a disco 180mm com pastilhas cerâmicas",
    stats: [
      { label: "Disco", value: "180mm" },
      { label: "Condição", value: "Ótima" },
    ],
  },
];

// Preload images
const preloadImages = () => {
  bikeFeatures.forEach((feature) => {
    const img = new Image();
    img.src = feature.image;
  });
};

export default function BikeShowcase() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [registeredBike, setRegisteredBike] = useState<{ id: string; model: string; serial: string | null; color: string | null } | null>(null);
  const [loadingBike, setLoadingBike] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bikeProducts, setBikeProducts] = useState<Array<{ id: string; name: string; slug: string; base_price: number; color_hex: string | null }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [step, setStep] = useState<"search" | "serial">("search");
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; color_hex: string | null } | null>(null);
  const [serial, setSerial] = useState("");
  const [serialError, setSerialError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRealUser = !!user && !user.isDemo && user.role === "customer";

  // Load registered bike for real authenticated customers
  useEffect(() => {
    let cancelled = false;
    async function loadBike() {
      if (!isRealUser) {
        // Demo users fall back to mock user.bikeId behavior
        setLoadingBike(false);
        return;
      }
      setLoadingBike(true);
      const { data: cp } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!cp?.id) {
        if (!cancelled) {
          setRegisteredBike(null);
          setLoadingBike(false);
        }
        return;
      }
      const { data: bike } = await supabase
        .from("customer_bikes")
        .select("id, model, serial, color")
        .eq("customer_id", cp.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setRegisteredBike(bike ?? null);
        setLoadingBike(false);
      }
    }
    loadBike();
    return () => { cancelled = true; };
  }, [isRealUser, user?.id]);

  // Lazy-load bike products when picker opens
  useEffect(() => {
    if (!pickerOpen || bikeProducts.length > 0) return;
    setLoadingProducts(true);
    supabase
      .from("products")
      .select("id, name, slug, base_price, color_hex")
      .eq("product_type", "bike")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load bikes");
        } else {
          setBikeProducts(data ?? []);
        }
        setLoadingProducts(false);
      });
  }, [pickerOpen, bikeProducts.length]);

  // Reset wizard whenever the dialog is closed
  useEffect(() => {
    if (!pickerOpen) {
      setStep("search");
      setSelectedProduct(null);
      setSerial("");
      setSerialError(null);
      setSearch("");
    }
  }, [pickerOpen]);

  const handlePickProduct = (product: { id: string; name: string; color_hex: string | null }) => {
    setSelectedProduct(product);
    setSerial("");
    setSerialError(null);
    setStep("serial");
  };

  const handleConfirmRegister = async () => {
    if (!user || !selectedProduct) return;
    const trimmed = serial.trim().toUpperCase();
    if (trimmed.length < 4) {
      setSerialError("Enter the full serial number printed on your bike frame.");
      return;
    }
    setSerialError(null);
    setSubmitting(true);
    setRegisteringId(selectedProduct.id);
    try {
      // Reject if this serial is already registered to any account
      const { data: existing, error: existingErr } = await supabase
        .from("customer_bikes")
        .select("id")
        .eq("serial", trimmed)
        .maybeSingle();
      if (existingErr && existingErr.code !== "PGRST116") throw existingErr;
      if (existing) {
        setSerialError("This serial number is already registered. Contact support if you believe this is an error.");
        return;
      }
      // Ensure customer_profile exists
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
      // Enforce one active bike per user: deactivate any existing active bikes first
      await supabase
        .from("customer_bikes")
        .update({ is_active: false })
        .eq("customer_id", cp!.id)
        .eq("is_active", true);

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
      setRegisteredBike(bike);
      setPickerOpen(false);
      toast.success(`${selectedProduct.name} registered to your account`);
    } catch (e: any) {
      const msg = e?.message || "Failed to register bike";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
        setSerialError("This serial number is already registered.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
      setRegisteringId(null);
    }
  };

  // A bike is considered present if (a) a real customer has a customer_bikes row,
  // or (b) a demo/mock user has bikeId set on their profile.
  const hasBike = isRealUser ? !!registeredBike : !!user?.bikeId;

  const filteredProducts = bikeProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });

  // Preload all images on mount
  useEffect(() => {
    preloadImages();
    
    // Mark as loaded after a short delay to ensure images are cached
    const timer = setTimeout(() => {
      setImagesLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Sync embla index with state
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on("select", onSelect);
    onSelect();
    
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-advance carousel every 8 seconds
  useEffect(() => {
    if (!emblaApi || !imagesLoaded) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [emblaApi, imagesLoaded]);

  // Navigate to specific slide
  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const currentFeature = bikeFeatures[currentIndex];

  if (!hasBike) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-full min-h-[400px] rounded-3xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md"
        >
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pb-0">
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">My Bike</h2>
              <p className="text-[11px] text-muted-foreground/70 font-light">Your ride at a glance</p>
            </div>
            <div className="p-2 rounded-full bg-background/20 backdrop-blur-sm">
              <Bike className="h-4 w-4 text-wj-green" />
            </div>
          </div>
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
            {loadingBike ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPickerOpen(true)}
                  disabled={!isRealUser}
                  className="group relative w-20 h-20 rounded-full bg-wj-green/10 border border-wj-green/40 flex items-center justify-center mb-4 transition-colors hover:bg-wj-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Register a bike"
                >
                  <Plus className="h-8 w-8 text-wj-green" strokeWidth={1.5} />
                  <span className="absolute inset-0 rounded-full ring-0 ring-wj-green/30 group-hover:ring-4 transition-all" />
                </motion.button>
                <p className="text-sm font-medium text-foreground/80">Register your bike</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  {isRealUser
                    ? "Tap the + to pick your WJ bike from our inventory."
                    : "Sign in with a real account to register a bike."}
                </p>
              </>
            )}
          </div>
        </motion.div>

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select your bike</DialogTitle>
              <DialogDescription>
                Pick the WJ model you own — it will be linked to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models…"
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No bikes found.
                </p>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleRegister(p)}
                    disabled={registeringId !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-wj-green/60 hover:bg-wj-green/5 transition-colors text-left disabled:opacity-50"
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
                    {registeringId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-wj-green" />
                    ) : (
                      <Check className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pb-0">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">My Bike</h2>
          <p className="text-[11px] text-muted-foreground/70 font-light">Your ride at a glance</p>
        </div>
        <div className="p-2 rounded-full bg-background/20 backdrop-blur-sm">
          <Bike className="h-4 w-4 text-wj-green" />
        </div>
      </div>
      {/* Carousel Container */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {bikeFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 relative h-full"
            >
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            {/* Feature Label */}
            <span className="inline-block px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-wj-green bg-wj-green/10 rounded">
              {currentFeature.feature}
            </span>

            {/* Title & Description */}
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {currentFeature.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {currentFeature.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-2">
              {currentFeature.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bike ID & Progress */}
        <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between pointer-events-auto">
          <div>
            <p className="text-xs text-muted-foreground font-mono">
              {registeredBike?.serial || registeredBike?.model || user?.bikeId || "V8-2024-NL-00156"}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {bikeFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-6 bg-wj-green"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

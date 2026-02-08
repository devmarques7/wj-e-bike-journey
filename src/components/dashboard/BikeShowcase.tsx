import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { Bike } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
              {user?.bikeId || "V8-2024-NL-00156"}
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

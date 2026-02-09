import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Gauge, Battery, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";

// Import all bike component images
import bikeFull from "@/assets/bike-full.png";
import bikePanel from "@/assets/bike-panel.png";
import bikeHeadlight from "@/assets/bike-headlight.png";
import bikeWheel from "@/assets/bike-wheel.png";
import bikeChain from "@/assets/bike-chain.png";
import bikeBrakes from "@/assets/bike-brakes.png";
import bikeV8Front from "@/assets/bike-v8-front.png";
import bikeV8Side from "@/assets/bike-v8-side.png";

// Bike features data with detailed specs
const bikeFeatures = [
  {
    image: bikeFull,
    title: "V8 Electric",
    feature: "Design Completo",
    description: "Estética urbana arrojada com acabamento premium em cada detalhe",
    highlight: "Premium Build",
  },
  {
    image: bikeV8Side,
    title: "V8 Electric",
    feature: "Perfil Aerodinâmico",
    description: "Linhas fluidas que combinam velocidade e elegância",
    highlight: "Aero Design",
  },
  {
    image: bikePanel,
    title: "Smart Display",
    feature: "Painel Digital LCD",
    description: "Conectividade total com app, GPS integrado e métricas em tempo real",
    highlight: "Connected",
  },
  {
    image: bikeHeadlight,
    title: "LED Premium",
    feature: "Faróis Inteligentes",
    description: "Iluminação automática 1200lm com sensor de luz ambiente",
    highlight: "1200 Lumens",
  },
  {
    image: bikeWheel,
    title: "Kenda Fat Tire",
    feature: "Rodas All-Terrain",
    description: "Pneus 20x4.0 para máxima aderência em qualquer superfície",
    highlight: "20\" x 4.0",
  },
  {
    image: bikeChain,
    title: "Shimano 7-Speed",
    feature: "Transmissão Pro",
    description: "Sistema de 7 marchas de alta performance e durabilidade",
    highlight: "7 Speeds",
  },
  {
    image: bikeBrakes,
    title: "Disco Hidráulico",
    feature: "Freios 180mm",
    description: "Frenagem precisa com discos de 180mm e pastilhas cerâmicas",
    highlight: "Hydraulic",
  },
  {
    image: bikeV8Front,
    title: "V8 Electric",
    feature: "Vista Frontal",
    description: "Presença imponente com faróis integrados e guidão ergonômico",
    highlight: "Iconic Front",
  },
];

// Key specs for the bike
const keySpecs = [
  { icon: Gauge, label: "Velocidade", value: "45 km/h" },
  { icon: Battery, label: "Autonomia", value: "80 km" },
  { icon: Zap, label: "Motor", value: "750W" },
  { icon: Shield, label: "Garantia", value: "3 Anos" },
];

interface ModelShowcaseProps {
  modelName?: string;
  modelTagline?: string;
  description?: string;
  ctaLink?: string;
  ctaText?: string;
  slideInterval?: number;
}

const ModelShowcaseSection = ({
  modelName = "V8 Electric",
  modelTagline = "Urban Power",
  description = "Desempenho silencioso com design urbano arrojado. Feito para dominar as ruas com estilo e conforto.",
  ctaLink = "/product/vision-x1",
  ctaText = "Veja Mais Detalhes",
  slideInterval = 6000,
}: ModelShowcaseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });

  // Track scroll progress
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  
  const borderRadius = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 24, 24, 0]);
  const widthPercent = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], ["95%", "85%", "85%", "95%"]);

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

  // Auto-advance carousel
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, slideInterval);
    return () => clearInterval(interval);
  }, [emblaApi, slideInterval]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const currentFeature = bikeFeatures[currentIndex];

  return (
    <section ref={sectionRef} className="relative overflow-hidden flex justify-center">
      {/* Video Background Layer */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/showcase-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/30" />
      </div>

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />

      {/* Main Content Container */}
      <motion.div 
        className="relative h-[75vh] min-h-[550px] max-h-[750px] overflow-hidden bg-background"
        style={{
          borderRadius,
          width: widthPercent,
        }}
      >
        {/* Carousel Background */}
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
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

        {/* Content */}
        <div className="relative h-full container-wj">
          <div className="absolute bottom-8 md:bottom-12 left-6 md:left-8 right-6 md:right-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              {/* Left: Main Content */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                viewport={{ once: true }}
                className="max-w-lg"
              >
                {/* Feature Badge */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <span className="w-8 h-px bg-wj-green" />
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-wj-green">
                      {currentFeature.feature}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-wj-green bg-wj-green/10 rounded-full border border-wj-green/20">
                      {currentFeature.highlight}
                    </span>
                  </motion.div>
                </AnimatePresence>

                {/* Model Name */}
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
                  {modelName}
                </h2>

                {/* Dynamic Description */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-muted-foreground text-base md:text-lg mb-6 leading-relaxed"
                  >
                    {currentFeature.description}
                  </motion.p>
                </AnimatePresence>

                {/* Key Specs Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {keySpecs.map((spec) => (
                    <div 
                      key={spec.label}
                      className="text-center p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30"
                    >
                      <spec.icon className="h-4 w-4 text-wj-green mx-auto mb-1" />
                      <p className="text-sm font-semibold text-foreground">{spec.value}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{spec.label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className="gradient-wj text-white hover:opacity-90 group"
                >
                  <Link to={ctaLink}>
                    {ctaText}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>

              {/* Right: Slide Indicators & Feature Title */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                viewport={{ once: true }}
                className="flex flex-col items-start lg:items-end gap-4"
              >
                {/* Current Feature Title */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-right hidden lg:block"
                  >
                    <p className="text-2xl font-semibold text-foreground">{currentFeature.title}</p>
                    <p className="text-sm text-muted-foreground">{currentFeature.feature}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Slide Indicators */}
                <div className="flex gap-1.5">
                  {bikeFeatures.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollTo(index)}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        currentIndex === index
                          ? "w-8 bg-wj-green"
                          : "w-2 bg-foreground/30 hover:bg-foreground/50"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Slide Counter */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span className="text-wj-green font-semibold">{String(currentIndex + 1).padStart(2, '0')}</span>
                  <span>/</span>
                  <span>{String(bikeFeatures.length).padStart(2, '0')}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent z-20 pointer-events-none" />
    </section>
  );
};

export default ModelShowcaseSection;

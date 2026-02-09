import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

// Import bike images
import bikeFull from "@/assets/bike-full.png";
import bikePanel from "@/assets/bike-panel.png";
import bikeHeadlight from "@/assets/bike-headlight.png";
import bikeWheel from "@/assets/bike-wheel.png";
import bikeV8Side from "@/assets/bike-v8-side.png";

// Simplified bike features
const bikeFeatures = [
  {
    image: bikeFull,
    feature: "Design Completo",
    description: "Acabamento premium em cada detalhe",
  },
  {
    image: bikeV8Side,
    feature: "Perfil Aerodinâmico",
    description: "Velocidade e elegância combinadas",
  },
  {
    image: bikePanel,
    feature: "Painel Digital",
    description: "GPS integrado e métricas em tempo real",
  },
  {
    image: bikeHeadlight,
    feature: "LED 1200lm",
    description: "Iluminação automática inteligente",
  },
  {
    image: bikeWheel,
    feature: "Fat Tire 20x4.0",
    description: "Aderência em qualquer superfície",
  },
];

interface ModelShowcaseProps {
  modelName?: string;
  ctaLink?: string;
  ctaText?: string;
  slideInterval?: number;
}

const ModelShowcaseSection = ({
  modelName = "V8 Electric",
  ctaLink = "/product/vision-x1",
  ctaText = "Explorar",
  slideInterval = 5000,
}: ModelShowcaseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  
  const borderRadius = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 20, 20, 0]);
  const widthPercent = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], ["100%", "90%", "90%", "100%"]);

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
    <section ref={sectionRef} className="relative overflow-hidden flex justify-center py-4">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src="/videos/showcase-background.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Main Container - Reduced Height */}
      <motion.div 
        className="relative h-[50vh] min-h-[380px] max-h-[480px] overflow-hidden bg-background"
        style={{
          borderRadius,
          width: widthPercent,
        }}
      >
        {/* Carousel */}
        <div className="absolute inset-0" ref={emblaRef}>
          <div className="flex h-full">
            {bikeFeatures.map((feature, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
                <img
                  src={feature.image}
                  alt={feature.feature}
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Minimal Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />

        {/* Minimal Content */}
        <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-md"
          >
            {/* Feature Tag */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 mb-3"
              >
                <span className="w-6 h-px bg-wj-green" />
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-wj-green">
                  {currentFeature.feature}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Model Name */}
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
              {modelName}
            </h2>

            {/* Dynamic Description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-muted-foreground text-sm mb-5"
              >
                {currentFeature.description}
              </motion.p>
            </AnimatePresence>

            {/* CTA with Hover Animation */}
            <Link 
              to={ctaLink}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="inline-flex items-center gap-2 group"
            >
              <motion.span
                className="relative px-5 py-2.5 text-sm font-medium text-white rounded-full overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated Background */}
                <motion.span
                  className="absolute inset-0 gradient-wj"
                  initial={{ opacity: 1 }}
                />
                <motion.span
                  className="absolute inset-0 bg-wj-green"
                  initial={{ x: "-100%" }}
                  animate={{ x: isHovered ? "0%" : "-100%" }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
                
                {/* Text */}
                <span className="relative z-10 flex items-center gap-2">
                  {ctaText}
                  <motion.span
                    animate={{ x: isHovered ? 4 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </span>
              </motion.span>
            </Link>

            {/* Minimal Indicators */}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex gap-1">
                {bikeFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`h-0.5 rounded-full transition-all duration-400 ${
                      currentIndex === index
                        ? "w-6 bg-wj-green"
                        : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {String(currentIndex + 1).padStart(2, '0')}/{String(bikeFeatures.length).padStart(2, '0')}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default ModelShowcaseSection;

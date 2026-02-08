import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import bikeV8Front from "@/assets/bike-v8-front.png";
import bikeV8Side from "@/assets/bike-v8-side.png";

interface ModelShowcaseProps {
  modelName?: string;
  modelTagline?: string;
  description?: string;
  ctaLink?: string;
  ctaText?: string;
  images?: string[];
  slideInterval?: number;
}

const ModelShowcaseSection = ({
  modelName = "V8 Electric",
  modelTagline = "Urban Power",
  description = "Desempenho silencioso com design urbano arrojado. Feito para dominar as ruas com estilo e conforto.",
  ctaLink = "/product/vision-x1",
  ctaText = "Veja Mais Detalhes",
  images = [bikeV8Side, bikeV8Front, bikeV8Side],
  slideInterval = 10000,
}: ModelShowcaseProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress to animation values
  const borderRadius = useTransform(scrollYProgress, [0, 0.15], [0, 24]);
  const margin = useTransform(scrollYProgress, [0, 0.15], [0, 24]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [images.length, slideInterval]);

  return (
    <section className="relative overflow-hidden bg-background px-0 md:px-6 py-6">
      <motion.div 
        className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden"
        style={{
          borderRadius,
          marginLeft: margin,
          marginRight: margin,
          scale,
        }}
      >
        {/* Background Slideshow */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <img
                src={images[currentSlide]}
                alt={`${modelName} - Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
        </div>

        {/* Content - Bottom Left with padding */}
        <div className="relative h-full container-wj">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            viewport={{ once: true }}
            className="absolute bottom-8 md:bottom-12 left-6 md:left-8 max-w-md"
          >
            {/* Model Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-wj-green" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-wj-green">
                {modelTagline}
              </span>
            </div>

            {/* Model Name */}
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {modelName}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-base md:text-lg mb-6 leading-relaxed">
              {description}
            </p>

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

            {/* Slide Indicators */}
            <div className="flex gap-2 mt-8">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    currentSlide === index
                      ? "w-8 bg-wj-green"
                      : "w-2 bg-foreground/30 hover:bg-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default ModelShowcaseSection;

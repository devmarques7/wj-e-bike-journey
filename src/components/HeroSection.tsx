import { motion } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background z-10" />
        
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="absolute bottom-16 md:bottom-20 left-0 right-0 z-20 container-wj">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-xl"
        >
          {/* Model Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="h-px w-8 bg-wj-green" />
            <span className="text-wj-green text-xs font-medium tracking-[0.3em] uppercase">
              V8 Electric
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-display-sm md:text-display-lg lg:text-display-xl font-bold text-foreground mb-6 leading-[0.95]"
          >
            Power with bold
            <br />
            <span className="text-gradient-wj">urban attitude.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-base md:text-lg text-muted-foreground max-w-md mb-4"
          >
            Built to own the streets with style, comfort, and silent performance.
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-sm text-foreground/60 tracking-wide mb-10"
          >
            More range. More control. No limits.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Button
              size="lg"
              className="bg-wj-green text-white hover:bg-wj-green/90 px-8 py-6 text-sm font-medium tracking-wide transition-all duration-300"
              onClick={scrollToNext}
            >
              Explore V8
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-foreground/70 hover:text-foreground hover:bg-transparent gap-2 px-6 py-6 text-sm"
            >
              <Play className="h-4 w-4" />
              Watch Film
            </Button>
          </motion.div>

          {/* Minimal Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 flex items-center gap-8 text-sm"
          >
            {[
              { value: "150km", label: "Range" },
              { value: "25km/h", label: "Speed" },
              { value: "5yr", label: "Warranty" },
            ].map((stat, index) => (
              <div key={index} className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToNext}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-foreground/60 hover:text-wj-green transition-colors cursor-pointer"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-8 w-8" />
        </motion.div>
      </motion.button>
    </section>
  );
};

export default HeroSection;

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
      {/* Video Background Placeholder */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background z-10" />
        
        {/* Placeholder with animated gradient - replace with video */}
        <div className="absolute inset-0 bg-gradient-to-br from-wj-deep via-wj-forest to-wj-deep">
          {/* Animated ambient light effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, hsl(var(--wj-green) / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, hsl(var(--wj-green) / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, hsl(var(--wj-green) / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, hsl(var(--wj-green) / 0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 container-wj text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Pre-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-wj-green text-sm md:text-base font-medium tracking-widest uppercase mb-6"
          >
            Premium E-Mobility Experience
          </motion.p>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-display-sm md:text-display-lg lg:text-display-xl font-bold text-foreground mb-6 text-balance"
          >
            Your journey in the Netherlands,{" "}
            <span className="text-gradient-wj">elevated to a state of art.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            We don't just sell e-bikes. We deliver freedom, performance, and the
            world's first digital mobility passport.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="glass border-wj-green/50 text-foreground hover:bg-wj-green hover:text-white px-8 py-6 text-base transition-all duration-300"
              onClick={scrollToNext}
            >
              Discover My Journey
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-foreground/80 hover:text-foreground gap-2 px-8 py-6 text-base"
            >
              <Play className="h-5 w-5" />
              Watch Film
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 md:mt-24 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: "150+", label: "km Range" },
            { value: "25", label: "km/h Top Speed" },
            { value: "5yr", label: "Warranty" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          ))}
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

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Shield, Leaf, Smartphone } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Power",
    description:
      "Seamless electric assist that responds to your every pedal. Feel the surge of 250W brushless motor technology.",
    highlight: "0-25 km/h in 3 seconds",
  },
  {
    icon: Shield,
    title: "Dutch-Proof Build",
    description:
      "Engineered for the Netherlands. Rain, wind, and cobblestones are no match for our aerospace-grade aluminum frame.",
    highlight: "IP67 Weather Resistance",
  },
  {
    icon: Leaf,
    title: "Sustainable Journey",
    description:
      "Every ride saves 2.4kg of CO₂. Our batteries are 95% recyclable, and our packaging is 100% plastic-free.",
    highlight: "Carbon Negative by 2025",
  },
  {
    icon: Smartphone,
    title: "Connected Intelligence",
    description:
      "GPS tracking, theft detection, and ride analytics. Your bike, always in your pocket via the WJ Vision app.",
    highlight: "Real-time Connectivity",
  },
];

const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="section-padding bg-card" ref={containerRef}>
      <div className="container-wj">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-4">
            Technology
          </p>
          <h2 className="text-display-sm md:text-display-md font-bold text-foreground mb-6">
            Engineering Excellence
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every component is designed, tested, and refined in the Netherlands
            for the ultimate urban mobility experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative p-8 rounded-2xl bg-background border border-border hover:border-wj-green/30 transition-all duration-500"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl gradient-wj flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Highlight */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-wj-green/10 border border-wj-green/20">
                <span className="text-sm font-medium text-wj-green">
                  {feature.highlight}
                </span>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-wj-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

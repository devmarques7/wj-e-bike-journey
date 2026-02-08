import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function BikeShowcase() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bikeFeatures.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentFeature = bikeFeatures[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden"
    >
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={currentFeature.image}
            alt={currentFeature.title}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
        <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
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
                onClick={() => setCurrentIndex(index)}
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

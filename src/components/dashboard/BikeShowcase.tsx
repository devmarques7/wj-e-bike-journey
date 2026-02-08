import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import bikeV8Front from "@/assets/bike-v8-front.png";
import bikeV8Side from "@/assets/bike-v8-side.png";

const bikeFeatures = [
  {
    image: bikeV8Front,
    title: "Front View",
    feature: "Integrated LED Lighting",
    description: "Smart headlight with automatic brightness adjustment",
  },
  {
    image: bikeV8Side,
    title: "Side Profile",
    feature: "Carbon Frame",
    description: "Lightweight aerospace-grade carbon construction",
  },
  {
    image: bikeV8Front,
    title: "Motor System",
    feature: "500W Hub Motor",
    description: "Silent power delivery with regenerative braking",
  },
  {
    image: bikeV8Side,
    title: "Battery Pack",
    feature: "Extended Range",
    description: "80km range with fast charging capability",
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
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50"
    >
      {/* Background Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex items-center justify-center p-8"
        >
          <img
            src={currentFeature.image}
            alt={currentFeature.title}
            className="max-h-full max-w-full object-contain drop-shadow-2xl"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs text-wj-green font-medium uppercase tracking-wider mb-1">
              {currentFeature.title}
            </p>
            <h3 className="text-xl font-semibold text-foreground mb-1">
              {currentFeature.feature}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentFeature.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Bike Info */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm font-medium text-foreground">{user?.bikeName}</p>
          <p className="text-xs text-muted-foreground font-mono">{user?.bikeId}</p>
        </div>

        {/* Progress Indicators */}
        <div className="flex gap-2 mt-4">
          {bikeFeatures.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-wj-green"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

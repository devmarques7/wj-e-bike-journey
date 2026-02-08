import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accessories } from "@/data/accessories";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

// Get featured accessories for the carousel
const carouselAccessories = accessories.slice(0, 6);

export default function AccessoryCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { addItem } = useCart();

  // Auto-rotate carousel every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselAccessories.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const currentAccessory = carouselAccessories[currentIndex];

  const handleAddToCart = () => {
    addItem({
      id: currentAccessory.id,
      name: currentAccessory.name,
      price: currentAccessory.price,
      color: currentAccessory.colors[0]?.name || "Default",
    });
  };

  const handleToggleFavorite = () => {
    setFavorites((prev) =>
      prev.includes(currentAccessory.id)
        ? prev.filter((id) => id !== currentAccessory.id)
        : [...prev, currentAccessory.id]
    );
  };

  const isFavorite = favorites.includes(currentAccessory.id);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselAccessories.length) % carouselAccessories.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselAccessories.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-full rounded-3xl border border-border/50 overflow-hidden relative"
    >
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAccessory.id + "-bg"}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={currentAccessory.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-5">
        {/* Top Section */}
        <div className="flex items-start justify-between">
          {/* Badge */}
          <AnimatePresence mode="wait">
            {(currentAccessory.isNew || currentAccessory.isBestseller) && (
              <motion.span
                key={currentAccessory.id + "-badge"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="px-2.5 py-1 rounded-full bg-wj-green/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-primary-foreground"
              >
                {currentAccessory.isNew ? "New" : "Bestseller"}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={cn(
              "w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all",
              isFavorite 
                ? "bg-destructive/20 text-destructive" 
                : "bg-background/30 text-foreground/70 hover:bg-background/50"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          {/* Product Info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAccessory.id + "-info"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {currentAccessory.category}
              </p>
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {currentAccessory.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentAccessory.tagline}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-wj-green">€{currentAccessory.price}</span>
                {currentAccessory.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    €{currentAccessory.originalPrice}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Actions Row */}
          <div className="flex items-center gap-3">
            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="flex-1 bg-wj-green hover:bg-wj-green/90 text-primary-foreground h-10"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrev}
                className="w-10 h-10 rounded-xl bg-background/30 backdrop-blur-md hover:bg-background/50 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={goToNext}
                className="w-10 h-10 rounded-xl bg-background/30 backdrop-blur-md hover:bg-background/50 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {carouselAccessories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  index === currentIndex 
                    ? "bg-wj-green flex-1" 
                    : "bg-foreground/20 w-6 hover:bg-foreground/30"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, ChevronUp, ChevronDown } from "lucide-react";
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

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselAccessories.length);
    }, 4000);
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
      className="h-full rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">For Your Bike</p>
        <h3 className="text-sm font-semibold text-foreground">Accessories</h3>
      </div>

      {/* Carousel Content */}
      <div className="flex-1 flex flex-col p-4 relative">
        {/* Navigation Arrows */}
        <div className="absolute right-4 top-4 flex flex-col gap-1 z-10">
          <button
            onClick={goToPrev}
            className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={goToNext}
            className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentAccessory.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Image */}
            <div className="aspect-square rounded-2xl bg-muted/30 flex items-center justify-center mb-3 relative overflow-hidden">
              <img
                src={currentAccessory.image}
                alt={currentAccessory.name}
                className="w-full h-full object-contain p-4"
              />
              {/* Badges */}
              {currentAccessory.isNew && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-wj-green text-[10px] font-bold uppercase text-primary-foreground">
                  New
                </span>
              )}
              {currentAccessory.isBestseller && !currentAccessory.isNew && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-wj-green/80 text-[10px] font-bold uppercase text-primary-foreground">
                  Bestseller
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1 mb-3">
              <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                {currentAccessory.name}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {currentAccessory.tagline}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-wj-green">€{currentAccessory.price}</span>
                {currentAccessory.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    €{currentAccessory.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Color Dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {currentAccessory.colors.slice(0, 4).map((color) => (
                <div
                  key={color.name}
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="flex-1 bg-wj-green hover:bg-wj-green/90 text-white text-xs h-9"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
          <Button
            onClick={handleToggleFavorite}
            size="sm"
            variant="outline"
            className={cn(
              "h-9 w-9 p-0 border-border/50",
              isFavorite && "bg-destructive/10 border-destructive/30 text-destructive"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
          </Button>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {carouselAccessories.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                index === currentIndex ? "bg-wj-green w-4" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

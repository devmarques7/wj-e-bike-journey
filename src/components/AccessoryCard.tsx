import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Eye, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accessory } from "@/data/accessories";

interface AccessoryCardProps {
  accessory: Accessory;
  index: number;
}

const AccessoryCard = ({ accessory, index }: AccessoryCardProps) => {
  const [selectedColor, setSelectedColor] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-2xl bg-card border border-border overflow-hidden transition-all duration-500 hover:border-wj-green/30 hover:shadow-lg hover:shadow-wj-green/5">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {accessory.isNew && (
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider gradient-wj text-white rounded-full">
              New
            </span>
          )}
          {accessory.isBestseller && (
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-foreground text-background rounded-full">
              Bestseller
            </span>
          )}
        </div>

        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary to-muted overflow-hidden">
          <motion.div
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            {/* Accessory Icon Placeholder */}
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${accessory.colors[selectedColor].hex}15` }}
            >
              <Package 
                className="w-12 h-12"
                style={{ color: accessory.colors[selectedColor].hex }}
              />
            </div>
          </motion.div>

          {/* Quick Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 right-4 flex gap-2"
          >
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 glass border-white/20 text-foreground hover:bg-wj-green hover:text-white hover:border-wj-green"
            >
              <Link to={`/accessories/${accessory.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Quick View
              </Link>
            </Button>
            <Button
              size="sm"
              className="gradient-wj text-white hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category & Name */}
          <p className="text-xs text-wj-green font-medium uppercase tracking-wider mb-1">
            {accessory.category}
          </p>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {accessory.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {accessory.tagline}
          </p>

          {/* Color Selector */}
          <div className="flex gap-2 mb-4">
            {accessory.colors.map((color, i) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(i)}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  selectedColor === i
                    ? "border-wj-green scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>

          {/* Specs Row */}
          <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
            {accessory.specs.weight && <span>{accessory.specs.weight}</span>}
            {accessory.specs.material && (
              <>
                <span>•</span>
                <span>{accessory.specs.material}</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {formatPrice(accessory.price)}
            </span>
            {accessory.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(accessory.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccessoryCard;

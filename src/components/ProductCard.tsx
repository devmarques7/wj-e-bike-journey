import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Eye, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BikeProduct } from "@/data/products";

interface ProductCardProps {
  product: BikeProduct;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
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
          {product.isNew && (
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider gradient-wj text-white rounded-full">
              New
            </span>
          )}
          {product.isBestseller && (
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
            {/* Placeholder bike silhouette */}
            <svg
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full max-w-[200px]"
            >
              <g stroke={product.colors[selectedColor].hex} strokeWidth="2">
                <path d="M50 80 L90 50 L140 50 L160 80" strokeLinecap="round" />
                <path d="M90 50 L90 80" strokeLinecap="round" />
                <path d="M50 80 L90 80" strokeLinecap="round" />
                <circle cx="160" cy="80" r="25" />
                <circle cx="160" cy="80" r="3" fill={product.colors[selectedColor].hex} />
                <circle cx="50" cy="80" r="25" />
                <circle cx="50" cy="80" r="3" fill={product.colors[selectedColor].hex} />
                <path d="M140 50 L145 40 L155 38" strokeLinecap="round" />
                <path d="M85 45 L95 45" strokeLinecap="round" strokeWidth="3" />
                <path d="M90 45 L90 50" strokeLinecap="round" />
                <circle cx="90" cy="80" r="8" />
                <path d="M82 80 L98 80" strokeLinecap="round" strokeWidth="2" />
                <rect x="75" y="55" width="20" height="8" rx="2" fill={product.colors[selectedColor].hex} />
              </g>
            </svg>
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
              <Link to={`/product/${product.id}`}>
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
            {product.category}
          </p>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {product.tagline}
          </p>

          {/* Color Selector */}
          <div className="flex gap-2 mb-4">
            {product.colors.map((color, i) => (
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
            <span>{product.specs.range}</span>
            <span>•</span>
            <span>{product.specs.weight}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

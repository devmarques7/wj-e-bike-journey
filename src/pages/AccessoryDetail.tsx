import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Shield, Truck, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { accessories, Accessory } from "@/data/accessories";

const AccessoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const foundAccessory = accessories.find((a) => a.id === id);
    setAccessory(foundAccessory || null);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (!accessory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Accessory not found</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalPrice = accessory.price * quantity;

  return (
    <div className="min-h-screen bg-background">
      <Navigation isScrolled={isScrolled} />

      {/* Back Button */}
      <div className="fixed top-24 left-4 md:left-8 z-30">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link to="/accessories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accessories
          </Link>
        </Button>
      </div>

      <main className="pt-32 md:pt-36 pb-20">
        {/* Hero Section */}
        <section className="container-wj">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left - Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="sticky top-32">
                <div className="aspect-square rounded-3xl border border-border/30 flex items-center justify-center relative overflow-hidden">
                  {/* Subtle Background */}
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{ backgroundColor: accessory.colors[selectedColor].hex }}
                  />
                  
                  {/* Accessory Visual */}
                  <Package 
                    className="w-32 h-32 md:w-48 md:h-48"
                    style={{ color: accessory.colors[selectedColor].hex }}
                  />

                  {/* Badges */}
                  <div className="absolute top-6 left-6 flex gap-2">
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
                </div>

                {/* Color Thumbnails */}
                <div className="flex gap-3 mt-6 justify-center">
                  {accessory.colors.map((color, index) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(index)}
                      className={`w-16 h-16 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                        selectedColor === index
                          ? "border-wj-green"
                          : "border-border/30 hover:border-border"
                      }`}
                      style={{ backgroundColor: `${color.hex}10` }}
                    >
                      <Package 
                        className="w-8 h-8"
                        style={{ color: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right - Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em]">
                  {accessory.category}
                </p>
                <h1 className="text-3xl md:text-4xl font-light text-foreground">
                  {accessory.name}
                </h1>
                <p className="text-lg text-muted-foreground font-light">
                  {accessory.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-light text-foreground">
                  {formatPrice(accessory.price)}
                </span>
                {accessory.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(accessory.originalPrice)}
                  </span>
                )}
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <label className="block text-sm text-muted-foreground">
                  Color: <span className="text-foreground">{accessory.colors[selectedColor].name}</span>
                </label>
                <div className="flex gap-3">
                  {accessory.colors.map((color, index) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(index)}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === index
                          ? "border-wj-green scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <label className="block text-sm text-muted-foreground">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-border/30 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted/20 transition-colors rounded-l-xl"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-14 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-muted/20 transition-colors rounded-r-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4 pt-4">
                <Button
                  size="lg"
                  className="flex-1 gradient-wj text-white hover:opacity-90"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart — {formatPrice(totalPrice)}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex gap-8 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-wj-green" />
                  Free Shipping
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-wj-green" />
                  {accessory.specs.warranty || "2yr Warranty"}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-wj-green" />
                  Fast Delivery
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/20" />

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {accessory.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-wj-green flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(accessory.specs).map(([key, value]) => (
                    value && (
                      <div key={key} className="space-y-1">
                        <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                          {key}
                        </p>
                        <p className="text-sm text-foreground">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Compatibility Notice */}
              {accessory.specs.compatibility && (
                <div className="p-4 rounded-xl border border-wj-green/20 bg-wj-green/5">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Compatibility:</span>{" "}
                    <span className="text-muted-foreground">{accessory.specs.compatibility}</span>
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Related Products */}
        <section className="container-wj mt-24">
          <div className="text-center mb-12">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
              Complete Your Setup
            </p>
            <h2 className="text-2xl font-light text-foreground">
              Related Accessories
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {accessories
              .filter((a) => a.id !== accessory.id && a.category === accessory.category)
              .slice(0, 4)
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/accessories/${item.id}`}
                  className="group"
                >
                  <div className="aspect-square rounded-2xl border border-border/20 flex items-center justify-center bg-muted/10 mb-4 transition-all duration-300 group-hover:border-wj-green/30">
                    <Package 
                      className="w-16 h-16 text-muted-foreground/50 group-hover:text-wj-green transition-colors duration-300"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-foreground group-hover:text-wj-green transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AccessoryDetail;

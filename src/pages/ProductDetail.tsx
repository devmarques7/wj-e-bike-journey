import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Shield, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { bikeProducts, BikeProduct } from "@/data/products";

// Product part descriptions for scroll reveal
const productParts = [
  {
    id: "motor",
    title: "Brushless Motor",
    description: "250W of pure Dutch engineering. Silent, powerful, and designed to last 20,000+ kilometers.",
    position: { x: "65%", y: "70%" },
  },
  {
    id: "battery",
    title: "Removable Battery",
    description: "Samsung cells with intelligent BMS. Charge at home or at the office in under 4 hours.",
    position: { x: "50%", y: "45%" },
  },
  {
    id: "frame",
    title: "Aerospace Aluminum",
    description: "6061-T6 aluminum frame, hydroformed for strength and elegance. Lifetime warranty included.",
    position: { x: "35%", y: "55%" },
  },
  {
    id: "seat",
    title: "Ergonomic Saddle",
    description: "Italian leather with memory foam. Designed for 2+ hours of comfortable riding.",
    position: { x: "45%", y: "25%" },
  },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<BikeProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedEPass, setSelectedEPass] = useState<"basic" | "silver" | "black">("basic");
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePart, setActivePart] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Transform for sticky bike image
  const bikeScale = useTransform(scrollYProgress, [0, 0.3], [0.9, 1]);
  const bikeOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  useEffect(() => {
    const foundProduct = bikeProducts.find((p) => p.id === id);
    setProduct(foundProduct || null);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Update active part based on scroll position
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      const partIndex = Math.min(
        Math.floor(scrollPercent * productParts.length * 2),
        productParts.length - 1
      );
      setActivePart(partIndex);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
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

  const ePassPrices = {
    basic: 0,
    silver: 14.99,
    black: 24.99,
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <Navigation isScrolled={isScrolled} />

      {/* Back Button */}
      <div className="fixed top-24 left-4 md:left-8 z-30">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link to="/gallery">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Link>
        </Button>
      </div>

      <main className="pt-24 md:pt-28">
        {/* Hero Section with Sticky Bike */}
        <section className="relative min-h-[200vh]">
          {/* Sticky Bike Container */}
          <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
            <motion.div
              style={{ scale: bikeScale, opacity: bikeOpacity }}
              className="relative w-full max-w-2xl mx-auto px-8"
            >
              {/* Bike SVG */}
              <svg
                viewBox="0 0 200 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                <g stroke={product.colors[selectedColor].hex} strokeWidth="2.5">
                  <path d="M50 80 L90 50 L140 50 L160 80" strokeLinecap="round" />
                  <path d="M90 50 L90 80" strokeLinecap="round" />
                  <path d="M50 80 L90 80" strokeLinecap="round" />
                  <circle cx="160" cy="80" r="25" />
                  <circle cx="160" cy="80" r="4" fill={product.colors[selectedColor].hex} />
                  <circle cx="50" cy="80" r="25" />
                  <circle cx="50" cy="80" r="4" fill={product.colors[selectedColor].hex} />
                  <path d="M140 50 L145 40 L155 38" strokeLinecap="round" />
                  <path d="M85 45 L95 45" strokeLinecap="round" strokeWidth="4" />
                  <path d="M90 45 L90 50" strokeLinecap="round" />
                  <circle cx="90" cy="80" r="10" />
                  <path d="M80 80 L100 80" strokeLinecap="round" strokeWidth="3" />
                  <rect x="73" y="53" width="24" height="10" rx="2" fill={product.colors[selectedColor].hex} />
                </g>
              </svg>

              {/* Part Callouts */}
              {productParts.map((part, index) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: activePart >= index ? 1 : 0.3,
                    scale: activePart === index ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className="absolute"
                  style={{ left: part.position.x, top: part.position.y }}
                >
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    activePart === index
                      ? "bg-wj-green border-wj-green"
                      : "bg-transparent border-muted-foreground"
                  }`} />
                </motion.div>
              ))}
            </motion.div>

            {/* Product Info Overlay */}
            <div className="absolute bottom-8 left-0 right-0 px-8">
              <div className="container-wj">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center md:text-left"
                >
                  <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
                    {product.category}
                  </p>
                  <h1 className="text-display-sm md:text-display-lg font-bold text-foreground mb-2">
                    {product.name}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {product.tagline}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll Content - Part Details */}
          <div className="relative z-10 pointer-events-none">
            {productParts.map((part, index) => (
              <div
                key={part.id}
                className="min-h-[50vh] flex items-center px-8"
              >
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.6 }}
                  className={`max-w-md ${
                    index % 2 === 0 ? "mr-auto" : "ml-auto text-right"
                  }`}
                >
                  <div className="glass rounded-2xl p-6 pointer-events-auto">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {part.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {part.description}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Configuration Section */}
        <section className="section-padding bg-card">
          <div className="container-wj">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left - Options */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-8">
                  Configure Your {product.name}
                </h2>

                {/* Color Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Color: {product.colors[selectedColor].name}
                  </label>
                  <div className="flex gap-3">
                    {product.colors.map((color, index) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(index)}
                        className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === index
                            ? "border-wj-green scale-110 ring-2 ring-wj-green/30"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* E-Pass Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    E-Pass Membership
                  </label>
                  <div className="space-y-3">
                    {(["basic", "silver", "black"] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setSelectedEPass(tier)}
                        className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                          selectedEPass === tier
                            ? "border-wj-green bg-wj-green/5"
                            : "border-border hover:border-wj-green/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground capitalize">
                              {tier === "basic" ? "Basic (Included)" : `E-Pass ${tier}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tier === "basic" && "2-year warranty • E-ID included"}
                              {tier === "silver" && "5-year warranty • Priority service"}
                              {tier === "black" && "Lifetime warranty • VIP treatment"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {tier === "basic" ? "Free" : `+€${ePassPrices[tier]}/mo`}
                            </span>
                            {selectedEPass === tier && (
                              <Check className="h-5 w-5 text-wj-green" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Quantity
                  </label>
                  <div className="inline-flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-secondary transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-secondary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right - Summary */}
              <div>
                <div className="sticky top-28 glass rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-foreground mb-6">
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {product.name} × {quantity}
                      </span>
                      <span className="text-foreground">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        E-Pass {selectedEPass}
                      </span>
                      <span className="text-foreground">
                        {selectedEPass === "basic"
                          ? "Included"
                          : `+€${ePassPrices[selectedEPass]}/mo`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-wj-green">Free</span>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-foreground">
                          Total
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    asChild
                    size="lg"
                    className="w-full gradient-wj text-white hover:opacity-90 mb-4"
                  >
                    <Link to="/checkout">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </Link>
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mb-6">
                    Reserved for you for the next 15 minutes
                  </p>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Truck className="h-5 w-5 mx-auto text-wj-green mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Free Shipping
                      </p>
                    </div>
                    <div>
                      <Shield className="h-5 w-5 mx-auto text-wj-green mb-1" />
                      <p className="text-xs text-muted-foreground">
                        2yr Warranty
                      </p>
                    </div>
                    <div>
                      <Zap className="h-5 w-5 mx-auto text-wj-green mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Fast Delivery
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Specs Section */}
        <section className="section-padding bg-background">
          <div className="container-wj">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Technical Specifications
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {Object.entries(product.specs).map(([key, value]) => (
                <div
                  key={key}
                  className="text-center p-6 rounded-xl bg-card border border-border"
                >
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {value}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {key}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Purchase Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="glass border-t border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{product.name}</p>
              <p className="text-lg font-bold text-foreground">
                {formatPrice(totalPrice)}
              </p>
            </div>
            <Button asChild className="gradient-wj text-white">
              <Link to="/checkout">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Checkout
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;

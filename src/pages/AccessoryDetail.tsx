import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Shield, Truck, Zap, Package, ChevronDown } from "lucide-react";
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
  const [activeFeature, setActiveFeature] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const iconScale = useTransform(scrollYProgress, [0, 0.15], [0.8, 1]);
  const iconOpacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 1]);

  useEffect(() => {
    const foundAccessory = accessories.find((a) => a.id === id);
    setAccessory(foundAccessory || null);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Update active feature based on scroll
      if (accessory) {
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        const featureIndex = Math.min(
          Math.floor(scrollPercent * accessory.features.length * 3),
          accessory.features.length - 1
        );
        setActiveFeature(featureIndex);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [accessory]);

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

  // Feature descriptions for scroll reveal
  const featureDetails = accessory.features.map((feature, index) => ({
    title: feature,
    description: getFeatureDescription(feature),
    index,
  }));

  function getFeatureDescription(feature: string): string {
    const descriptions: Record<string, string> = {
      "Integrated LED": "High-visibility front and rear LED lights, automatically adjusting to ambient conditions.",
      "Bluetooth Speaker": "Premium audio with bone conduction technology. Stay aware of your surroundings.",
      "MIPS Technology": "Multi-directional Impact Protection System for advanced rotational force protection.",
      "Ventilation System": "15 strategically placed vents for optimal airflow during intense rides.",
      "App Control": "Full control via the WJ Vision app. Lock, unlock, and monitor from anywhere.",
      "GPS Tracking": "Real-time location tracking. Never lose sight of your bike.",
      "Tamper Alert": "Instant notifications when movement is detected while locked.",
      "Auto-Lock": "Automatically locks when you walk away, unlocks when you approach.",
      "Waterproof": "IPX6 rated. Full protection against heavy rain and splashes.",
      "25L Capacity": "Spacious main compartment with organized pockets for all your essentials.",
      "Quick Release": "One-click mounting and removal. Switch between bikes in seconds.",
      "Laptop Sleeve": "Padded 15\" laptop compartment with secure closure.",
      "800 Lumens": "Powerful beam that illuminates the road ahead up to 150 meters.",
      "USB-C Charging": "Universal charging. Full charge in under 2 hours.",
      "5 Modes": "From eco to turbo. Find the perfect light for every situation.",
      "Water Resistant": "Protected against rain and splashes for worry-free riding.",
      "Magnetic Mount": "Powerful rare-earth magnets hold your phone securely in place.",
      "360° Rotation": "Adjust viewing angle on the fly. Portrait or landscape, your choice.",
      "Wireless Charging": "Qi-compatible charging while you ride. Never run out of battery.",
      "Vibration Damping": "Advanced suspension system protects your phone from road vibrations.",
      "Full Coverage": "Complete protection from water and debris. Stay clean, stay dry.",
      "Quick Mount": "Tool-free installation in under 5 minutes.",
      "Splash Guard": "Extended coverage prevents spray from reaching your back.",
      "UV Resistant": "Maintains color and structure even after years of sun exposure.",
      "Memory Foam": "Adaptive cushioning that molds to your body for personalized comfort.",
      "Breathable": "Moisture-wicking materials keep you cool on long rides.",
      "Waterproof Base": "Sealed base prevents water damage from wet seats.",
      "Ergonomic Design": "Scientifically designed to reduce pressure and increase comfort.",
      "Anti-Slip": "Textured surface provides secure grip in all conditions.",
      "Shock Absorbing": "Built-in dampening reduces hand fatigue on rough roads.",
      "Lock-On System": "Secure clamping mechanism prevents rotation and slippage.",
      "Hand Support": "Ergonomic wing design supports your palm for natural positioning.",
      "Wide Angle": "180° field of view. See everything behind you at a glance.",
      "Foldable": "Compact design folds flat when not in use.",
      "Anti-Glare": "Coated lens reduces glare from headlights and sun.",
      "Tool-Free Mount": "Installs in seconds without any tools required.",
    };
    return descriptions[feature] || "Engineered for performance and durability.";
  }

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
          <Link to="/accessories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <main className="pt-24 md:pt-28">
        {/* Hero Section with Sticky Product */}
        <section className="relative min-h-[180vh]">
          {/* Sticky Product Container */}
          <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
            <motion.div
              style={{ scale: iconScale, opacity: iconOpacity }}
              className="relative"
            >
              {/* Product Visual */}
              <div 
                className="w-48 h-48 md:w-64 md:h-64 rounded-3xl flex items-center justify-center relative"
                style={{ backgroundColor: `${accessory.colors[selectedColor].hex}08` }}
              >
                <Package 
                  className="w-24 h-24 md:w-32 md:h-32 transition-colors duration-500"
                  style={{ color: accessory.colors[selectedColor].hex }}
                />
                
                {/* Feature Indicators */}
                {featureDetails.map((feature, index) => {
                  const angle = (index / featureDetails.length) * 360 - 90;
                  const radius = 140;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: activeFeature >= index ? 1 : 0.2,
                        scale: activeFeature === index ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.4 }}
                      className="absolute hidden md:block"
                      style={{ 
                        left: `calc(50% + ${x}px)`, 
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                        activeFeature === index
                          ? "bg-wj-green border-wj-green"
                          : "bg-transparent border-muted-foreground/30"
                      }`} />
                    </motion.div>
                  );
                })}
              </div>

              {/* Badges */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                {accessory.isNew && (
                  <motion.span 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider gradient-wj text-white rounded-full"
                  >
                    New
                  </motion.span>
                )}
                {accessory.isBestseller && (
                  <motion.span 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-foreground text-background rounded-full"
                  >
                    Bestseller
                  </motion.span>
                )}
              </div>
            </motion.div>

            {/* Product Info Overlay */}
            <div className="absolute bottom-12 left-0 right-0 px-8">
              <div className="container-wj">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
                    {accessory.category}
                  </p>
                  <h1 className="text-3xl md:text-5xl font-light text-foreground mb-3">
                    {accessory.name}
                  </h1>
                  <p className="text-lg text-muted-foreground font-light mb-6">
                    {accessory.tagline}
                  </p>
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronDown className="h-5 w-5 mx-auto text-muted-foreground/40" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll Content - Feature Details */}
          <div className="relative z-10 pointer-events-none">
            {featureDetails.map((feature, index) => (
              <div
                key={feature.title}
                className="min-h-[45vh] flex items-center px-8"
              >
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.5 }}
                  className={`max-w-sm ${
                    index % 2 === 0 ? "mr-auto" : "ml-auto text-right"
                  }`}
                >
                  <div className="glass rounded-2xl p-6 pointer-events-auto border border-border/20">
                    <div className={`flex items-center gap-2 mb-2 ${index % 2 !== 0 ? 'justify-end' : ''}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-wj-green" />
                      <h3 className="text-base font-medium text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Description Section */}
        <section className="py-20 bg-card/50">
          <div className="container-wj">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-6">
                About this product
              </p>
              <h2 className="text-2xl md:text-3xl font-light text-foreground mb-6">
                Engineered for Excellence
              </h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-8">
                The {accessory.name} represents the pinnacle of {accessory.category} technology. 
                Crafted with premium {accessory.specs.material || "materials"} and designed to 
                seamlessly integrate with your WJ Vision e-bike, this accessory delivers 
                uncompromising performance and style.
              </p>
              
              {/* Specs Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
              >
                {Object.entries(accessory.specs).map(([key, value], index) => (
                  value && (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="p-4 rounded-xl border border-border/20 bg-background/50"
                    >
                      <p className="text-lg font-light text-foreground mb-1">
                        {value}
                      </p>
                      <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                        {key}
                      </p>
                    </motion.div>
                  )
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Purchase Section */}
        <section className="py-20">
          <div className="container-wj">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                {/* Left - Image Gallery */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="aspect-square rounded-3xl border border-border/30 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: `${accessory.colors[selectedColor].hex}05` }}
                  >
                    <Package 
                      className="w-32 h-32 md:w-40 md:h-40 transition-colors duration-500"
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
                  </motion.div>

                  {/* Thumbnail Gallery */}
                  <div className="grid grid-cols-4 gap-3">
                    {["Front View", "Side View", "Back View", "Detail"].map((view, index) => (
                      <motion.button
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-300 ${
                          index === 0
                            ? "border-wj-green bg-wj-green/5"
                            : "border-border/30 hover:border-border/60"
                        }`}
                        style={{ backgroundColor: index === 0 ? `${accessory.colors[selectedColor].hex}08` : undefined }}
                      >
                        <Package 
                          className={`w-8 h-8 transition-colors duration-300 ${
                            index === 0 ? "" : "text-muted-foreground/40"
                          }`}
                          style={{ color: index === 0 ? accessory.colors[selectedColor].hex : undefined }}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Right - Product Info */}
                <div className="lg:sticky lg:top-32 space-y-8">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em]">
                      {accessory.category}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-light text-foreground">
                      {accessory.name}
                    </h3>
                    <p className="text-muted-foreground font-light">
                      {accessory.tagline}
                    </p>
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
                  </motion.div>

                  {/* Divider */}
                  <div className="h-px bg-border/20" />

                  {/* Features Quick View */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                      Key Features
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accessory.features.slice(0, 4).map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1.5 text-xs rounded-full border border-border/30 text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Color Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="space-y-3"
                  >
                    <label className="block text-xs text-muted-foreground/60 uppercase tracking-wider">
                      Color: <span className="text-foreground normal-case">{accessory.colors[selectedColor].name}</span>
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
                  </motion.div>

                  {/* Quantity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="space-y-3"
                  >
                    <label className="block text-xs text-muted-foreground/60 uppercase tracking-wider">
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
                  </motion.div>

                  {/* Add to Cart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="pt-4"
                  >
                    <Button
                      size="lg"
                      className="w-full gradient-wj text-white hover:opacity-90 py-6"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add to Cart — {formatPrice(totalPrice)}
                    </Button>
                  </motion.div>

                  {/* Trust Badges */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-wrap gap-6 pt-2 text-xs text-muted-foreground"
                  >
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
                  </motion.div>

                  {/* Compatibility */}
                  {accessory.specs.compatibility && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.35 }}
                      className="p-4 rounded-xl border border-wj-green/20 bg-wj-green/5"
                    >
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Compatible with:</span>{" "}
                        {accessory.specs.compatibility}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Related Products */}
        <section className="py-20 bg-card/30">
          <div className="container-wj">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
                Complete Your Setup
              </p>
              <h2 className="text-2xl font-light text-foreground">
                Related Accessories
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {accessories
                .filter((a) => a.id !== accessory.id)
                .slice(0, 4)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/accessories/${item.id}`}
                      className="group block"
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
                  </motion.div>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AccessoryDetail;

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Shield, Truck, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { bikeProducts, BikeProduct } from "@/data/products";
import useEmblaCarousel from "embla-carousel-react";

// Import bike images from BikeShowcase
import bikeFull from "@/assets/bike-full.png";
import bikePanel from "@/assets/bike-panel.png";
import bikeHeadlight from "@/assets/bike-headlight.png";
import bikeWheel from "@/assets/bike-wheel.png";
import bikeChain from "@/assets/bike-chain.png";
import bikeBrakes from "@/assets/bike-brakes.png";
import bikeV8Front from "@/assets/bike-v8-front.png";
import bikeV8Side from "@/assets/bike-v8-side.png";

// Bike gallery images with details
const bikeGallery = [
  {
    image: bikeFull,
    title: "WJ V8 Prestige",
    subtitle: "Vista Completa",
    description: "Design urbano arrojado com acabamento premium",
  },
  {
    image: bikeV8Side,
    title: "Perfil Aerodinâmico",
    subtitle: "Vista Lateral",
    description: "Linhas fluidas que combinam velocidade e elegância",
  },
  {
    image: bikeV8Front,
    title: "Presença Imponente",
    subtitle: "Vista Frontal",
    description: "Faróis integrados e guidão ergonômico",
  },
  {
    image: bikePanel,
    title: "Smart Display LCD",
    subtitle: "Painel Digital",
    description: "GPS integrado, velocidade e autonomia em tempo real",
  },
  {
    image: bikeHeadlight,
    title: "LED Premium 1200lm",
    subtitle: "Faróis Inteligentes",
    description: "Iluminação automática com sensor de luz ambiente",
  },
  {
    image: bikeWheel,
    title: "Kenda Fat Tire 20x4.0",
    subtitle: "Rodas All-Terrain",
    description: "Máxima aderência em qualquer superfície",
  },
  {
    image: bikeChain,
    title: "Shimano 7-Speed",
    subtitle: "Transmissão Pro",
    description: "Sistema de marchas de alta performance",
  },
  {
    image: bikeBrakes,
    title: "Disco Hidráulico 180mm",
    subtitle: "Sistema de Freios",
    description: "Frenagem precisa com pastilhas cerâmicas",
  },
];

// Product specs from BikeShowcase
const bikeSpecs = [
  { label: "Velocidade Máx", value: "45 km/h" },
  { label: "Autonomia", value: "80 km" },
  { label: "Motor", value: "750W" },
  { label: "Bateria", value: "48V 15Ah" },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<BikeProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedEPass, setSelectedEPass] = useState<"basic" | "silver" | "black">("basic");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
  });

  const [thumbsRef, thumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi || !thumbsApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
    thumbsApi.scrollTo(emblaApi.selectedScrollSnap());
  }, [emblaApi, thumbsApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  useEffect(() => {
    const foundProduct = bikeProducts.find((p) => p.id === id);
    setProduct(foundProduct || null);
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
  const currentImage = bikeGallery[currentSlide];

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
        {/* Hero Section - Image Gallery */}
        <section className="relative min-h-screen">
          <div className="container-wj py-8">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left - Main Image Gallery */}
              <div className="lg:col-span-7 xl:col-span-8">
                {/* Main Carousel */}
                <div className="relative rounded-2xl overflow-hidden bg-card mb-4">
                  <div ref={emblaRef} className="overflow-hidden">
                    <div className="flex">
                      {bikeGallery.map((item, index) => (
                        <div
                          key={index}
                          className="flex-[0_0_100%] min-w-0 relative aspect-[4/3]"
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={scrollPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Current Image Info */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-6 left-6 right-6"
                    >
                      <span className="inline-block px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-wj-green bg-wj-green/10 rounded mb-2">
                        {currentImage.subtitle}
                      </span>
                      <h3 className="text-xl font-semibold text-foreground">
                        {currentImage.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentImage.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide Counter */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                    <span className="text-xs font-mono text-muted-foreground">
                      <span className="text-wj-green font-semibold">{String(currentSlide + 1).padStart(2, '0')}</span>
                      /{String(bikeGallery.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="relative">
                  <div ref={thumbsRef} className="overflow-hidden">
                    <div className="flex gap-2">
                      {bikeGallery.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => scrollTo(index)}
                          className={`flex-[0_0_80px] min-w-0 aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                            currentSlide === index
                              ? "ring-2 ring-wj-green ring-offset-2 ring-offset-background"
                              : "opacity-50 hover:opacity-80"
                          }`}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-4 gap-3 mt-8">
                  {bikeSpecs.map((spec) => (
                    <div
                      key={spec.label}
                      className="text-center p-4 rounded-xl bg-card border border-border"
                    >
                      <p className="text-lg font-semibold text-foreground">{spec.value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                        {spec.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Product Info & Config */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-28 space-y-6">
                  {/* Product Title */}
                  <div>
                    <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
                      {product.category}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {product.name}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {product.tagline}
                    </p>
                    <div className="flex items-baseline gap-3 mt-4">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Color: {product.colors[selectedColor].name}
                    </label>
                    <div className="flex gap-3">
                      {product.colors.map((color, index) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(index)}
                          className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      E-Pass Membership
                    </label>
                    <div className="space-y-2">
                      {(["basic", "silver", "black"] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setSelectedEPass(tier)}
                          className={`w-full p-3 rounded-xl border text-left transition-all duration-200 ${
                            selectedEPass === tier
                              ? "border-wj-green bg-wj-green/5"
                              : "border-border hover:border-wj-green/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground capitalize">
                                {tier === "basic" ? "Basic (Included)" : `E-Pass ${tier}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {tier === "basic" && "2-year warranty • E-ID included"}
                                {tier === "silver" && "5-year warranty • Priority service"}
                                {tier === "black" && "Lifetime warranty • VIP treatment"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {tier === "basic" ? "Free" : `+€${ePassPrices[tier]}/mo`}
                              </span>
                              {selectedEPass === tier && (
                                <Check className="h-4 w-4 text-wj-green" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Quantity
                    </label>
                    <div className="inline-flex items-center border border-border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2.5 hover:bg-secondary transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2.5 hover:bg-secondary transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="glass rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{product.name} × {quantity}</span>
                      <span className="text-foreground">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">E-Pass {selectedEPass}</span>
                      <span className="text-foreground">
                        {selectedEPass === "basic" ? "Included" : `+€${ePassPrices[selectedEPass]}/mo`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-wj-green">Free</span>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-foreground">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    asChild
                    size="lg"
                    className="w-full gradient-wj text-white hover:opacity-90"
                  >
                    <Link to="/checkout">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </Link>
                  </Button>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4 text-center pt-2">
                    <div>
                      <Truck className="h-5 w-5 mx-auto text-wj-green mb-1" />
                      <p className="text-[10px] text-muted-foreground">Free Shipping</p>
                    </div>
                    <div>
                      <Shield className="h-5 w-5 mx-auto text-wj-green mb-1" />
                      <p className="text-[10px] text-muted-foreground">2yr Warranty</p>
                    </div>
                    <div>
                      <Zap className="h-5 w-5 mx-auto text-wj-green mb-1" />
                      <p className="text-[10px] text-muted-foreground">Fast Delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding bg-card">
          <div className="container-wj">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Componentes Premium
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bikeGallery.slice(3).map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => {
                    scrollTo(index + 3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[9px] font-medium uppercase tracking-widest text-wj-green">
                      {item.subtitle}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground mt-1">
                      {item.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Specs */}
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
                  <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
                  <p className="text-sm text-muted-foreground capitalize">{key}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, SlidersHorizontal, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AccessoryCard from "@/components/AccessoryCard";
import { accessories, accessoryCategories, Accessory } from "@/data/accessories";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Accessories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredAccessories, setFilteredAccessories] = useState<Accessory[]>(accessories);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Calculate min and max prices
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = accessories.map(a => a.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, []);

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  // Get featured accessory
  const featuredAccessory = accessories.find(a => a.isFeatured) || accessories[0];

  // Read URL params on mount
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && accessoryCategories.some(c => c.id === category)) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

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

  useEffect(() => {
    let products = accessories;
    
    // Filter by category
    if (selectedCategory !== "all") {
      products = products.filter((product) => product.category === selectedCategory);
    }
    
    // Filter by price range
    products = products.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    setFilteredAccessories(products);
  }, [selectedCategory, priceRange]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", categoryId);
    }
    setSearchParams(newParams);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  const resetFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedCategory("all");
    setIsFilterOpen(false);
  };

  const hasActiveFilters = priceRange[0] !== minPrice || priceRange[1] !== maxPrice;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isScrolled={isScrolled} />
      
      <main className="pt-24 md:pt-28">
        {/* Featured Accessory Hero */}
        <section className="container-wj py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-border/30 p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              {/* Image Left */}
              <div className="relative aspect-square flex items-center justify-center border-r-0 md:border-r border-border/20 md:pr-12">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  {/* Subtle Background */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-5"
                    style={{ backgroundColor: featuredAccessory.colors[0].hex }}
                  />
                  
                  {/* Accessory Visual */}
                  <Shield 
                    className="w-32 h-32 md:w-48 md:h-48"
                    style={{ color: featuredAccessory.colors[0].hex }}
                  />
                </motion.div>
              </div>

              {/* Content Right */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em]">
                      Featured
                    </p>
                    <h1 className="text-3xl md:text-4xl font-light text-foreground">
                      {featuredAccessory.name}
                    </h1>
                    <p className="text-muted-foreground font-light">
                      {featuredAccessory.tagline}
                    </p>
                  </div>

                  {/* Minimal Features */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground/70">
                    {featuredAccessory.features.slice(0, 3).map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center gap-8 pt-4">
                    <span className="text-2xl font-light text-foreground">
                      €{featuredAccessory.price}
                    </span>
                    <Button 
                      variant="outline" 
                      className="border-border/50 text-foreground hover:bg-wj-green hover:text-white hover:border-wj-green transition-all duration-300"
                    >
                      Add to Cart
                    </Button>
                  </div>

                  {/* Color Options */}
                  <div className="flex items-center gap-3 pt-2">
                    {featuredAccessory.colors.map((color) => (
                      <div
                        key={color.name}
                        className="w-5 h-5 rounded-full border border-border/30"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="container-wj">
          <div className="h-px bg-border/20" />
        </div>

        {/* Header & Filters */}
        <section className="container-wj py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
          >
            <div>
              <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
                The Collection
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                All Accessories
              </h2>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {accessoryCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "gradient-wj text-white"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 border-border/50 transition-all duration-300 ${
                      hasActiveFilters 
                        ? "border-wj-green text-wj-green" 
                        : "text-foreground hover:border-foreground/50"
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-wj-green" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[320px] sm:w-[400px] bg-background border-border/50">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="text-foreground font-light text-xl">
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="space-y-8">
                    {/* Price Range */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          Price Range
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                        </p>
                      </div>
                      
                      <Slider
                        value={priceRange}
                        onValueChange={handlePriceChange}
                        min={minPrice}
                        max={maxPrice}
                        step={5}
                        className="w-full"
                      />

                      <div className="flex justify-between text-xs text-muted-foreground/60">
                        <span>{formatPrice(minPrice)}</span>
                        <span>{formatPrice(maxPrice)}</span>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                        Quick Presets
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPriceRange([minPrice, 50])}
                          className={`p-3 rounded-xl border text-sm transition-all duration-200 ${
                            priceRange[0] === minPrice && priceRange[1] === 50
                              ? "border-wj-green bg-wj-green/10 text-wj-green"
                              : "border-border/30 text-muted-foreground hover:border-border/60"
                          }`}
                        >
                          Under €50
                        </button>
                        <button
                          onClick={() => setPriceRange([50, 100])}
                          className={`p-3 rounded-xl border text-sm transition-all duration-200 ${
                            priceRange[0] === 50 && priceRange[1] === 100
                              ? "border-wj-green bg-wj-green/10 text-wj-green"
                              : "border-border/30 text-muted-foreground hover:border-border/60"
                          }`}
                        >
                          €50 - €100
                        </button>
                        <button
                          onClick={() => setPriceRange([100, 150])}
                          className={`p-3 rounded-xl border text-sm transition-all duration-200 ${
                            priceRange[0] === 100 && priceRange[1] === 150
                              ? "border-wj-green bg-wj-green/10 text-wj-green"
                              : "border-border/30 text-muted-foreground hover:border-border/60"
                          }`}
                        >
                          €100 - €150
                        </button>
                        <button
                          onClick={() => setPriceRange([minPrice, maxPrice])}
                          className={`p-3 rounded-xl border text-sm transition-all duration-200 ${
                            priceRange[0] === minPrice && priceRange[1] === maxPrice
                              ? "border-wj-green bg-wj-green/10 text-wj-green"
                              : "border-border/30 text-muted-foreground hover:border-border/60"
                          }`}
                        >
                          All Prices
                        </button>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="pt-4 border-t border-border/20">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="text-foreground font-medium">{filteredAccessories.length}</span> of {accessories.length} accessories
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="flex-1 border-border/50 text-foreground hover:bg-muted/20"
                      >
                        Reset All
                      </Button>
                      <Button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 gradient-wj text-white hover:opacity-90"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </motion.div>

          {/* Active Filters Display */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 mb-6"
              >
                <span className="text-xs text-muted-foreground">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-wj-green/10 text-wj-green border border-wj-green/20 hover:bg-wj-green/20 transition-colors"
                  >
                    {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Products Grid */}
        <section className="container-wj pb-20">
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredAccessories.map((accessory, index) => (
                <AccessoryCard key={accessory.id} accessory={accessory} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredAccessories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground mb-4">
                No accessories found with the current filters.
              </p>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-border/50 text-foreground hover:bg-muted/20"
              >
                Reset Filters
              </Button>
            </motion.div>
          )}
        </section>

        {/* CTA Section */}
        <section className="container-wj pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-wj-green transition-colors duration-200"
            >
              View Our E-Bikes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Accessories;

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AccessoryCard from "@/components/AccessoryCard";
import { accessories, accessoryCategories, Accessory } from "@/data/accessories";
import { Button } from "@/components/ui/button";

const Accessories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredAccessories, setFilteredAccessories] = useState<Accessory[]>(accessories);
  const [isScrolled, setIsScrolled] = useState(false);

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
    
    setFilteredAccessories(products);
  }, [selectedCategory]);

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
            className="relative"
          >
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              {/* Image Left */}
              <div className="relative aspect-square flex items-center justify-center">
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
          </motion.div>
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
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No accessories found in this category.
              </p>
            </div>
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

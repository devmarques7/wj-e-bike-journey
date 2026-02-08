import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag, Shield, Zap } from "lucide-react";
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
        <section className="container-wj py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-br from-card to-muted border border-border/50 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Image Left */}
              <div className="relative aspect-square md:aspect-auto md:h-[500px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center p-12">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative"
                >
                  {/* Featured Badge */}
                  <div className="absolute -top-4 -left-4 z-10">
                    <span className="px-4 py-2 text-xs font-bold uppercase tracking-wider gradient-wj text-white rounded-full">
                      Featured
                    </span>
                  </div>
                  
                  {/* Accessory Visual */}
                  <div 
                    className="w-48 h-48 md:w-64 md:h-64 rounded-3xl flex items-center justify-center"
                    style={{ backgroundColor: `${featuredAccessory.colors[0].hex}10` }}
                  >
                    <Shield 
                      className="w-24 h-24 md:w-32 md:h-32"
                      style={{ color: featuredAccessory.colors[0].hex }}
                    />
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-8 -right-8 w-16 h-16 rounded-2xl bg-wj-green/10 flex items-center justify-center"
                  >
                    <Zap className="w-8 h-8 text-wj-green" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Content Right */}
              <div className="p-8 md:p-12 md:pr-16">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-4">
                    {featuredAccessory.category}
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                    {featuredAccessory.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-6">
                    {featuredAccessory.tagline}. {featuredAccessory.features.slice(0, 2).join(", ")}, and more.
                  </p>

                  {/* Features List */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {featuredAccessory.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-wj-green" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-3xl font-bold text-foreground">
                        €{featuredAccessory.price}
                      </span>
                      {featuredAccessory.originalPrice && (
                        <span className="ml-2 text-lg text-muted-foreground line-through">
                          €{featuredAccessory.originalPrice}
                        </span>
                      )}
                    </div>
                    <Button className="gradient-wj text-white hover:opacity-90 px-6">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>

                  {/* Color Options */}
                  <div className="flex items-center gap-4 mt-6">
                    <span className="text-xs text-muted-foreground">Available in:</span>
                    <div className="flex gap-2">
                      {featuredAccessory.colors.map((color) => (
                        <div
                          key={color.name}
                          className="w-6 h-6 rounded-full border-2 border-border/50"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

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

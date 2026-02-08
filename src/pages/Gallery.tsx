import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { bikeProducts, categories, BikeProduct } from "@/data/products";

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState<BikeProduct[]>(bikeProducts);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAiBanner, setShowAiBanner] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    const category = searchParams.get("category");
    const query = searchParams.get("q");
    
    if (category && categories.some(c => c.id === category)) {
      setSelectedCategory(category);
    }
    
    if (query) {
      setSearchQuery(query);
      setShowAiBanner(true);
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
    let products = bikeProducts;
    
    // Filter by category
    if (selectedCategory !== "all") {
      products = products.filter((product) => product.category === selectedCategory);
    }
    
    // Filter by search keywords
    if (searchQuery) {
      const keywords = searchQuery.toLowerCase().split(" ");
      products = products.filter((product) => {
        const searchableText = `${product.name} ${product.tagline} ${product.features.join(" ")} ${product.category}`.toLowerCase();
        return keywords.some(keyword => searchableText.includes(keyword));
      });
    }
    
    setFilteredProducts(products);
  }, [selectedCategory, searchQuery]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", categoryId);
    }
    setSearchParams(newParams);
  };

  const clearAiSearch = () => {
    setSearchQuery("");
    setShowAiBanner(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isScrolled={isScrolled} />
      
      <main className="pt-24 md:pt-28">
        {/* Hero Header */}
        <section className="container-wj py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-4">
              The Collection
            </p>
            <h1 className="text-display-sm md:text-display-md font-bold text-foreground mb-4">
              The Gallery
            </h1>
            <p className="text-muted-foreground">
              Discover our complete range of premium e-bikes. Each model is
              engineered in the Netherlands for the ultimate urban mobility
              experience.
            </p>
          </motion.div>

          {/* AI Search Banner */}
          <AnimatePresence>
            {showAiBanner && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 flex items-center justify-center"
              >
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full glass border border-wj-green/30">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-wj-green" />
                    <Sparkles className="w-3 h-3 text-wj-green" />
                  </div>
                  <span className="text-sm text-foreground/80">
                    E-IA encontrou resultados para: <span className="text-wj-green font-medium">"{searchQuery}"</span>
                  </span>
                  <button
                    onClick={clearAiSearch}
                    className="p-1 rounded-full hover:bg-foreground/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mt-10"
          >
            {categories.map((category) => (
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
          </motion.div>
        </section>

        {/* Products Grid */}
        <section className="container-wj pb-20">
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No products found in this category.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;

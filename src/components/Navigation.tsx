import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, User, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bikeProducts } from "@/data/products";

const navLinks = [
  { name: "Products", href: "/gallery", description: "Explore our e-bikes" },
  { name: "Store", href: "#store", description: "Find us near you" },
  { name: "About", href: "#about", description: "Our story" },
  { name: "Support", href: "#support", description: "Get help" },
];

const languages = [
  { code: "en", name: "English" },
  { code: "nl", name: "Nederlands" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
];

// Get top 3 bestseller/new bikes
const featuredBikes = bikeProducts.slice(0, 3);

interface NavigationProps {
  isScrolled?: boolean;
}

const Navigation = ({ isScrolled = false }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const menuVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
  };

  const cardVariants = {
    closed: { opacity: 0, y: 20, scale: 0.95 },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    }),
  };

  return (
    <>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMenuOpen
            ? "bg-background/60 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <nav className="container-wj">
          <div className="flex h-14 items-center justify-between">
            {/* Left - Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground/80 hover:text-wj-green hover:bg-transparent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* Center - Logo */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2">
              <span className="text-lg font-bold tracking-wider">
                <span className="text-foreground">WJ</span>
                <span className="text-wj-green"> VISION</span>
              </span>
            </Link>

            {/* Right - Icons */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/80 hover:text-wj-green hover:bg-transparent"
              >
                <ShoppingBag className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/80 hover:text-wj-green hover:bg-transparent"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-md bg-background/95 backdrop-blur-xl border-r border-border/50 flex flex-col"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <span className="text-lg font-bold tracking-wider">
                  <span className="text-foreground">WJ</span>
                  <span className="text-wj-green"> VISION</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground/80 hover:text-wj-green hover:bg-transparent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Featured Bikes */}
                <div className="p-4">
                  <motion.p
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    custom={0}
                    className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider"
                  >
                    Featured Bikes
                  </motion.p>
                  <div className="grid grid-cols-3 gap-3">
                    {featuredBikes.map((bike, index) => (
                      <motion.div
                        key={bike.id}
                        variants={cardVariants}
                        initial="closed"
                        animate="open"
                        custom={index}
                      >
                        <Link
                          to={`/product/${bike.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="group block"
                        >
                          <div className="relative aspect-square rounded-lg bg-gradient-to-br from-muted/50 to-muted overflow-hidden border border-border/30 transition-all duration-300 group-hover:border-wj-green/50 group-hover:shadow-lg group-hover:shadow-wj-green/10">
                            <img
                              src={bike.image}
                              alt={bike.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {bike.isNew && (
                              <span className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-wj-green text-white">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs font-medium text-foreground/80 group-hover:text-wj-green transition-colors truncate">
                            {bike.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            €{bike.price.toLocaleString()}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="p-4 pt-2">
                  <motion.p
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    custom={1}
                    className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider"
                  >
                    Navigation
                  </motion.p>
                  <nav className="space-y-1">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.name}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        custom={index + 2}
                      >
                        <a
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="group flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-all duration-200"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-wj-green transition-colors">
                              {link.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {link.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-wj-green group-hover:translate-x-1 transition-all" />
                        </a>
                      </motion.div>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Menu Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="p-4 border-t border-border/30 space-y-3"
              >
                {/* Language Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs">Language</span>
                  </div>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="text-xs bg-muted/50 border border-border/50 rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-wj-green"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Button */}
                <Button
                  className="w-full bg-wj-green hover:bg-wj-green-dark text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  My Account
                </Button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;

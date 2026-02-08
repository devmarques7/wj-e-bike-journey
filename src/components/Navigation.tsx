import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bikeProducts } from "@/data/products";
import { useCart, CartBadge } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";

const navLinks = [
  { 
    name: "Products", 
    href: "/gallery",
    subItems: [
      { name: "E-Bikes", href: "/gallery" },
      { name: "Accessories", href: "/accessories" },
      { name: "Member Plans", href: "/membership-plans" },
    ]
  },
  { 
    name: "Store", 
    href: "/find-store",
    subItems: [
      { name: "Find a Store", href: "/find-store" },
      { name: "Book Test Ride", href: "/book-test-ride" },
    ]
  },
  { 
    name: "About", 
    href: "/our-story",
    subItems: [
      { name: "Our Story", href: "/our-story" },
      { name: "Career", href: "/career" },
    ]
  },
  { 
    name: "Support", 
    href: "/help",
    subItems: [
      { name: "Find Help", href: "/help" },
      { name: "Delivery", href: "/delivery" },
      { name: "Returns", href: "/returns" },
    ]
  },
];
const languages = [
  { code: "EN", name: "English" },
  { code: "NL", name: "Nederlands" },
  { code: "DE", name: "Deutsch" },
  { code: "FR", name: "Français" },
];

// Get top 3 bestseller/new bikes
const featuredBikes = bikeProducts.slice(0, 3);

interface NavigationProps {
  isScrolled?: boolean;
}

const Navigation = ({ isScrolled = false }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const { totalItems, isAnimating } = useCart();

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const contentVariants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
        opacity: { duration: 0.2 },
      },
    },
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
        opacity: { duration: 0.3, delay: 0.1 },
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1 + i * 0.05,
        duration: 0.3,
      },
    }),
  };

  const cardVariants = {
    closed: { opacity: 0, scale: 0.9 },
    open: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.15 + i * 0.08,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    }),
  };

  return (
    <>
      {/* Header Container */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`w-full md:w-[40%] transition-all duration-500 border border-border/50 overflow-hidden pointer-events-auto ${
            isMenuOpen
              ? "rounded-2xl bg-background/80 backdrop-blur-2xl"
              : "rounded-full bg-background/40 backdrop-blur-xl"
          } ${isScrolled && !isMenuOpen ? "bg-background/60" : ""}`}
        >
          {/* Header Bar */}
          <nav className="px-4">
            <div className="flex h-12 items-center justify-between relative">
              {/* Left - Hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/80 hover:text-wj-green hover:bg-transparent z-10"
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
              <div className="flex items-center space-x-1 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-foreground/80 hover:text-wj-green hover:bg-transparent"
                  onClick={() => setIsCartOpen(true)}
                >
                  <motion.div
                    animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </motion.div>
                  <CartBadge count={totalItems} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground/80 hover:text-wj-green hover:bg-transparent"
                  asChild
                >
                  <Link to="/auth">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </nav>

          {/* Expandable Menu Content */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                variants={contentVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-4 border-t border-border/20">
                  {/* Featured Bikes */}
                  <motion.p
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    custom={0}
                    className="text-[10px] font-medium text-muted-foreground/60 mb-3 uppercase tracking-[0.2em]"
                  >
                    Featured
                  </motion.p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
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
                          <div className="relative aspect-square rounded-xl bg-muted/30 overflow-hidden border border-border/20 transition-all duration-500 group-hover:border-wj-green/30 group-hover:bg-muted/50">
                            <img
                              src={bike.image}
                              alt={bike.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {bike.isNew && (
                              <span className="absolute top-1.5 right-1.5 text-[7px] font-semibold px-1.5 py-0.5 rounded-full bg-wj-green/90 text-white">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-[11px] font-medium text-foreground/70 group-hover:text-wj-green transition-colors duration-300">
                            {bike.name}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation Links - Large Text with Collapsible Sub-items */}
                  <nav className="space-y-1 mb-6">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.name}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        custom={index + 1}
                      >
                        <button
                          onClick={() => setExpandedNav(expandedNav === link.name ? null : link.name)}
                          className="group flex items-center justify-between w-full py-2"
                        >
                          <span className="text-2xl font-light text-foreground/80 transition-all duration-300 group-hover:text-wj-green group-hover:tracking-wider">
                            {link.name}
                          </span>
                          <ChevronDown 
                            className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-300 ${
                              expandedNav === link.name ? 'rotate-180 text-wj-green' : ''
                            }`} 
                          />
                        </button>
                        
                        <AnimatePresence>
                          {expandedNav === link.name && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 pb-2 pt-1 space-y-1 border-l border-border/30 ml-1">
                                {link.subItems.map((subItem, subIndex) => (
                                  <motion.div
                                    key={subItem.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIndex * 0.05, duration: 0.2 }}
                                  >
                                    <Link
                                      to={subItem.href}
                                      onClick={() => setIsMenuOpen(false)}
                                      className="block py-1.5 text-sm text-muted-foreground hover:text-wj-green transition-colors duration-200"
                                    >
                                      {subItem.name}
                                    </Link>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Footer - Language & Account */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="pt-4 border-t border-border/20 flex items-center justify-between"
                  >
                    {/* Language Dropdown */}
                    <div ref={langRef} className="relative">
                      <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <span className="text-sm">{selectedLanguage}</span>
                        <ChevronDown 
                          className={`h-3 w-3 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isLangOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 py-1 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl min-w-[80px] overflow-hidden z-50"
                          >
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setSelectedLanguage(lang.code);
                                  setIsLangOpen(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs transition-colors duration-150 ${
                                  selectedLanguage === lang.code
                                    ? "text-wj-green bg-wj-green/10"
                                    : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                                }`}
                              >
                                {lang.code}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Account Button - Minimalist */}
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 group"
                    >
                      <span className="group-hover:tracking-wide transition-all duration-200">Account</span>
                      <div className="w-6 h-6 rounded-full border border-border/50 flex items-center justify-center group-hover:border-foreground/30 transition-colors duration-200">
                        <User className="h-3 w-3" />
                      </div>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navigation;

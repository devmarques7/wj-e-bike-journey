import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
const navLinks = [{
  name: "E-Bikes",
  href: "/gallery"
}, {
  name: "E-Pass",
  href: "#epass"
}, {
  name: "E-ID",
  href: "#eid"
}, {
  name: "About",
  href: "#about"
}];
interface NavigationProps {
  isScrolled?: boolean;
}
const Navigation = ({
  isScrolled = false
}: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return <motion.header initial={{
    y: -100,
    opacity: 0
  }} animate={{
    y: 0,
    opacity: 1
  }} transition={{
    duration: 0.6,
    delay: 0.2
  }} className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : "bg-transparent"}`}>
      <nav className="container-wj">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl font-bold tracking-wider">
              <span className="text-foreground">WJ</span>
              <span className="text-wj-green"> VISION</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => <a key={link.name} href={link.href} className="text-sm font-medium text-foreground/80 hover:text-wj-green transition-colors duration-200">
                {link.name}
              </a>)}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-wj-green">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-wj-green">
              <ShoppingBag className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* CTA Button - Desktop */}
            <Button className="hidden md:inline-flex glass text-foreground border-wj-green/30 hover:bg-wj-green hover:text-white transition-all duration-300" variant="outline">
              Configure Yours
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div initial={false} animate={{
        height: isMobileMenuOpen ? "auto" : 0,
        opacity: isMobileMenuOpen ? 1 : 0
      }} transition={{
        duration: 0.3
      }} className="md:hidden overflow-hidden">
          <div className="py-4 space-y-4 border-t border-border">
            {navLinks.map(link => <a key={link.name} href={link.href} className="block px-2 py-2 text-foreground/80 hover:text-wj-green transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                {link.name}
              </a>)}
            <Button className="w-full gradient-wj text-white">
              Configure Yours
            </Button>
          </div>
        </motion.div>
      </nav>
    </motion.header>;
};
export default Navigation;
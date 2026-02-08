import { motion } from "framer-motion";
import { ArrowUp, Users } from "lucide-react";
import { Button } from "./ui/button";

const footerLinks = [
  { name: "E-Bikes", href: "/gallery" },
  { name: "E-Pass", href: "#epass" },
  { name: "Support", href: "#" },
  { name: "About", href: "#about" },
];

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative min-h-[400px] overflow-hidden">
      {/* Video Background - Rotated 180deg */}
      <div className="absolute inset-0 rotate-180">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/footer-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-wj py-16 flex flex-col items-center justify-center min-h-[400px]">
        {/* Scroll to Top Button */}
        <motion.button
          onClick={scrollToTop}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-8 right-8 w-12 h-12 rounded-full bg-wj-green/20 backdrop-blur-sm border border-wj-green/30 flex items-center justify-center text-wj-green hover:bg-wj-green/30 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-3xl md:text-4xl font-bold tracking-wider">
            <span className="text-foreground">WJ</span>
            <span className="text-wj-green"> VISION</span>
          </span>
        </motion.div>

        {/* CTA - Join Community */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <Button
            size="lg"
            className="bg-wj-green hover:bg-wj-green/90 text-background gap-2 px-8 rounded-full"
          >
            <Users className="h-5 w-5" />
            Join Our Community
          </Button>
        </motion.div>

        {/* Minimal Links */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 mb-10"
        >
          {footerLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-wj-green transition-colors"
            >
              {link.name}
            </a>
          ))}
        </motion.nav>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row items-center gap-4 text-xs text-muted-foreground/60"
        >
          <span>© 2024 WJ Vision</span>
          <span className="hidden md:block">•</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

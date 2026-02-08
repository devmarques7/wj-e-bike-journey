import { motion } from "framer-motion";
import { ArrowUp, Users, Mail, Phone, MapPin, Instagram, Linkedin, Twitter } from "lucide-react";
import { Button } from "./ui/button";

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative min-h-[420px] overflow-hidden">
      {/* Video Background - Rotated 180deg */}
      <div className="absolute inset-0 rotate-180">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        >
          <source src="/videos/footer-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-wj py-12 min-h-[420px] flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          {/* Left - Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-2xl font-bold tracking-wider">
              <span className="text-foreground">WJ</span>
              <span className="text-wj-green"> VISION</span>
            </span>
            <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
              Dutch engineering.<br />Elevated mobility.
            </p>
          </motion.div>

          {/* Right - Scroll to Top */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-full bg-wj-green/20 backdrop-blur-sm border border-wj-green/30 flex items-center justify-center text-wj-green hover:bg-wj-green/30 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Middle Section - Right Aligned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-end text-right gap-6"
        >
          {/* CTA */}
          <Button
            size="lg"
            className="bg-wj-green hover:bg-wj-green/90 text-background gap-2 px-8 rounded-full"
          >
            <Users className="h-5 w-5" />
            Join Our Community
          </Button>

          {/* Contact Info */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="mailto:info@wjvision.nl" className="flex items-center justify-end gap-2 hover:text-wj-green transition-colors">
              <span>info@wjvision.nl</span>
              <Mail className="h-4 w-4" />
            </a>
            <a href="tel:+31201234567" className="flex items-center justify-end gap-2 hover:text-wj-green transition-colors">
              <span>+31 20 123 4567</span>
              <Phone className="h-4 w-4" />
            </a>
            <div className="flex items-center justify-end gap-2">
              <span>Amsterdam, Netherlands</span>
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground/60 mt-1">
              <span>KVK: 12345678</span>
              <span>•</span>
              <span>BTW: NL123456789B01</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.15 }}
                className="w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-wj-green hover:border-wj-green/50 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/30"
        >
          <span className="text-xs text-muted-foreground/60">
            © 2024 WJ Vision. All rights reserved.
          </span>
          <div className="flex gap-6 text-xs text-muted-foreground/60">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

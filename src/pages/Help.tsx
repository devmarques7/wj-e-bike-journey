import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ChevronDown, Search, MessageCircle, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      { q: "How long does delivery take?", a: "Standard delivery takes 5-7 business days within Europe. Express delivery is available for 2-3 business days." },
      { q: "Can I track my order?", a: "Yes, you'll receive a tracking number via email once your order ships." },
      { q: "Do you ship internationally?", a: "Currently we ship to all EU countries, UK, Switzerland, and Norway." },
    ],
  },
  {
    category: "Product & Warranty",
    items: [
      { q: "What warranty do you offer?", a: "All our e-bikes come with a 2-year warranty on the frame and components, and 1 year on the battery." },
      { q: "Can I test ride before buying?", a: "Absolutely! Visit any of our stores to book a free test ride." },
      { q: "What's included with my e-bike?", a: "Each bike comes with a charger, toolkit, user manual, and your choice of accessories bundle." },
    ],
  },
  {
    category: "Service & Repairs",
    items: [
      { q: "How do I service my e-bike?", a: "We recommend a service check every 6 months. Book online or visit your nearest store." },
      { q: "What if something breaks?", a: "Contact our support team and we'll arrange a repair or replacement under warranty." },
    ],
  },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-3xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Support
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers or get in touch with our team.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-muted/20 border-border/30 focus:border-wj-green/50 rounded-xl"
              />
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16 space-y-8"
          >
            {faqs.map((category, catIndex) => (
              <div key={category.category}>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  {category.category}
                </h2>
                <div className="space-y-2">
                  {category.items.map((faq, faqIndex) => {
                    const faqId = `${catIndex}-${faqIndex}`;
                    return (
                      <motion.div
                        key={faqId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + faqIndex * 0.05 }}
                        className="border border-border/20 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faqId ? null : faqId)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
                        >
                          <span className="text-sm text-foreground">{faq.q}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                              expandedFaq === faqId ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {expandedFaq === faqId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-4 text-sm text-muted-foreground">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">
              Still need help?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: MessageCircle, label: "Live Chat", desc: "Available 9-18 CET" },
                { icon: Mail, label: "Email Us", desc: "support@wjvision.com" },
                { icon: Phone, label: "Call Us", desc: "+31 20 123 4567" },
              ].map((contact, index) => (
                <button
                  key={contact.label}
                  className="p-5 rounded-2xl border border-border/20 bg-muted/10 hover:border-wj-green/30 transition-all duration-300 text-center group"
                >
                  <contact.icon className="h-5 w-5 mx-auto mb-3 text-muted-foreground group-hover:text-wj-green transition-colors" />
                  <p className="text-sm font-medium text-foreground mb-1">{contact.label}</p>
                  <p className="text-xs text-muted-foreground">{contact.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;

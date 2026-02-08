import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const accessories = [
  {
    id: "helmet-pro",
    name: "Vision Helmet Pro",
    description: "Aerodynamic design with integrated lights",
    price: 149,
    image: "/placeholder.svg",
  },
  {
    id: "lock-smart",
    name: "Smart Lock X",
    description: "App-controlled security system",
    price: 89,
    image: "/placeholder.svg",
  },
  {
    id: "bag-commuter",
    name: "Commuter Bag",
    description: "Waterproof panniers for daily use",
    price: 129,
    image: "/placeholder.svg",
  },
  {
    id: "light-set",
    name: "Vision Light Set",
    description: "Front and rear LED lights",
    price: 69,
    image: "/placeholder.svg",
  },
  {
    id: "phone-mount",
    name: "Phone Mount Pro",
    description: "Secure magnetic mounting system",
    price: 49,
    image: "/placeholder.svg",
  },
  {
    id: "fenders",
    name: "Premium Fenders",
    description: "Full coverage protection",
    price: 79,
    image: "/placeholder.svg",
  },
];

const Accessories = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Accessories
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Complete Your Ride
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Premium accessories designed to enhance your cycling experience.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessories.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="aspect-square bg-muted/30 rounded-2xl overflow-hidden mb-4 border border-border/20 transition-all duration-500 group-hover:border-wj-green/30">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {item.description}
                </p>
                <p className="text-wj-green font-medium">€{item.price}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-20 text-center"
          >
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-wj-green transition-colors duration-200"
            >
              View E-Bikes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Accessories;

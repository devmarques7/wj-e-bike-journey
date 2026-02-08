import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Truck, Package, Clock, MapPin } from "lucide-react";

const deliveryOptions = [
  {
    icon: Package,
    title: "Standard Delivery",
    time: "5-7 business days",
    price: "Free",
    description: "Free delivery on all e-bike orders within Europe.",
  },
  {
    icon: Truck,
    title: "Express Delivery",
    time: "2-3 business days",
    price: "€49",
    description: "Priority handling and faster shipping for urgent orders.",
  },
  {
    icon: MapPin,
    title: "Store Pickup",
    time: "Same day",
    price: "Free",
    description: "Pick up your order at your nearest WJ Vision store.",
  },
];

const countries = [
  { region: "Benelux", countries: ["Netherlands", "Belgium", "Luxembourg"] },
  { region: "Central Europe", countries: ["Germany", "Austria", "Switzerland"] },
  { region: "Western Europe", countries: ["France", "United Kingdom", "Ireland"] },
  { region: "Southern Europe", countries: ["Spain", "Portugal", "Italy"] },
  { region: "Northern Europe", countries: ["Denmark", "Sweden", "Norway", "Finland"] },
];

const Delivery = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Support
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Delivery Information
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              We deliver your e-bike safely to your doorstep, fully assembled and ready to ride.
            </p>
          </motion.div>

          {/* Delivery Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-xl font-light text-foreground mb-8">Delivery Options</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {deliveryOptions.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="p-6 rounded-2xl border border-border/20 bg-muted/10"
                >
                  <option.icon className="h-6 w-6 text-wj-green mb-4" />
                  <h3 className="text-base font-medium text-foreground mb-1">{option.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="h-3 w-3" />
                    {option.time}
                    <span className="text-wj-green font-medium ml-auto">{option.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Shipping Zones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-xl font-light text-foreground mb-8">Shipping Zones</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {countries.map((zone, index) => (
                <motion.div
                  key={zone.region}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <h3 className="text-sm font-medium text-foreground mb-3">{zone.region}</h3>
                  <ul className="space-y-1">
                    {zone.countries.map((country) => (
                      <li key={country} className="text-sm text-muted-foreground">
                        {country}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="p-6 rounded-2xl border border-wj-green/20 bg-wj-green/5"
          >
            <h3 className="text-base font-medium text-foreground mb-2">
              White Glove Delivery
            </h3>
            <p className="text-sm text-muted-foreground">
              All our e-bikes are delivered by trained specialists who will unbox, 
              assemble, and demonstrate your new bike. We'll also take away all 
              packaging materials for recycling.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Delivery;

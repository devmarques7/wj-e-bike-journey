import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Wrench, MapPin, Tag } from "lucide-react";

const actions = [
  {
    icon: Calendar,
    title: "Book a Test Ride",
    description: "Experience the future of mobility in person",
    cta: "Schedule Now",
    color: "from-wj-green/20 to-wj-green/5",
  },
  {
    icon: Wrench,
    title: "Accessories",
    description: "Premium add-ons for your journey",
    cta: "Browse Collection",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: MapPin,
    title: "Find a Store",
    description: "Visit our experience centers",
    cta: "Locate Nearby",
    color: "from-purple-500/20 to-purple-500/5",
  },
  {
    icon: Tag,
    title: "Current Deals",
    description: "Limited time offers on select models",
    cta: "View Offers",
    color: "from-orange-500/20 to-orange-500/5",
  },
];

const QuickActionsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="section-padding bg-card" ref={containerRef}>
      <div className="container-wj">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-display-sm md:text-display-md font-bold text-foreground">
            Start Your Journey
          </h2>
        </motion.div>

        {/* Actions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative cursor-pointer"
            >
              <div className={`h-full rounded-2xl p-6 bg-gradient-to-br ${action.color} border border-border hover:border-wj-green/30 transition-all duration-300`}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-4 group-hover:bg-wj-green/20 transition-colors duration-300">
                  <action.icon className="h-6 w-6 text-foreground group-hover:text-wj-green transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {action.description}
                </p>

                {/* CTA */}
                <span className="text-sm font-medium text-wj-green group-hover:underline">
                  {action.cta} →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActionsSection;

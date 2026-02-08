import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Bike, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ActionCardProps {
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  backgroundImage: string;
  icon: React.ElementType;
  className?: string;
  index: number;
  isInView: boolean;
}

const ActionCard = ({ 
  title, 
  subtitle, 
  cta, 
  ctaLink, 
  backgroundImage, 
  icon: Icon,
  className = "",
  index,
  isInView
}: ActionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className={`group relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-wj-green/20 backdrop-blur-sm border border-wj-green/30 flex items-center justify-center mb-4">
          <Icon className="h-5 w-5 text-wj-green" />
        </div>

        {/* Text */}
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xs">
          {subtitle}
        </p>

        {/* CTA Button */}
        <Link to={ctaLink}>
          <Button 
            variant="outline" 
            className="group/btn border-wj-green/50 text-foreground hover:bg-wj-green hover:text-white hover:border-wj-green transition-all duration-300"
          >
            {cta}
            <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </div>

      {/* Gradient Border Effect */}
      <div className="absolute inset-0 rounded-2xl border border-border/30 group-hover:border-wj-green/30 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
};

const QuickActionsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const actions = [
    {
      title: "Explore Our Bikes",
      subtitle: "Discover the future of urban mobility with our premium electric bikes",
      cta: "View Collection",
      ctaLink: "/gallery",
      backgroundImage: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
      icon: Bike,
    },
    {
      title: "Find a Store",
      subtitle: "Visit our experience centers near you",
      cta: "Locate Nearby",
      ctaLink: "/stores",
      backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      icon: MapPin,
    },
    {
      title: "Book a Test Ride",
      subtitle: "Experience the thrill of electric riding firsthand",
      cta: "Schedule Now",
      ctaLink: "/test-ride",
      backgroundImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      icon: Calendar,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background relative" ref={containerRef}>
      {/* Top Gradient Border - connects with previous section */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wj-green/50 to-transparent" />
      
      {/* Container - 75% width centered */}
      <div className="mx-auto w-[90%] md:w-[85%] lg:w-[75%]">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-3">
            Start Your Journey
          </p>
          <h2 className="text-display-sm md:text-display-md font-bold text-foreground">
            Take the Next Step
          </h2>
        </motion.div>

        {/* Grid Layout - Left full height, Right stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left - Full Height Card */}
          <ActionCard
            {...actions[0]}
            index={0}
            isInView={isInView}
            className="min-h-[300px] lg:min-h-[500px] lg:row-span-2"
          />

          {/* Right Column - Two Stacked Cards */}
          <div className="flex flex-col gap-4 md:gap-6">
            <ActionCard
              {...actions[1]}
              index={1}
              isInView={isInView}
              className="min-h-[200px] lg:min-h-[240px]"
            />
            <ActionCard
              {...actions[2]}
              index={2}
              isInView={isInView}
              className="min-h-[200px] lg:min-h-[240px]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wj-green/50 to-transparent" />
    </section>
  );
};

export default QuickActionsSection;

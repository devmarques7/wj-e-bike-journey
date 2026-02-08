import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Wrench, Settings, Battery, Cog } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
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

const ServiceCard = ({ 
  title, 
  subtitle, 
  cta, 
  ctaLink, 
  backgroundImage, 
  icon: Icon,
  className = "",
  index,
  isInView
}: ServiceCardProps) => {
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

export default function ServiceActionsGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const services = [
    {
      title: "Full Bike Service",
      subtitle: "Complete inspection, adjustment, and maintenance for peak performance",
      cta: "Book Service",
      ctaLink: "/dashboard/service-booking",
      backgroundImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      icon: Wrench,
    },
    {
      title: "Brake Adjustment",
      subtitle: "Expert brake tuning for optimal stopping power",
      cta: "Schedule Now",
      ctaLink: "/dashboard/service-booking",
      backgroundImage: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
      icon: Settings,
    },
    {
      title: "Battery Check",
      subtitle: "Comprehensive battery health analysis and optimization",
      cta: "Check Battery",
      ctaLink: "/dashboard/service-booking",
      backgroundImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
      icon: Battery,
    },
    {
      title: "Drivetrain Service",
      subtitle: "Chain, gears, and motor system maintenance",
      cta: "Learn More",
      ctaLink: "/dashboard/service-booking",
      backgroundImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
      icon: Cog,
    },
  ];

  return (
    <div ref={containerRef} className="py-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
          Our Services
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Keep Your Bike in Perfect Shape
        </h2>
      </motion.div>

      {/* Grid Layout - Left full height, Right stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left - Full Height Card */}
        <ServiceCard
          {...services[0]}
          index={0}
          isInView={isInView}
          className="min-h-[280px] lg:min-h-[400px] lg:row-span-2"
        />

        {/* Right Column - Two Stacked Cards */}
        <div className="flex flex-col gap-4 md:gap-6">
          <ServiceCard
            {...services[1]}
            index={1}
            isInView={isInView}
            className="min-h-[180px] lg:min-h-[190px]"
          />
          <ServiceCard
            {...services[2]}
            index={2}
            isInView={isInView}
            className="min-h-[180px] lg:min-h-[190px]"
          />
        </div>
      </div>
    </div>
  );
}

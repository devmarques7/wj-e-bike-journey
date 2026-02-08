import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Zap, Shield, Leaf, Smartphone } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Power",
    description:
      "Seamless electric assist that responds to your every pedal. Feel the surge of 250W brushless motor technology.",
    highlight: "0-25 km/h in 3 seconds",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    icon: Shield,
    title: "Dutch-Proof Build",
    description:
      "Engineered for the Netherlands. Rain, wind, and cobblestones are no match for our aerospace-grade aluminum frame.",
    highlight: "IP67 Weather Resistance",
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
  },
  {
    icon: Leaf,
    title: "Sustainable Journey",
    description:
      "Every ride saves 2.4kg of CO₂. Our batteries are 95% recyclable, and our packaging is 100% plastic-free.",
    highlight: "Carbon Negative by 2025",
    image: "https://images.unsplash.com/photo-1593764592116-bfb2a97c642a?w=800&q=80",
  },
  {
    icon: Smartphone,
    title: "Connected Intelligence",
    description:
      "GPS tracking, theft detection, and ride analytics. Your bike, always in your pocket via the WJ Vision app.",
    highlight: "Real-time Connectivity",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
  },
];

const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} className="relative" style={{ height: `${features.length * 60}vh` }}>
      {/* Gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen overflow-hidden bg-card">
        <div className="container-wj h-full py-8 md:py-12 flex flex-col">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-6 md:mb-8"
          >
            <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
              Technology
            </p>
            <h2 className="text-display-sm md:text-display-md font-bold text-foreground">
              Engineering Excellence
            </h2>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center max-h-[70vh]">
            {/* Left Side - Titles */}
            <div className="lg:col-span-3 flex flex-col justify-center gap-3">
              {features.map((feature, index) => (
                <FeatureTitle
                  key={feature.title}
                  title={feature.title}
                  icon={feature.icon}
                  index={index}
                  scrollProgress={scrollYProgress}
                  totalFeatures={features.length}
                />
              ))}
            </div>

            {/* Right Side - Image with Description & Badge */}
            <div className="lg:col-span-9 flex items-center justify-center">
              <div className="relative w-full max-w-2xl aspect-[16/10] rounded-2xl overflow-hidden">
                {features.map((feature, index) => (
                  <FeatureImage
                    key={feature.title}
                    image={feature.image}
                    description={feature.description}
                    highlight={feature.highlight}
                    title={feature.title}
                    index={index}
                    scrollProgress={scrollYProgress}
                    totalFeatures={features.length}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {features.map((_, index) => (
              <ProgressDot 
                key={index} 
                index={index} 
                scrollProgress={scrollYProgress}
                totalFeatures={features.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Feature Title Component
interface FeatureTitleProps {
  title: string;
  icon: React.ElementType;
  index: number;
  scrollProgress: MotionValue<number>;
  totalFeatures: number;
}

const FeatureTitle = ({ title, icon: Icon, index, scrollProgress, totalFeatures }: FeatureTitleProps) => {
  const segmentSize = 1 / totalFeatures;
  const start = index * segmentSize;
  const mid = start + segmentSize * 0.5;
  const end = (index + 1) * segmentSize;

  // More direct/instant transitions
  const opacity = useTransform(scrollProgress, 
    [start, start + 0.01, end - 0.01, end], 
    index === 0 ? [1, 1, 1, 0.25] : 
    index === totalFeatures - 1 ? [0.25, 1, 1, 1] : 
    [0.25, 1, 1, 0.25]
  );

  const scale = useTransform(scrollProgress, 
    [start, start + 0.01, end - 0.01, end],
    index === 0 ? [1, 1, 1, 0.92] :
    index === totalFeatures - 1 ? [0.92, 1, 1, 1] :
    [0.92, 1, 1, 0.92]
  );

  const x = useTransform(scrollProgress, 
    [start, start + 0.01, end - 0.01, end],
    index === 0 ? [12, 12, 12, 0] :
    index === totalFeatures - 1 ? [0, 12, 12, 12] :
    [0, 12, 12, 0]
  );

  return (
    <motion.div
      style={{ opacity, scale, x }}
      className="flex items-center gap-3 cursor-pointer"
    >
      <div className="w-9 h-9 rounded-lg gradient-wj flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-base font-semibold text-foreground">{title}</span>
    </motion.div>
  );
};

// Feature Image Component with Description inside
interface FeatureImageProps {
  image: string;
  description: string;
  highlight: string;
  title: string;
  index: number;
  scrollProgress: MotionValue<number>;
  totalFeatures: number;
}

const FeatureImage = ({ image, description, highlight, title, index, scrollProgress, totalFeatures }: FeatureImageProps) => {
  const segmentSize = 1 / totalFeatures;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;

  // Instant but smooth transitions
  const opacity = useTransform(scrollProgress, 
    [start, start + 0.02, end - 0.02, end],
    index === 0 ? [1, 1, 1, 0] :
    index === totalFeatures - 1 ? [0, 1, 1, 1] :
    [0, 1, 1, 0]
  );

  const scale = useTransform(scrollProgress, 
    [start, start + 0.02, end - 0.02, end],
    index === 0 ? [1, 1, 1, 0.95] :
    index === totalFeatures - 1 ? [0.95, 1, 1, 1] :
    [0.95, 1, 1, 0.95]
  );

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 rounded-2xl overflow-hidden"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover"
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Content container at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {/* Description text */}
        <p className="text-foreground/90 text-sm md:text-base leading-relaxed mb-4 max-w-lg">
          {description}
        </p>
        
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-wj-green/20 backdrop-blur-sm border border-wj-green/30">
          <span className="text-sm font-medium text-wj-green">
            {highlight}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Progress Dot Component
interface ProgressDotProps {
  index: number;
  scrollProgress: MotionValue<number>;
  totalFeatures: number;
}

const ProgressDot = ({ index, scrollProgress, totalFeatures }: ProgressDotProps) => {
  const segmentSize = 1 / totalFeatures;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;

  const width = useTransform(scrollProgress, 
    [start, start + 0.01, end - 0.01, end],
    index === 0 ? [24, 24, 24, 8] :
    index === totalFeatures - 1 ? [8, 24, 24, 24] :
    [8, 24, 24, 8]
  );

  const backgroundColor = useTransform(scrollProgress, 
    [start, start + 0.01],
    ["rgba(255,255,255,0.2)", "hsl(142, 76%, 36%)"]
  );

  return (
    <motion.div
      style={{ width, backgroundColor }}
      className="h-1.5 rounded-full"
    />
  );
};

export default FeaturesSection;

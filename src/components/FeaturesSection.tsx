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

  // Calculate active index based on scroll progress
  const activeIndex = useTransform(scrollYProgress, [0, 1], [0, features.length - 0.01]);

  return (
    <section ref={containerRef} className="relative bg-card" style={{ height: `${features.length * 100}vh` }}>
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="container-wj h-full py-12 md:py-20">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
              Technology
            </p>
            <h2 className="text-display-sm md:text-display-md font-bold text-foreground">
              Engineering Excellence
            </h2>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100%-120px)] items-center">
            {/* Left Side - Titles */}
            <div className="lg:col-span-3 flex flex-col justify-center gap-4">
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

            {/* Center - Description */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <div className="relative h-48 w-full flex items-center justify-center">
                {features.map((feature, index) => (
                  <FeatureDescription
                    key={feature.title}
                    description={feature.description}
                    index={index}
                    scrollProgress={scrollYProgress}
                    totalFeatures={features.length}
                  />
                ))}
              </div>
            </div>

            {/* Right Side - Image with Badge */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden">
                {features.map((feature, index) => (
                  <FeatureImage
                    key={feature.title}
                    image={feature.image}
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
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
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
  const end = (index + 1) * segmentSize;

  const opacity = useTransform(scrollProgress, [start, start + segmentSize * 0.3, end - segmentSize * 0.3, end], 
    index === 0 ? [1, 1, 1, 0.3] : 
    index === totalFeatures - 1 ? [0.3, 1, 1, 1] : 
    [0.3, 1, 1, 0.3]
  );

  const scale = useTransform(scrollProgress, [start, start + segmentSize * 0.3, end - segmentSize * 0.3, end],
    index === 0 ? [1, 1, 1, 0.95] :
    index === totalFeatures - 1 ? [0.95, 1, 1, 1] :
    [0.95, 1, 1, 0.95]
  );

  const x = useTransform(scrollProgress, [start, start + segmentSize * 0.3, end - segmentSize * 0.3, end],
    index === 0 ? [8, 8, 8, 0] :
    index === totalFeatures - 1 ? [0, 8, 8, 8] :
    [0, 8, 8, 0]
  );

  return (
    <motion.div
      style={{ opacity, scale, x }}
      className="flex items-center gap-3 cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-lg gradient-wj flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-semibold text-foreground">{title}</span>
    </motion.div>
  );
};

// Feature Description Component
interface FeatureDescriptionProps {
  description: string;
  index: number;
  scrollProgress: MotionValue<number>;
  totalFeatures: number;
}

const FeatureDescription = ({ description, index, scrollProgress, totalFeatures }: FeatureDescriptionProps) => {
  const segmentSize = 1 / totalFeatures;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;

  const opacity = useTransform(scrollProgress, [start, start + segmentSize * 0.2, end - segmentSize * 0.2, end],
    index === 0 ? [1, 1, 1, 0] :
    index === totalFeatures - 1 ? [0, 1, 1, 1] :
    [0, 1, 1, 0]
  );

  const y = useTransform(scrollProgress, [start, start + segmentSize * 0.2, end - segmentSize * 0.2, end],
    index === 0 ? [0, 0, 0, -30] :
    index === totalFeatures - 1 ? [30, 0, 0, 0] :
    [30, 0, 0, -30]
  );

  return (
    <motion.p
      style={{ opacity, y }}
      className="absolute text-center text-lg md:text-xl text-muted-foreground leading-relaxed px-4"
    >
      {description}
    </motion.p>
  );
};

// Feature Image Component
interface FeatureImageProps {
  image: string;
  highlight: string;
  title: string;
  index: number;
  scrollProgress: MotionValue<number>;
  totalFeatures: number;
}

const FeatureImage = ({ image, highlight, title, index, scrollProgress, totalFeatures }: FeatureImageProps) => {
  const segmentSize = 1 / totalFeatures;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;

  const opacity = useTransform(scrollProgress, [start, start + segmentSize * 0.2, end - segmentSize * 0.2, end],
    index === 0 ? [1, 1, 1, 0] :
    index === totalFeatures - 1 ? [0, 1, 1, 1] :
    [0, 1, 1, 0]
  );

  const scale = useTransform(scrollProgress, [start, start + segmentSize * 0.2, end - segmentSize * 0.2, end],
    index === 0 ? [1, 1, 1, 0.9] :
    index === totalFeatures - 1 ? [0.9, 1, 1, 1] :
    [0.9, 1, 1, 0.9]
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
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
      
      {/* Badge at bottom */}
      <div className="absolute bottom-4 left-4 right-4">
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

  const width = useTransform(scrollProgress, [start, start + segmentSize * 0.2, end - segmentSize * 0.2, end],
    index === 0 ? [32, 32, 32, 8] :
    index === totalFeatures - 1 ? [8, 32, 32, 32] :
    [8, 32, 32, 8]
  );

  const backgroundColor = useTransform(scrollProgress, [start, start + segmentSize * 0.1],
    ["rgba(255,255,255,0.3)", "hsl(142, 76%, 36%)"]
  );

  return (
    <motion.div
      style={{ width, backgroundColor }}
      className="h-2 rounded-full"
    />
  );
};

export default FeaturesSection;

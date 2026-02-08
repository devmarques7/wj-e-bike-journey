import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Zap, Shield, Leaf, Smartphone, LucideIcon } from "lucide-react";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight: string;
  image: string;
}

interface FeaturesSectionProps {
  sectionLabel?: string;
  sectionTitle?: string;
  features?: FeatureItem[];
  backgroundVideo?: string;
  backgroundImage?: string;
  heightPerFeature?: number;
}

const defaultFeatures: FeatureItem[] = [
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

const FeaturesSection = ({
  sectionLabel = "Technology",
  sectionTitle = "Engineering Excellence",
  features = defaultFeatures,
  backgroundVideo = "/videos/features-background.mp4",
  backgroundImage,
  heightPerFeature = 40,
}: FeaturesSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Create infinite loop by duplicating titles
  const loopedFeatures = [...features, ...features, ...features];

  return (
    <section ref={containerRef} className="relative" style={{ height: `${features.length * heightPerFeature}vh` }}>
      {/* Background Layer - Video or Image */}
      <div className="fixed inset-0 -z-10">
        {backgroundVideo && !backgroundImage ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-background/60" />
      </div>
      
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {/* Inner Container with 95% width and border radius */}
        <div className="w-[95%] h-[85%] rounded-3xl bg-card/95 backdrop-blur-sm overflow-hidden shadow-2xl border border-border/20">
          <div className="h-full py-6 md:py-8 px-6 md:px-8 flex flex-col">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-4 md:mb-6"
            >
              <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-2">
                {sectionLabel}
              </p>
              <h2 className="text-display-md md:text-display-lg font-bold text-foreground">
                {sectionTitle}
              </h2>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-center overflow-hidden">
              {/* Left Side - Infinite Loop Titles */}
              <div className="lg:col-span-4 flex flex-col justify-center overflow-hidden h-full relative">
                {/* Gradient masks for continuity effect */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-card/95 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/95 to-transparent z-10 pointer-events-none" />
                
                <div className="relative py-8">
                  {loopedFeatures.map((feature, loopIndex) => (
                    <FeatureTitle
                      key={`${feature.title}-${loopIndex}`}
                      title={feature.title}
                      icon={feature.icon}
                      index={loopIndex % features.length}
                      loopIndex={loopIndex}
                      scrollProgress={scrollYProgress}
                      totalFeatures={features.length}
                      totalLoopedFeatures={loopedFeatures.length}
                    />
                  ))}
                </div>
              </div>

              {/* Right Side - Image with Description & Badge */}
              <div className="lg:col-span-8 flex items-center justify-center h-full">
                <div className="relative w-full h-full max-h-[50vh] rounded-2xl overflow-hidden">
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
            <div className="flex justify-center gap-2 mt-4">
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
      </div>

      {/* Top gradient for smooth transition */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
      
      {/* Bottom gradient for smooth transition */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
    </section>
  );
};

// Feature Title Component
interface FeatureTitleProps {
  title: string;
  icon: LucideIcon;
  index: number;
  loopIndex: number;
  scrollProgress: MotionValue<number>;
  totalFeatures: number;
  totalLoopedFeatures: number;
}

const FeatureTitle = ({ title, icon: Icon, index, loopIndex, scrollProgress, totalFeatures, totalLoopedFeatures }: FeatureTitleProps) => {
  // Calculate which physical item should be active based on scroll
  // We use loopIndex to track absolute position in the looped array
  const segmentSize = 1 / totalFeatures;
  
  // Determine the current active feature index based on scroll
  const activeIndex = useTransform(scrollProgress, (progress) => {
    const rawIndex = Math.floor(progress * totalFeatures);
    return Math.min(rawIndex, totalFeatures - 1);
  });

  // This item is in the "center" batch (features.length to features.length * 2 - 1)
  const isCenterBatch = loopIndex >= totalFeatures && loopIndex < totalFeatures * 2;
  
  // Calculate opacity based on whether this specific looped item matches the active feature
  const opacity = useTransform(scrollProgress, (progress) => {
    const currentActiveIndex = Math.min(Math.floor(progress * totalFeatures), totalFeatures - 1);
    
    // Only the center batch items should be highlighted
    if (isCenterBatch && index === currentActiveIndex) {
      return 1;
    }
    return 0.25;
  });

  const scale = useTransform(scrollProgress, (progress) => {
    const currentActiveIndex = Math.min(Math.floor(progress * totalFeatures), totalFeatures - 1);
    
    if (isCenterBatch && index === currentActiveIndex) {
      return 1;
    }
    return 0.95;
  });

  const y = useTransform(scrollProgress, 
    [0, 1],
    [0, -80 * totalFeatures]
  );

  return (
    <motion.div
      style={{ opacity, scale, y }}
      className="flex items-center gap-4 py-3 cursor-pointer transition-opacity duration-200"
    >
      <div className="w-12 h-12 rounded-xl gradient-wj flex items-center justify-center flex-shrink-0 shadow-lg">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl md:text-2xl font-bold text-foreground">{title}</span>
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
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Description text */}
        <p className="text-foreground/90 text-sm md:text-base leading-relaxed mb-3 max-w-lg">
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

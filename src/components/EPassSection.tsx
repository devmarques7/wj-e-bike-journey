import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "E-Pass Light",
    icon: Sparkles,
    tagline: "Essential protection",
    gradient: "from-[#1a1a1a] to-[#2d2d2d]",
    border: "border-border/50",
    accent: "text-muted-foreground",
  },
  {
    name: "E-Pass Plus",
    icon: Shield,
    tagline: "Enhanced coverage",
    gradient: "from-[#08150d] to-[#0d2818]",
    border: "border-wj-green/30",
    accent: "text-wj-green",
    popular: true,
  },
  {
    name: "E-Pass Black",
    icon: Crown,
    tagline: "Ultimate experience",
    gradient: "from-[#020202] via-[#08150d] to-[#020202]",
    border: "border-[#f3eff5]/20",
    accent: "text-[#f3eff5]",
    premium: true,
  },
];

const EPassSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Card animations based on scroll
  const card1Y = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const card1Opacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const card1RotateX = useTransform(scrollYProgress, [0, 0.3], [45, 0]);

  const card2Y = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
  const card2Opacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1]);
  const card2RotateX = useTransform(scrollYProgress, [0.1, 0.4], [45, 0]);

  const card3Y = useTransform(scrollYProgress, [0.2, 0.5], [100, 0]);
  const card3Opacity = useTransform(scrollYProgress, [0.2, 0.45], [0, 1]);
  const card3RotateX = useTransform(scrollYProgress, [0.2, 0.5], [45, 0]);

  const textOpacity = useTransform(scrollYProgress, [0.35, 0.5], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.35, 0.5], [40, 0]);

  const cardAnimations = [
    { y: card1Y, opacity: card1Opacity, rotateX: card1RotateX },
    { y: card2Y, opacity: card2Opacity, rotateX: card2RotateX },
    { y: card3Y, opacity: card3Opacity, rotateX: card3RotateX },
  ];

  return (
    <section
      id="epass"
      className="relative min-h-[120vh] bg-background overflow-hidden"
      ref={containerRef}
      style={{ perspective: "1200px" }}
    >
      {/* Top gradient for smooth transition */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      <div className="sticky top-0 min-h-screen flex flex-col items-center justify-center py-20">
        <div className="container-wj">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-4">
              Membership Program
            </p>
            <h2 className="text-display-sm md:text-display-md font-bold text-foreground mb-4">
              E-Pass
            </h2>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  style={{
                    y: cardAnimations[index].y,
                    opacity: cardAnimations[index].opacity,
                    rotateX: cardAnimations[index].rotateX,
                    transformStyle: "preserve-3d",
                  }}
                  className="relative"
                >
                  <div
                    className={`relative h-72 rounded-2xl bg-gradient-to-b ${plan.gradient} border ${plan.border} p-8 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group`}
                  >
                    {/* Background glow effect */}
                    {plan.premium && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#f3eff5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    {plan.popular && (
                      <div className="absolute inset-0 bg-gradient-to-t from-wj-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}

                    {/* Popular/Premium badge */}
                    {plan.popular && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-wj-green/20 text-wj-green rounded-full border border-wj-green/30">
                          Popular
                        </span>
                      </div>
                    )}
                    {plan.premium && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#f3eff5]/10 text-[#f3eff5] rounded-full border border-[#f3eff5]/20">
                          Premium
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} border ${plan.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-8 h-8 ${plan.accent}`} />
                    </div>

                    {/* Plan name */}
                    <h3
                      className={`text-2xl font-bold mb-2 ${plan.premium ? "text-[#f3eff5]" : "text-foreground"}`}
                    >
                      {plan.name}
                    </h3>

                    {/* Tagline */}
                    <p className={`text-sm ${plan.accent}`}>{plan.tagline}</p>

                    {/* Hover reveal line */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 ${plan.popular ? "bg-wj-green" : plan.premium ? "bg-[#f3eff5]" : "bg-muted-foreground/30"} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Description text that appears on scroll */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-muted-foreground text-lg mb-4">
              Seja parte da família WJ Vision. Nossos planos de fidelidade
              oferecem benefícios exclusivos, desde garantia estendida até
              serviços VIP prioritários.
            </p>
            <p className="text-muted-foreground/70 text-sm mb-8">
              Cada nível desbloqueia vantagens únicas para tornar sua jornada
              ainda mais especial.
            </p>

            {/* CTA Button */}
            <Button
              size="lg"
              className="gradient-wj text-white hover:opacity-90 px-8 py-6 text-base font-medium rounded-xl shadow-lg shadow-wj-green/20 hover:shadow-wj-green/40 transition-all duration-300"
            >
              See More Details
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default EPassSection;

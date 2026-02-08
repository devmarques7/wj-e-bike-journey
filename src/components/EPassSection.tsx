import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "with bike purchase",
    description: "Essential coverage for everyday riders",
    features: [
      { name: "2-year warranty", included: true },
      { name: "E-ID Digital Passport", included: true },
      { name: "Basic theft protection", included: true },
      { name: "Priority service", included: false },
      { name: "Free annual maintenance", included: false },
      { name: "Guaranteed resale value", included: false },
    ],
    cta: "Included",
    popular: false,
  },
  {
    name: "E-Pass Silver",
    price: "€14.99",
    period: "/month",
    description: "Enhanced protection & peace of mind",
    features: [
      { name: "5-year warranty", included: true },
      { name: "E-ID Digital Passport", included: true },
      { name: "Premium theft protection", included: true },
      { name: "Priority service", included: true },
      { name: "Free annual maintenance", included: true },
      { name: "Guaranteed resale value", included: false },
    ],
    cta: "Choose Silver",
    popular: true,
  },
  {
    name: "E-Pass Black",
    price: "€24.99",
    period: "/month",
    description: "The ultimate ownership experience",
    features: [
      { name: "Lifetime warranty", included: true },
      { name: "E-ID Digital Passport", included: true },
      { name: "Complete theft coverage", included: true },
      { name: "VIP priority service", included: true },
      { name: "Unlimited maintenance", included: true },
      { name: "Guaranteed 60% resale", included: true },
    ],
    cta: "Choose Black",
    popular: false,
    premium: true,
  },
];

const EPassSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section id="epass" className="section-padding bg-background" ref={containerRef}>
      <div className="container-wj">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-4">
            E-Pass Membership
          </p>
          <h2 className="text-display-sm md:text-display-md font-bold text-foreground mb-6">
            Choose Your Journey Level
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Elevate your ownership with E-Pass. From essential coverage to VIP
            treatment, find the plan that matches your lifestyle.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-wj-green/10 border-2 border-wj-green scale-105 shadow-lg shadow-wj-green/10"
                  : plan.premium
                  ? "bg-gradient-to-b from-secondary to-background border border-border"
                  : "bg-card border border-border hover:border-wj-green/30"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider gradient-wj text-white rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Premium Badge */}
              {plan.premium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider bg-foreground text-background rounded-full">
                    Premium
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl lg:text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature.name}
                    className="flex items-center gap-3 text-sm"
                  >
                    {feature.included ? (
                      <Check className="h-5 w-5 text-wj-green flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? "gradient-wj text-white hover:opacity-90"
                    : plan.premium
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
                size="lg"
                disabled={plan.cta === "Included"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Physical Cards Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20"
        >
          {/* Cards Container - Circular Row Layout */}
          <div 
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mb-12" 
            style={{ perspective: "1500px" }}
          >
            {/* E-Pass Light Card - Left */}
            <motion.div
              initial={{ opacity: 0, x: -100, rotateY: 45, scale: 0.8 }}
              animate={isInView ? { opacity: 1, x: 0, rotateY: 15, scale: 0.9 } : {}}
              transition={{ duration: 0.8, delay: 0.9, type: "spring", stiffness: 60 }}
              whileHover={{ 
                scale: 0.95, 
                rotateY: 5, 
                y: -10,
                boxShadow: "0 25px 50px -12px rgba(243, 239, 245, 0.4)"
              }}
              className="w-64 h-40 md:w-72 md:h-44 rounded-2xl cursor-pointer transition-all duration-300 md:-mr-8 z-10"
              style={{ 
                transformStyle: "preserve-3d",
                background: "linear-gradient(135deg, #F3EFF5 0%, #e8e4ea 50%, #ddd8df 100%)",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)"
              }}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-between rounded-2xl border border-black/5">
                <div className="flex justify-between items-start">
                  <span className="text-base font-bold text-[#08150D]">WJ VISION</span>
                  <span className="text-[10px] font-semibold text-[#08150D]/70 bg-black/5 px-2 py-1 rounded-full">E-PASS LIGHT</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-[#08150D]/50">Member</p>
                    <p className="text-xs font-medium text-[#08150D]">Essential</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg border border-[#08150D]/10 flex items-center justify-center bg-white/50">
                    <div className="w-6 h-6 bg-[#08150D]/10 rounded" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* E-Pass Black Card - Center (Main) */}
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.7 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 60 }}
              whileHover={{ 
                scale: 1.08, 
                y: -15,
                boxShadow: "0 35px 60px -15px rgba(8, 21, 13, 0.6)"
              }}
              className="w-72 h-44 md:w-80 md:h-52 rounded-2xl cursor-pointer transition-all duration-300 z-20"
              style={{ 
                transformStyle: "preserve-3d",
                background: "linear-gradient(135deg, #0f2518 0%, #08150D 50%, #050d08 100%)",
                boxShadow: "0 25px 50px -15px rgba(8, 21, 13, 0.7)"
              }}
            >
              <div className="absolute inset-0 p-6 flex flex-col justify-between border border-white/10 rounded-2xl">
                <div className="flex justify-between items-start">
                  <span className="text-lg font-bold text-white">WJ VISION</span>
                  <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-1 rounded-full">E-PASS BLACK</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-white/50">Member</p>
                    <p className="text-sm font-medium text-white">Elite</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl border-2 border-white/20 flex items-center justify-center bg-white/5">
                    <div className="w-7 h-7 bg-white/20 rounded-lg" />
                  </div>
                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-wj-green/10 rounded-3xl blur-2xl -z-10" />
            </motion.div>

            {/* E-Pass Plus Card - Right */}
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: -45, scale: 0.8 }}
              animate={isInView ? { opacity: 1, x: 0, rotateY: -15, scale: 0.9 } : {}}
              transition={{ duration: 0.8, delay: 1.1, type: "spring", stiffness: 60 }}
              whileHover={{ 
                scale: 0.95, 
                rotateY: -5, 
                y: -10,
                boxShadow: "0 25px 50px -12px rgba(5, 140, 66, 0.5)"
              }}
              className="w-64 h-40 md:w-72 md:h-44 rounded-2xl cursor-pointer transition-all duration-300 md:-ml-8 z-10"
              style={{ 
                transformStyle: "preserve-3d",
                background: "linear-gradient(135deg, #058C42 0%, #047a3a 50%, #036830 100%)",
                boxShadow: "0 20px 40px -15px rgba(5, 140, 66, 0.5)"
              }}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-between rounded-2xl">
                <div className="flex justify-between items-start">
                  <span className="text-base font-bold text-white">WJ VISION</span>
                  <span className="text-[10px] font-semibold text-white/90 bg-white/20 px-2 py-1 rounded-full">E-PASS PLUS</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-white/60">Member</p>
                    <p className="text-xs font-medium text-white">Premium</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg border border-white/30 flex items-center justify-center bg-white/10">
                    <div className="w-6 h-6 bg-white/30 rounded" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Description & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="text-center"
          >
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto mb-6">
              <span className="text-foreground font-medium">
                O mundo digital que você pode tocar.
              </span>{" "}
              Escolha o plano de fidelidade que combina com seu estilo e acesse serviços exclusivos com um toque do seu E-Pass.
            </p>
            <Button 
              className="gradient-wj text-white hover:opacity-90 transition-all duration-300"
              size="lg"
            >
              Ver detalhes dos planos
              <span className="ml-2">→</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EPassSection;

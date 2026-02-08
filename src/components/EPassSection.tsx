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
          {/* Cards Container */}
          <div className="flex justify-center items-center mb-12">
            <div className="relative h-72 w-full max-w-2xl flex items-center justify-center">
              {/* E-Pass Light Card */}
              <motion.div
                initial={{ opacity: 0, rotate: -25, x: -100, scale: 0.9 }}
                animate={isInView ? { opacity: 1, rotate: -15, x: -80, scale: 0.95 } : {}}
                transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 100 }}
                whileHover={{ rotate: -5, y: -20, scale: 1, zIndex: 30 }}
                className="absolute w-64 h-40 md:w-80 md:h-48 rounded-2xl bg-gradient-to-br from-muted via-background to-muted border border-border shadow-2xl shadow-black/20 cursor-pointer z-10"
                style={{ transformOrigin: "bottom center" }}
              >
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-base font-bold text-foreground">WJ VISION</span>
                    <span className="text-xs text-muted-foreground font-medium">E-PASS LIGHT</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Member</p>
                      <p className="text-xs text-foreground">Essential</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg border border-border/50 flex items-center justify-center">
                      <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* E-Pass Plus Card */}
              <motion.div
                initial={{ opacity: 0, rotate: 0, y: 50, scale: 0.9 }}
                animate={isInView ? { opacity: 1, rotate: 0, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
                whileHover={{ y: -30, scale: 1.05, zIndex: 30 }}
                className="absolute w-64 h-40 md:w-80 md:h-48 rounded-2xl bg-gradient-to-br from-wj-green/30 via-wj-green/10 to-wj-green/20 border border-wj-green/40 shadow-2xl shadow-wj-green/20 cursor-pointer z-20"
                style={{ transformOrigin: "bottom center" }}
              >
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-base font-bold text-foreground">WJ VISION</span>
                    <span className="text-xs text-wj-green font-medium">E-PASS PLUS</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Member</p>
                      <p className="text-xs text-foreground">Premium</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg border border-wj-green/30 flex items-center justify-center">
                      <div className="w-6 h-6 bg-wj-green/30 rounded" />
                    </div>
                  </div>
                </div>
                {/* Glow Effect */}
                <div className="absolute -inset-2 bg-wj-green/10 rounded-3xl blur-xl -z-10" />
              </motion.div>

              {/* E-Pass Black Card */}
              <motion.div
                initial={{ opacity: 0, rotate: 25, x: 100, scale: 0.9 }}
                animate={isInView ? { opacity: 1, rotate: 15, x: 80, scale: 0.95 } : {}}
                transition={{ duration: 0.8, delay: 0.9, type: "spring", stiffness: 100 }}
                whileHover={{ rotate: 5, y: -20, scale: 1, zIndex: 30 }}
                className="absolute w-64 h-40 md:w-80 md:h-48 rounded-2xl bg-gradient-to-br from-secondary via-background to-secondary border border-foreground/20 shadow-2xl shadow-black/40 cursor-pointer z-10"
                style={{ transformOrigin: "bottom center" }}
              >
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-base font-bold text-foreground">WJ VISION</span>
                    <span className="text-xs text-foreground font-medium">E-PASS BLACK</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Member</p>
                      <p className="text-xs text-foreground">Elite</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg border border-foreground/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-foreground/20 rounded" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
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

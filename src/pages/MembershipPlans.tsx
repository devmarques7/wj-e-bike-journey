import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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

const MembershipPlans = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <div className="min-h-screen bg-background">
      <Navigation isScrolled={true} />
      
      <main className="pt-24 pb-16">
        <div className="container-wj" ref={containerRef}>
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link to="/#epass" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to E-Pass</span>
            </Link>
          </motion.div>

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-wj-green text-sm font-medium tracking-widest uppercase mb-4">
              Membership Plans
            </p>
            <h1 className="text-display-sm md:text-display-md font-bold text-foreground mb-6">
              Choose Your Journey Level
            </h1>
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

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All plans include access to our exclusive E-ID Digital Passport, providing a complete digital identity for your bike with maintenance history, ownership records, and guaranteed authenticity.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MembershipPlans;

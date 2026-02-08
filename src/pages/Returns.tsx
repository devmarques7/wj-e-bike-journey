import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { RotateCcw, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const returnSteps = [
  { step: 1, title: "Request Return", description: "Contact our support team or start a return online." },
  { step: 2, title: "Schedule Pickup", description: "We'll arrange a free pickup at your convenience." },
  { step: 3, title: "Inspection", description: "Our team inspects the bike upon return." },
  { step: 4, title: "Refund", description: "Receive your refund within 5-7 business days." },
];

const eligible = [
  "Unused e-bikes in original packaging",
  "Items returned within 30 days of delivery",
  "Accessories in original condition",
  "Defective products (any time within warranty)",
];

const notEligible = [
  "Bikes with visible wear or damage",
  "Items returned after 30 days",
  "Customized or personalized products",
  "Items without original packaging",
];

const Returns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-24">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Support
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Returns & Refunds
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              We want you to love your WJ Vision bike. If you're not completely 
              satisfied, we offer hassle-free returns within 30 days.
            </p>
          </motion.div>

          {/* Return Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-xl font-light text-foreground mb-8">How It Works</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {returnSteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 rounded-full border border-wj-green/30 bg-wj-green/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-medium text-wj-green">{item.step}</span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Eligibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-xl font-light text-foreground mb-8">Return Eligibility</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-wj-green/20 bg-wj-green/5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-wj-green" />
                  <h3 className="text-base font-medium text-foreground">Eligible for Return</h3>
                </div>
                <ul className="space-y-2">
                  {eligible.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-wj-green mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl border border-border/20 bg-muted/10">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">Not Eligible</h3>
                </div>
                <ul className="space-y-2">
                  {notEligible.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Policy Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="p-8 rounded-2xl border border-border/20 bg-muted/10 text-center mb-12"
          >
            <RotateCcw className="h-8 w-8 text-wj-green mx-auto mb-4" />
            <h3 className="text-2xl font-light text-foreground mb-2">
              30-Day Money Back Guarantee
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Test ride your new e-bike for up to 30 days. If it's not right for you, 
              return it for a full refund—no questions asked.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <Link
              to="/help"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-wj-green transition-colors duration-200"
            >
              Need help with a return?
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Returns;

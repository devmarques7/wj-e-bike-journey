import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import EIASection from "@/components/EIASection";
import ModelShowcaseSection from "@/components/ModelShowcaseSection";
import FeaturesSection from "@/components/FeaturesSection";
import EPassSection from "@/components/EPassSection";
import QuickActionsSection from "@/components/QuickActionsSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add dark class by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <Loader onLoadingComplete={handleLoadingComplete} />}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen bg-background">
          <Navigation isScrolled={isScrolled} />
          <main>
            <HeroSection />
            <EIASection />
            <ModelShowcaseSection />
            <FeaturesSection />
            <EPassSection />
            <QuickActionsSection />
          </main>
          <Footer />
        </div>
      )}
    </>
  );
};

export default Index;

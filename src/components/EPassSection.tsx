import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const EPassSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section id="epass" className="section-padding bg-background relative overflow-hidden" ref={containerRef}>
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/epass-background.mp4" type="video/mp4" />
        </video>
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        {/* Top gradient fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>
      
      <div className="container-wj relative z-10">
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

        {/* Physical Cards Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          {/* Cards Container - Circular Row Layout */}
          <div 
            className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 mb-12" 
            style={{ perspective: "1500px" }}
          >
            {/* E-Pass Light Card - Left */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.7 }}
              animate={isInView ? { opacity: 1, y: 0, rotateY: 15, scale: 0.9 } : {}}
              transition={{ duration: 0.9, delay: 0.9, type: "spring", stiffness: 50 }}
              whileHover={{ 
                scale: 0.95, 
                rotateY: 5, 
                y: -15,
                transition: { duration: 0.3 }
              }}
              className="w-64 h-40 md:w-72 md:h-44 rounded-2xl cursor-pointer md:-mr-8 z-10 group"
              style={{ 
                transformStyle: "preserve-3d",
                background: "linear-gradient(135deg, #F3EFF5 0%, #e8e4ea 50%, #ddd8df 100%)",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)"
              }}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-between rounded-2xl border border-black/5 group-hover:border-black/15 transition-colors duration-300">
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

            {/* E-Pass Black Card - Center (Main) with Animated Border */}
            <motion.div
              initial={{ opacity: 0, y: 120, scale: 0.6 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 45 }}
              whileHover={{ 
                scale: 1.05, 
                y: -15,
                rotateX: 5,
                rotateY: -3,
                transition: { duration: 0.8, ease: "easeOut" }
              }}
              className="relative w-72 h-44 md:w-80 md:h-52 rounded-2xl cursor-pointer z-20 group"
              style={{ 
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              {/* Animated Subtle Border */}
              <div 
                className="absolute -inset-[1px] rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4), rgba(0,0,0,0.2), rgba(255,255,255,0.3), rgba(0,0,0,0.1), rgba(255,255,255,0.2))",
                  backgroundSize: "400% 100%",
                  animation: "borderGlow 8s linear infinite",
                }}
              />
              
              {/* Card Content */}
              <div 
                className="absolute inset-[1px] rounded-2xl"
                style={{ 
                  background: "linear-gradient(135deg, #0a0a0a 0%, #020202 50%, #000000 100%)",
                  boxShadow: "0 25px 50px -15px rgba(0, 0, 0, 0.8)"
                }}
              >
                <div className="absolute inset-0 p-6 flex flex-col justify-between rounded-2xl">
                  <div className="flex justify-between items-start">
                    <span className="text-lg font-bold text-white">WJ VISION</span>
                    <span className="text-xs font-semibold text-white/80 bg-white/5 px-2 py-1 rounded-full border border-white/10">E-PASS BLACK</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-white/50">Member</p>
                      <p className="text-sm font-medium text-white">Elite</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center bg-white/5">
                      <div className="w-7 h-7 bg-white/10 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subtle Glow Effect */}
              <div className="absolute -inset-6 bg-white/5 rounded-3xl blur-2xl -z-10 group-hover:bg-white/10 transition-colors duration-700" />
            </motion.div>

            {/* E-Pass Plus Card - Right */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.7 }}
              animate={isInView ? { opacity: 1, y: 0, rotateY: -15, scale: 0.9 } : {}}
              transition={{ duration: 0.9, delay: 1.1, type: "spring", stiffness: 50 }}
              whileHover={{ 
                scale: 0.95, 
                rotateY: -5, 
                y: -15,
                transition: { duration: 0.3 }
              }}
              className="w-64 h-40 md:w-72 md:h-44 rounded-2xl cursor-pointer md:-ml-8 z-10 group"
              style={{ 
                transformStyle: "preserve-3d",
                background: "linear-gradient(135deg, #058C42 0%, #047a3a 50%, #036830 100%)",
                boxShadow: "0 20px 40px -15px rgba(5, 140, 66, 0.5)"
              }}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-between rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors duration-300">
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
            transition={{ duration: 0.6, delay: 1.3 }}
            className="text-center"
          >
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              <span className="text-foreground font-medium">
                The digital world you can touch.
              </span>{" "}
              Choose the loyalty plan that matches your style and access exclusive services with a tap of your E-Pass.
            </p>
            
            <Link to="/membership-plans">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button 
                  className="relative overflow-hidden group bg-transparent border-2 border-wj-green text-foreground hover:text-white px-8 py-6 text-base font-medium transition-all duration-500"
                  size="lg"
                >
                  {/* Animated background */}
                  <span className="absolute inset-0 bg-wj-green transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                  
                  {/* Button content */}
                  <span className="relative flex items-center gap-3">
                    View Membership Plans
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* CSS Animation for Golden Border */}
      <style>{`
        @keyframes borderGlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </section>
  );
};

export default EPassSection;

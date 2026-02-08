import { motion } from "framer-motion";
import React from "react";

interface LoaderProps {
  onLoadingComplete: () => void;
}

const Loader = ({ onLoadingComplete }: LoaderProps) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const duration = 1800; // 1.8 seconds - faster loading
    const interval = 20;
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        onLoadingComplete();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, onLoadingComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1, y: 0 }}
      exit={{
        y: "-100vh",
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
      }}
    >
      {/* Minimal Brand Mark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {/* Simple Line Progress */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-16 md:w-24 mb-8"
        >
          <div className="h-px w-full bg-border overflow-hidden">
            <motion.div
              className="h-full bg-wj-green"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm font-medium tracking-[0.3em] text-foreground/80 uppercase"
        >
          WJ Vision
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default Loader;

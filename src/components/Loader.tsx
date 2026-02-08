import { motion } from "framer-motion";

const EBikeWireframe = ({ progress }: { progress: number }) => {
  // SVG path for a minimalist e-bike wireframe
  const clipHeight = 100 - progress;

  return (
    <div className="relative w-64 h-40 md:w-80 md:h-48">
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background wireframe (unfilled) */}
        <g stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3">
          {/* Frame */}
          <path d="M50 80 L90 50 L140 50 L160 80" strokeLinecap="round" />
          <path d="M90 50 L90 80" strokeLinecap="round" />
          <path d="M50 80 L90 80" strokeLinecap="round" />
          
          {/* Front wheel */}
          <circle cx="160" cy="80" r="25" />
          <circle cx="160" cy="80" r="3" />
          
          {/* Rear wheel */}
          <circle cx="50" cy="80" r="25" />
          <circle cx="50" cy="80" r="3" />
          
          {/* Handlebars */}
          <path d="M140 50 L145 40 L155 38" strokeLinecap="round" />
          
          {/* Seat */}
          <path d="M85 45 L95 45" strokeLinecap="round" strokeWidth="3" />
          <path d="M90 45 L90 50" strokeLinecap="round" />
          
          {/* Pedals */}
          <circle cx="90" cy="80" r="8" />
          <path d="M82 80 L98 80" strokeLinecap="round" strokeWidth="2" />
          
          {/* Battery pack */}
          <rect x="75" y="55" width="20" height="8" rx="2" />
        </g>

        {/* Filled wireframe with clip path for progressive reveal */}
        <defs>
          <clipPath id="progressClip">
            <rect x="0" y={clipHeight * 1.2} width="200" height="120" />
          </clipPath>
        </defs>
        
        <g 
          stroke="hsl(var(--wj-green))" 
          strokeWidth="2" 
          clipPath="url(#progressClip)"
          className="drop-shadow-[0_0_8px_hsl(var(--wj-green))]"
        >
          {/* Frame */}
          <path d="M50 80 L90 50 L140 50 L160 80" strokeLinecap="round" />
          <path d="M90 50 L90 80" strokeLinecap="round" />
          <path d="M50 80 L90 80" strokeLinecap="round" />
          
          {/* Front wheel */}
          <circle cx="160" cy="80" r="25" />
          <circle cx="160" cy="80" r="3" fill="hsl(var(--wj-green))" />
          
          {/* Rear wheel */}
          <circle cx="50" cy="80" r="25" />
          <circle cx="50" cy="80" r="3" fill="hsl(var(--wj-green))" />
          
          {/* Handlebars */}
          <path d="M140 50 L145 40 L155 38" strokeLinecap="round" />
          
          {/* Seat */}
          <path d="M85 45 L95 45" strokeLinecap="round" strokeWidth="3" />
          <path d="M90 45 L90 50" strokeLinecap="round" />
          
          {/* Pedals */}
          <circle cx="90" cy="80" r="8" />
          <path d="M82 80 L98 80" strokeLinecap="round" strokeWidth="2" />
          
          {/* Battery pack */}
          <rect x="75" y="55" width="20" height="8" rx="2" fill="hsl(var(--wj-green))" />
        </g>
      </svg>
    </div>
  );
};

interface LoaderProps {
  onLoadingComplete: () => void;
}

const Loader = ({ onLoadingComplete }: LoaderProps) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const duration = 2500; // 2.5 seconds
    const interval = 20; // Update every 20ms
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
      // Delay before transitioning out
      const timeout = setTimeout(() => {
        onLoadingComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, onLoadingComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.1,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
      }}
    >
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <span className="text-2xl font-bold tracking-wider">
          <span className="text-foreground">WJ</span>
          <span className="text-wj-green"> VISION</span>
        </span>
      </motion.div>

      {/* E-Bike Wireframe */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <EBikeWireframe progress={progress} />
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 w-48 md:w-64"
      >
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full gradient-wj"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Building your journey</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 text-sm text-muted-foreground tracking-wide"
      >
        Dutch Engineering. Elevated.
      </motion.p>
    </motion.div>
  );
};

import React from "react";

export default Loader;

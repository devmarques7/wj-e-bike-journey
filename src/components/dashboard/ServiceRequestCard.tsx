import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ServiceRequestCard() {
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const constraintsRef = useRef(null);
  
  const x = useMotionValue(0);
  const sliderWidth = 240;
  const thumbWidth = 56;
  const maxDrag = sliderWidth - thumbWidth - 8;
  
  const backgroundColor = useTransform(
    x,
    [0, maxDrag],
    ["rgba(5, 140, 66, 0.1)", "rgba(5, 140, 66, 0.3)"]
  );
  
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);
  const checkOpacity = useTransform(x, [maxDrag * 0.7, maxDrag], [0, 1]);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.8) {
      animate(x, maxDrag, { duration: 0.2 });
      setIsCompleted(true);
      setTimeout(() => {
        navigate("/urgent-service");
      }, 500);
    } else {
      animate(x, 0, { duration: 0.3, type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full rounded-3xl overflow-hidden relative"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/urgent-service-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      
      {/* Content */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-wj-green/20 flex items-center justify-center mb-4 border border-wj-green/30">
            <AlertTriangle className="h-5 w-5 text-wj-green" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Urgent Service
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Need immediate assistance?
          </p>
        </div>

        {/* Swipe Slider */}
        <div className="mt-4">
          <motion.div
            ref={constraintsRef}
            style={{ backgroundColor }}
            className="relative h-14 rounded-full border border-wj-green/30 overflow-hidden"
          >
            {/* Hint Text */}
            <motion.div 
              style={{ opacity: textOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="text-xs text-wj-green/70 font-medium tracking-wide">
                Slide to request →
              </span>
            </motion.div>
            
            {/* Success Check */}
            <motion.div 
              style={{ opacity: checkOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <CheckCircle className="h-5 w-5 text-wj-green" />
            </motion.div>

            {/* Draggable Thumb */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: maxDrag }}
              dragElastic={0}
              onDragEnd={handleDragEnd}
              style={{ x }}
              className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-wj-green flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-wj-green/30"
            >
              <ArrowRight className="h-5 w-5 text-background" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

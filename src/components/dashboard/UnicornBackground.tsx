import { useEffect, useRef } from "react";

interface UnicornBackgroundProps {
  projectId: string;
  className?: string;
}

export default function UnicornBackground({ projectId, className = "" }: UnicornBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const loadUnicornStudio = () => {
      const existingScript = document.querySelector('script[src*="unicornStudio"]');
      
      if (existingScript) {
        if (window.UnicornStudio?.init) {
          window.UnicornStudio.init();
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js";
      script.onload = () => {
        if (window.UnicornStudio?.init) {
          window.UnicornStudio.init();
        }
      };
      document.head.appendChild(script);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", loadUnicornStudio);
    } else {
      loadUnicornStudio();
    }

    return () => {
      isInitialized.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-us-project={projectId}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized?: boolean;
      init?: () => void;
    };
  }
}

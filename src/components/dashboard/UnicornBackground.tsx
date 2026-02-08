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

    // Function to hide Unicorn.Studio watermark
    const hideWatermark = () => {
      if (!containerRef.current) return;
      
      // Find and hide watermark elements
      const watermarks = containerRef.current.querySelectorAll('a[href*="unicornstudio"], [class*="watermark"], [id*="watermark"]');
      watermarks.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.visibility = 'hidden';
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    };

    // MutationObserver to detect and hide watermark when added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        hideWatermark();
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    const loadUnicornStudio = () => {
      const existingScript = document.querySelector('script[src*="unicornStudio"]');
      
      if (existingScript) {
        if (window.UnicornStudio?.init) {
          window.UnicornStudio.init();
          setTimeout(hideWatermark, 100);
          setTimeout(hideWatermark, 500);
          setTimeout(hideWatermark, 1000);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js";
      script.onload = () => {
        if (window.UnicornStudio?.init) {
          window.UnicornStudio.init();
          setTimeout(hideWatermark, 100);
          setTimeout(hideWatermark, 500);
          setTimeout(hideWatermark, 1000);
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
      observer.disconnect();
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

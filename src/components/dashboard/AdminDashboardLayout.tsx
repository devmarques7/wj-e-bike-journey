import { ReactNode, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AdminHeader from "./AdminHeader";
import MobileFooterNav from "./MobileFooterNav";

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime < 0.5) {
        video.style.opacity = "0";
        setTimeout(() => {
          video.currentTime = 0;
          video.play();
          video.style.opacity = "1";
        }, 300);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover transition-opacity duration-300 z-0"
      >
        <source src="/videos/dashboard-background.mp4" type="video/mp4" />
      </video>

      {/* Overlay for readability */}
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-[1]" />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <AdminHeader />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-lg font-bold tracking-wider">
              <span className="text-foreground">WJ</span>
              <span className="text-wj-green"> COMMAND</span>
            </span>
          </div>
        </div>

        {/* Main Content with rounded container */}
        <main className="flex-1 pt-16 lg:pt-0 pb-24 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:m-4 lg:rounded-3xl lg:bg-background/40 lg:backdrop-blur-md lg:border lg:border-border/30 lg:overflow-hidden min-h-[calc(100vh-5rem)]"
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Footer Navigation */}
        <div className="lg:hidden">
          <MobileFooterNav />
        </div>
      </div>
    </div>
  );
}

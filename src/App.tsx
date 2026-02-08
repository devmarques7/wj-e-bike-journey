import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import MembershipPlans from "./pages/MembershipPlans";
import Accessories from "./pages/Accessories";
import AccessoryDetail from "./pages/AccessoryDetail";
import FindStore from "./pages/FindStore";
import BookTestRide from "./pages/BookTestRide";
import OurStory from "./pages/OurStory";
import Career from "./pages/Career";
import Help from "./pages/Help";
import Delivery from "./pages/Delivery";
import Returns from "./pages/Returns";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/membership-plans" element={<MembershipPlans />} />
              <Route path="/accessories" element={<Accessories />} />
              <Route path="/accessories/:id" element={<AccessoryDetail />} />
              <Route path="/find-store" element={<FindStore />} />
              <Route path="/book-test-ride" element={<BookTestRide />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/career" element={<Career />} />
              <Route path="/help" element={<Help />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/admin/*" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

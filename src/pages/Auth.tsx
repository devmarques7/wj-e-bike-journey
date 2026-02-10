import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, User, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "demo" | "register">("login");
  
  const { login, setMockUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast({
        title: "Welcome back",
        description: "Redirecting to your dashboard...",
      });
      
      // Determine redirect based on user role
      setTimeout(() => {
        if (email.toLowerCase().includes("admin")) {
          navigate("/dashboard/admin");
        } else {
          navigate("/dashboard");
        }
      }, 500);
    } else {
      toast({
        title: "Authentication failed",
        description: "Please check your credentials or use a demo account.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Check your email to confirm your account.",
      });
      setMode("login");
      setPassword("");
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (type: "admin" | "staff" | "light" | "plus" | "black") => {
    if (type === "admin") {
      setMockUser("admin");
      navigate("/dashboard/admin");
    } else if (type === "staff") {
      setMockUser("staff");
      navigate("/dashboard/staff");
    } else {
      setMockUser("member", type);
      navigate("/dashboard");
    }
    
    toast({
      title: "Demo mode activated",
      description: `Logged in as ${type === "admin" ? "Admin" : type === "staff" ? "Staff Mechanic" : `${type.charAt(0).toUpperCase() + type.slice(1)} Member`}`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <span className="text-2xl font-bold tracking-wider">
              <span className="text-foreground">WJ</span>
              <span className="text-wj-green"> VISION</span>
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-display-sm font-light text-foreground mb-2">
              {mode === "register" ? "Create account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "register" ? "Join WJ Vision and start your journey" : "Sign in to access your dashboard"}
            </p>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-2 mb-8"
          >
            {mode === "register" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("login")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Button>
            ) : (
              <>
                <Button
                  variant={mode === "login" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("login")}
                  className={mode === "login" ? "gradient-wj" : ""}
                >
                  Sign In
                </Button>
                <Button
                  variant={mode === "demo" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("demo")}
                  className={mode === "demo" ? "gradient-wj" : ""}
                >
                  Demo Access
                </Button>
              </>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {mode === "register" ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="h-12 bg-muted/50 border-border/50 focus:border-wj-green pl-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-12 bg-muted/50 border-border/50 focus:border-wj-green pl-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} className="h-12 bg-muted/50 border-border/50 focus:border-wj-green pl-11 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-wj text-primary-foreground font-medium">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Create Account<ArrowRight className="h-4 w-4 ml-2" /></>)}
                </Button>
                <p className="text-xs text-center text-muted-foreground">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
              </motion.form>
            ) : mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-12 bg-muted/50 border-border/50 focus:border-wj-green" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="h-12 bg-muted/50 border-border/50 focus:border-wj-green pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" className="text-sm text-muted-foreground hover:text-wj-green transition-colors">Forgot password?</button>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-wj text-primary-foreground font-medium">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Sign In<ArrowRight className="h-4 w-4 ml-2" /></>)}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="demo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground mb-6">Select a demo account to explore the dashboard:</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDemoLogin("admin")} className="w-full p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-wj-green/50 transition-all group text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-wj-green transition-colors">Admin Dashboard</p>
                      <p className="text-sm text-muted-foreground">Access the WJ Command Center</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">ADMIN</div>
                  </div>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDemoLogin("staff")} className="w-full p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-wj-green/50 transition-all group text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-wj-green transition-colors">Staff Mechanic</p>
                      <p className="text-sm text-muted-foreground">Access workshop tasks & schedule</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-wj-green/20 text-wj-green text-xs font-medium">STAFF</div>
                  </div>
                </motion.button>
                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">Member Tiers</p>
                  {[
                    { tier: "light" as const, label: "Light", desc: "Basic member access" },
                    { tier: "plus" as const, label: "Plus", desc: "Enhanced service features" },
                    { tier: "black" as const, label: "Black", desc: "VIP Valet & Concierge" },
                  ].map((item, index) => (
                    <motion.button key={item.tier} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleDemoLogin(item.tier)} className="w-full p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-wj-green/50 transition-all group text-left mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground group-hover:text-wj-green transition-colors">{item.label} Member</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.tier === "black" ? "bg-foreground text-background" : item.tier === "plus" ? "bg-wj-green/20 text-wj-green" : "bg-muted text-muted-foreground"}`}>{item.label.toUpperCase()}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {mode !== "register" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-center text-sm text-muted-foreground"
            >
              New to WJ Vision?{" "}
              <button onClick={() => setMode("register")} className="text-wj-green hover:underline">
                Create an account
              </button>
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-secondary p-6">
        {/* Inner container with video background */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/auth-background.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-wj-forest/60 via-secondary/40 to-wj-deep/70" />
          
          {/* Decorative blurs */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-wj-green/30 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-wj-green/20 blur-2xl" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-center w-full h-full p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <h2 className="text-display-lg font-light text-white/90 mb-4">
                Your E-Bike
                <br />
                <span className="text-wj-green">Journey</span>
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                Track maintenance, book services, and unlock exclusive member benefits
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/PhoneInput";

export default function CompleteProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/auth", { replace: true });
    if (user?.email) setEmail(user.email);
  }, [authLoading, isAuthenticated, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!phone || !phoneValid) {
      toast({ title: "Phone required", description: "Add a valid phone number.", variant: "destructive" });
      return;
    }
    if (!phoneVerified) {
      toast({
        title: "Phone not verified",
        description: "Please verify your phone via WhatsApp before continuing.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({
          must_complete_profile: false,
          email,
          phone,
          phone_verified: true,
        })
        .eq("user_id", user.id);
      await supabase
        .from("member_invitations")
        .update({ status: "completed" })
        .eq("user_id", user.id);
    }
    // Refresh the session so AuthContext picks up the cleared
    // must_complete_profile flag immediately, then land on the dashboard.
    try {
      await supabase.auth.refreshSession();
    } catch {
      // ignore — onAuthStateChange will still rehydrate shortly
    }
    toast({ title: "Profile completed", description: "Welcome aboard." });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-8"
      >
        <div>
          <h1 className="text-2xl font-light text-foreground">Complete your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Set your final email and a personal password.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="pwd" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpwd">Confirm password</Label>
          <Input id="cpwd" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <PhoneInput
            value={phone ?? undefined}
            verified={phoneVerified}
            required
            label="Phone number"
            onChange={(e164, valid) => {
              setPhone(e164);
              setPhoneValid(valid);
              if (!valid) setPhoneVerified(false);
            }}
            onVerified={() => setPhoneVerified(true)}
          />
        </div>
        <Button type="submit" disabled={submitting} className="w-full h-11 gradient-wj">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>}
        </Button>
      </motion.form>
    </div>
  );
}
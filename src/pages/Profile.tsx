import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Loader2, Save, Shield, User as UserIcon, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import RoleDashboardLayout from "@/components/dashboard/RoleDashboardLayout";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120, "Max 120 chars"),
  email: z.string().trim().email("Invalid email").max(255),
});

type Role = "admin" | "staff" | "member" | "guest";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: mockUser, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      // Demo / mock fallback (no Supabase session but logged via AuthContext)
      if (!session) {
        if (isAuthenticated && mockUser) {
          setIsDemo(true);
          setUserId(mockUser.id);
          setFullName(mockUser.name);
          setEmail(mockUser.email);
          setAvatarUrl(mockUser.avatar ?? null);
          setRoles([mockUser.role as Role]);
          setLoading(false);
          return;
        }
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? "");

      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);

      if (profile) {
        setProfileId(profile.id);
        setFullName(profile.full_name ?? "");
        setEmail(profile.email ?? session.user.email ?? "");
        setAvatarUrl(profile.avatar_url);
      }
      setRoles((roleRows ?? []).map((r: any) => r.role as Role));
      setLoading(false);
    };
    load();
  }, [navigate, isAuthenticated, mockUser]);

  const handleSave = async () => {
    const parsed = profileSchema.safeParse({ full_name: fullName, email });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (!userId) return;
    if (isDemo) {
      toast({ title: "Demo mode", description: "Sign in with a real account to persist changes." });
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.full_name, email: parsed.data.email })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your changes were saved." });
    }
    setSaving(false);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (isDemo) {
      toast({ title: "Demo mode", description: "Avatar upload requires a real account." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("user_id", userId);
    if (updErr) {
      toast({ title: "Could not save avatar", description: updErr.message, variant: "destructive" });
    } else {
      setAvatarUrl(url);
      toast({ title: "Avatar updated" });
    }
    setUploading(false);
  };

  const initials = fullName
    ? fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const primaryRole: Role = roles.includes("admin")
    ? "admin"
    : roles.includes("staff")
    ? "staff"
    : roles.includes("member")
    ? "member"
    : "guest";

  if (loading) {
    return (
      <RoleDashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-wj-green" />
        </div>
      </RoleDashboardLayout>
    );
  }

  return (
    <RoleDashboardLayout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display-sm font-light mb-2">My Profile</h1>
          <p className="text-muted-foreground mb-10">Manage your account information and avatar.</p>

          {/* Avatar */}
          <div className="rounded-3xl bg-card/50 border border-border/50 backdrop-blur p-8 mb-6 flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-wj-green/30">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-wj-green/10 text-wj-green text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-wj-green text-primary-foreground flex items-center justify-center hover:scale-105 transition disabled:opacity-60"
                aria-label="Upload avatar"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Profile picture</p>
              <p className="text-xs text-muted-foreground/70">PNG or JPG, max 5MB.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {roles.length === 0 ? (
                  <Badge variant="outline">No role assigned</Badge>
                ) : (
                  roles.map((r) => (
                    <Badge
                      key={r}
                      className={
                        r === "admin"
                          ? "bg-wj-green/20 text-wj-green border-wj-green/30"
                          : r === "staff"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      <Shield className="h-3 w-3 mr-1" /> {r.toUpperCase()}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl bg-card/50 border border-border/50 backdrop-blur p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 pl-11 bg-muted/50 border-border/50 focus:border-wj-green"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 bg-muted/50 border-border/50 focus:border-wj-green"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Note: this updates the profile record only. Auth email change requires re-verification.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Active role</Label>
              <div className="h-12 flex items-center px-4 rounded-md bg-muted/30 border border-border/50 text-sm">
                <Shield className="h-4 w-4 mr-2 text-wj-green" />
                {primaryRole.toUpperCase()}
                <span className="ml-auto text-xs text-muted-foreground">Managed by admin</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="gradient-wj">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="h-4 w-4 mr-2" /> Save changes</>)}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </RoleDashboardLayout>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save, Shield, Smile, User as UserIcon, Mail, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

// Notionists-only avatar library (DiceBear), categorized by gender for easy filtering.
type Gender = "female" | "male" | "neutral";
const SEEDS_BY_GENDER: Record<Gender, string[]> = {
  female: [
    "Aria", "Mia", "Zoe", "Luna", "Sofia", "Maya", "Nora", "Iris",
    "Yara", "Amara", "Chloe", "Priya", "Layla", "Olivia", "Emma", "Ava",
    "Isabella", "Camila", "Aaliyah", "Freya", "Hana", "Mei", "Anya", "Nina",
  ],
  male: [
    "Leo", "Noah", "Ethan", "Kai", "Liam", "Theo", "Felix", "Hugo",
    "Ravi", "Jin", "Omar", "Diego", "Lucas", "Mateo", "Aiden", "Caleb",
    "Idris", "Jasper", "Kenji", "Mason", "Oscar", "Rafael", "Samir", "Yusuf",
  ],
  neutral: [
    "Sky", "River", "Sage", "Quinn", "Rowan", "Avery", "Charlie", "Elliot",
    "Finley", "Hayden", "Jordan", "Kai-N", "Morgan", "Phoenix", "Reese", "Taylor",
  ],
};
const buildAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
type AvatarOption = { url: string; gender: Gender; seed: string };
const AVATAR_OPTIONS: AvatarOption[] = (Object.entries(SEEDS_BY_GENDER) as [Gender, string[]][])
  .flatMap(([gender, seeds]) => seeds.map((seed) => ({ url: buildAvatar(seed), gender, seed })));

const GENDER_FILTERS: { id: Gender | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "neutral", label: "Neutral" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: mockUser, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<Gender | "all">("all");
  const [seedQuery, setSeedQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");

  const startEdit = () => {
    setDraftName(fullName);
    setDraftEmail(email);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

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
    const parsed = profileSchema.safeParse({ full_name: draftName, email: draftEmail });
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
      setFullName(parsed.data.full_name);
      setEmail(parsed.data.email);
      setEditing(false);
      toast({ title: "Profile updated", description: "Your changes were saved." });
    }
    setSaving(false);
  };

  const pickAvatar = async (url: string) => {
    if (!userId) return;
    if (isDemo) {
      setAvatarUrl(url);
      setPickerOpen(false);
      toast({ title: "Demo mode", description: "Avatar shown locally only." });
      return;
    }
    setSavingAvatar(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Could not save avatar", description: error.message, variant: "destructive" });
    } else {
      setAvatarUrl(url);
      setPickerOpen(false);
      toast({ title: "Avatar updated" });
    }
    setSavingAvatar(false);
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
                onClick={() => setPickerOpen(true)}
                disabled={savingAvatar}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-wj-green text-primary-foreground flex items-center justify-center hover:scale-105 transition disabled:opacity-60"
                aria-label="Choose avatar"
              >
                {savingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smile className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Profile avatar</p>
              <button
                onClick={() => setPickerOpen(true)}
                className="text-xs text-wj-green hover:underline"
              >
                Choose from our avatar library →
              </button>
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

          {/* Info card */}
          <div className="rounded-3xl bg-card/50 border border-border/50 backdrop-blur p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Account information</h2>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={startEdit} className="text-wj-green hover:text-wj-green hover:bg-wj-green/10">
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-muted-foreground">
                  <X className="h-3.5 w-3.5 mr-2" /> Cancel
                </Button>
              )}
            </div>

            {!editing ? (
              <dl className="divide-y divide-border/40">
                <div className="grid grid-cols-3 gap-4 py-4">
                  <dt className="text-sm text-muted-foreground flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5" /> Full name
                  </dt>
                  <dd className="col-span-2 text-sm text-foreground">{fullName || <span className="text-muted-foreground/60">—</span>}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4 py-4">
                  <dt className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </dt>
                  <dd className="col-span-2 text-sm text-foreground break-all">{email || <span className="text-muted-foreground/60">—</span>}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4 py-4">
                  <dt className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" /> Active role
                  </dt>
                  <dd className="col-span-2 text-sm text-foreground flex items-center gap-2">
                    <span className="text-wj-green">{primaryRole.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground/70">· Managed by admin</span>
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
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
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      className="h-12 pl-11 bg-muted/50 border-border/50 focus:border-wj-green"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: this updates the profile record only. Auth email change requires re-verification.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving} className="gradient-wj">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="h-4 w-4 mr-2" /> Save changes</>)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Avatar picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur border-border/50">
          <DialogHeader>
            <DialogTitle className="font-light text-2xl">Choose your avatar</DialogTitle>
            <DialogDescription>
              Pick a human persona from our diverse library.
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-col gap-3 pb-2">
            <div className="relative">
              <Input
                value={seedQuery}
                onChange={(e) => setSeedQuery(e.target.value)}
                placeholder="Search by name (Aria, Leo, Maya...)"
                className="h-10 bg-muted/50 border-border/50 focus:border-wj-green"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {GENDER_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setGenderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition ${
                    genderFilter === f.id
                      ? "bg-wj-green/20 text-wj-green border-wj-green/40"
                      : "bg-muted/40 text-muted-foreground border-border/40 hover:border-wj-green/40 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {AVATAR_OPTIONS.filter((opt) => {
              const matchGender = genderFilter === "all" || opt.gender === genderFilter;
              const matchSeed = !seedQuery.trim() || opt.seed.toLowerCase().includes(seedQuery.trim().toLowerCase());
              return matchGender && matchSeed;
            }).map((opt) => {
              const selected = opt.url === avatarUrl;
              return (
                <button
                  key={opt.url}
                  onClick={() => pickAvatar(opt.url)}
                  disabled={savingAvatar}
                  title={opt.seed}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 disabled:opacity-50 bg-muted/40 ${
                    selected
                      ? "border-wj-green ring-2 ring-wj-green/40 scale-105"
                      : "border-border/40 hover:border-wj-green hover:scale-110 hover:shadow-[0_8px_30px_-8px_hsl(var(--wj-green)/0.6)] hover:z-10"
                  }`}
                >
                  <img
                    src={opt.url}
                    alt={`Avatar ${opt.seed}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white/90 py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {opt.seed}
                  </span>
                  {selected && (
                    <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-wj-green text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </RoleDashboardLayout>
  );
}
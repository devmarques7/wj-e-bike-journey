import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Star, 
  Trophy,
  Clock,
  Calendar,
  ThumbsUp,
  Wrench,
  TrendingUp,
  Plus,
  Copy,
  Loader2,
  Mail,
  Link2,
  Check
} from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminKPICard from "@/components/dashboard/AdminKPICard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Role = "admin" | "staff" | "member" | "guest";

interface MemberRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  must_complete_profile: boolean;
  role: Role;
  created_at: string;
}

const staffKPIs = [
  {
    label: "Team Members",
    value: "12",
    change: "+2",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Avg. Rating",
    value: "4.8",
    change: "+0.2",
    trend: "up" as const,
    icon: Star,
  },
  {
    label: "Services This Week",
    value: "87",
    change: "+15%",
    trend: "up" as const,
    icon: Wrench,
  },
  {
    label: "Avg. Service Time",
    value: "2.1h",
    change: "-12min",
    trend: "up" as const,
    icon: Clock,
  },
];

const staffMembers = [
  { id: 1, name: "Tom Hendriks", role: "Senior Mechanic", rating: 4.9, reviews: 156, servicesWeek: 12, appointmentsWeek: 15, hoursWeek: 42, avatar: "TH" },
  { id: 2, name: "Lisa van Dijk", role: "Mechanic", rating: 4.8, reviews: 124, servicesWeek: 10, appointmentsWeek: 12, hoursWeek: 40, avatar: "LV" },
  { id: 3, name: "Mark de Boer", role: "Junior Mechanic", rating: 4.7, reviews: 89, servicesWeek: 8, appointmentsWeek: 10, hoursWeek: 38, avatar: "MB" },
  { id: 4, name: "Eva Bakker", role: "Trainee", rating: 4.6, reviews: 45, servicesWeek: 5, appointmentsWeek: 6, hoursWeek: 32, avatar: "EB" },
  { id: 5, name: "Jan Smit", role: "Sales Manager", rating: 4.9, reviews: 98, servicesWeek: 0, appointmentsWeek: 8, hoursWeek: 45, avatar: "JS" },
  { id: 6, name: "Anna de Jong", role: "Customer Service", rating: 4.8, reviews: 210, servicesWeek: 0, appointmentsWeek: 25, hoursWeek: 40, avatar: "AJ" },
];

const topPerformersFallback = [
  { name: "Tom Hendriks", metric: "Most Services", value: "12 this week", avatar: "TH" },
  { name: "Anna de Jong", metric: "Best Feedback", value: "4.9 rating", avatar: "AJ" },
  { name: "Jan Smit", metric: "Most Hours", value: "45h worked", avatar: "JS" },
  { name: "Lisa van Dijk", metric: "Most Appointments", value: "15 scheduled", avatar: "LV" },
];

const getRoleBadge = (role: Role) => {
  const map: Record<Role, string> = {
    admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-wj-green/20 text-wj-green border-wj-green/30",
    guest: "bg-muted text-muted-foreground border-border/50",
  };
  return <Badge className={cn("text-[10px] capitalize", map[role])}>{role}</Badge>;
};

function initials(name: string | null | undefined, email: string | null | undefined) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? src[1] ?? "";
  return (a + b).toUpperCase();
}

export default function AdminMembers() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "member" as Role });
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
    setup_link: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<"link" | "creds" | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url, must_complete_profile, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load members", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const ids = (profiles ?? []).map((p) => p.user_id);
    let rolesById = new Map<string, Role>();
    if (ids.length) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      (roles ?? []).forEach((r: any) => {
        const prev = rolesById.get(r.user_id);
        const rank = (x: Role) => (x === "admin" ? 3 : x === "staff" ? 2 : x === "member" ? 1 : 0);
        if (!prev || rank(r.role) > rank(prev)) rolesById.set(r.user_id, r.role);
      });
    }
    setMembers(
      (profiles ?? []).map((p: any) => ({
        ...p,
        role: rolesById.get(p.user_id) ?? "member",
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setCreating(true);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      toast({ title: "Session expired", variant: "destructive" });
      setCreating(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-create-member", {
      body: form,
    });
    if (error || !(data as any)?.success) {
      toast({
        title: "Could not create member",
        description: error?.message || (data as any)?.error || "Unknown error",
        variant: "destructive",
      });
      setCreating(false);
      return;
    }
    setCreatedCreds({
      email: (data as any).email,
      password: (data as any).temp_password,
      setup_link: (data as any).setup_link ?? null,
    });
    setForm({ email: "", full_name: "", role: "member" });
    await loadMembers();
    setCreating(false);
  };

  const copyTo = async (kind: "link" | "creds") => {
    if (!createdCreds) return;
    const text =
      kind === "link"
        ? createdCreds.setup_link ?? ""
        : `Email: ${createdCreds.email}\nTemporary password: ${createdCreds.password}`;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1800);
  };

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const totalMembers = members.length;
  const pending = members.filter((m) => m.must_complete_profile).length;
  const admins = members.filter((m) => m.role === "admin").length;
  const staffCount = members.filter((m) => m.role === "staff").length;

  const dynamicKPIs = [
    { label: "Total Members", value: String(totalMembers), change: `+${members.filter(m => Date.now() - new Date(m.created_at).getTime() < 7*864e5).length} this week`, trend: "up" as const, icon: Users },
    { label: "Pending Setup", value: String(pending), change: pending ? "needs action" : "all set", trend: "up" as const, icon: Mail },
    { label: "Staff", value: String(staffCount), change: "+0", trend: "up" as const, icon: Wrench },
    { label: "Admins", value: String(admins), change: "+0", trend: "up" as const, icon: Star },
  ];

  return (
    <AdminDashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-foreground">Member Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pre-register users — they finish setup on first login.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gradient-wj h-10">
            <Plus className="h-4 w-4 mr-2" /> Add member
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {dynamicKPIs.map((kpi, index) => (
            <div key={kpi.label} className="col-span-6 lg:col-span-3">
              <AdminKPICard {...kpi} index={index} />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Staff Table - 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Team Members</h3>
                <span className="text-xs text-muted-foreground">{totalMembers} total</span>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Member</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Email</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Role</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">Loading…</TableCell></TableRow>
                    ) : members.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No members yet. Click "Add member" to invite the first one.</TableCell></TableRow>
                    ) : members.map((m) => (
                      <TableRow key={m.user_id} className="border-border/30 hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              {m.avatar_url ? <img src={m.avatar_url} alt="" /> : (
                                <AvatarFallback className="bg-wj-green/20 text-wj-green text-[10px] font-bold">
                                  {initials(m.full_name, m.email)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-xs font-medium">{m.full_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.email || "—"}</TableCell>
                        <TableCell>{getRoleBadge(m.role)}</TableCell>
                        <TableCell>
                          {m.must_complete_profile ? (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Pending setup</Badge>
                          ) : (
                            <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 text-[10px]">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </div>

          {/* Rankings - 4 columns */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-foreground">Top Performers</h3>
              </div>
              
              <div className="space-y-3">
                {topPerformersFallback.map((performer, index) => (
                  <motion.div
                    key={performer.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      index === 0 ? "bg-amber-400/20 text-amber-400" :
                      index === 1 ? "bg-zinc-400/20 text-zinc-400" :
                      index === 2 ? "bg-orange-400/20 text-orange-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-wj-green/20 text-wj-green text-[10px] font-bold">
                        {performer.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{performer.name}</p>
                      <p className="text-[10px] text-muted-foreground">{performer.metric}</p>
                    </div>
                    <span className="text-[10px] text-wj-green font-medium">{performer.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-background/60 backdrop-blur-md border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-wj-green" />
                <h3 className="text-sm font-medium text-foreground">Weekly Stats</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <ThumbsUp className="h-5 w-5 text-wj-green mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">94%</p>
                  <p className="text-[10px] text-muted-foreground">Satisfaction</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <Calendar className="h-5 w-5 text-wj-green mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">87</p>
                  <p className="text-[10px] text-muted-foreground">Appointments</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreatedCreds(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light">
              {createdCreds ? "Member ready" : "Add new member"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {createdCreds
                ? "Share the magic link — it auto-signs in and opens the setup screen. Credentials are a fallback."
                : "Pre-register a user. They'll set their final email and password on first login."}
            </DialogDescription>
          </DialogHeader>
          {createdCreds ? (
            <div className="space-y-4">
              {/* Magic link block (primary) */}
              {createdCreds.setup_link ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Setup link</span>
                    <button
                      type="button"
                      onClick={() => copyTo("link")}
                      className="text-[10px] text-wj-green hover:underline inline-flex items-center gap-1"
                    >
                      {copied === "link" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === "link" ? "Copied" : "Copy link"}
                    </button>
                  </div>
                  <div className="rounded-lg border border-wj-green/30 bg-wj-green/5 p-3 flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-wj-green shrink-0" />
                    <p className="text-[11px] font-mono text-foreground truncate">{createdCreds.setup_link}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Magic link unavailable — share the credentials below instead.
                </p>
              )}

              {/* Credentials fallback */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fallback credentials</span>
                  <button
                    type="button"
                    onClick={() => copyTo("creds")}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {copied === "creds" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "creds" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-mono truncate">{createdCreds.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Password</span>
                    <span className="font-mono">{createdCreds.password}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => { setOpen(false); setCreatedCreds(null); }} className="gradient-wj w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="m-email">Email</Label>
                <Input id="m-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-name">Full name (optional)</Label>
                <Input id="m-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="gradient-wj">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create</>}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

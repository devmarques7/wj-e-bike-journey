import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  Trash2,
  Save,
  PowerOff,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Role = "admin" | "staff" | "customer" | "guest";

interface MemberRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  must_complete_profile: boolean;
  role: Role;
  created_at: string;
  is_active?: boolean;
}

interface Props {
  member: MemberRow | null;
  onClose: () => void;
  onChanged?: () => void;
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? src[1] ?? "";
  return (a + b).toUpperCase();
}

const roleStyles: Record<Role, string> = {
  admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  member: "bg-wj-green/20 text-wj-green border-wj-green/30",
  guest: "bg-muted text-muted-foreground border-border/50",
};

export default function MemberProfileDialog({ member, onClose, onChanged }: Props) {
  const open = !!member;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isSelf = !!member && currentUser?.id === member.user_id;
  const isActive = member?.is_active !== false;

  const [role, setRole] = useState<Role>(member?.role ?? "customer");
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirm, setConfirm] = useState<"deactivate" | "delete" | null>(null);
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role);
      setAck(false);
      setConfirm(null);
    }
  }, [member]);

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-update-member", { body });
    if (error || !(data as any)?.success) {
      throw new Error(error?.message || (data as any)?.error || "Action failed");
    }
    return data;
  };

  const handleSaveRole = async () => {
    if (!member || role === member.role) return;
    setSaving(true);
    try {
      await invoke({ user_id: member.user_id, action: "update_role", role });
      toast({ title: "Role updated" });
      onChanged?.();
    } catch (e) {
      toast({ title: "Could not update role", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (active: boolean) => {
    if (!member) return;
    setStatusBusy(true);
    try {
      await invoke({ user_id: member.user_id, action: "set_active", active });
      toast({ title: active ? "User reactivated" : "User deactivated" });
      setConfirm(null);
      onChanged?.();
      if (!active) {
        // keep dialog open so admin sees new state options
      }
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setStatusBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    setStatusBusy(true);
    try {
      await invoke({ user_id: member.user_id, action: "delete" });
      toast({ title: "User deleted" });
      setConfirm(null);
      onChanged?.();
      onClose();
    } catch (e) {
      toast({ title: "Could not delete user", description: (e as Error).message, variant: "destructive" });
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light">Member profile</DialogTitle>
          <DialogDescription className="text-xs">
            Quick overview of this team member's account.
          </DialogDescription>
        </DialogHeader>

        {member && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Identity */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-border/40">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" />
                ) : (
                  <AvatarFallback className="bg-wj-green/20 text-wj-green text-sm font-bold">
                    {initials(member.full_name, member.email)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground truncate">
                  {member.full_name || "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{member.email || "—"}</p>
                <RatingStars value={(member as any).rating ?? 0} />
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 gap-2">
              <Row icon={<Shield className="h-3.5 w-3.5" />} label="Role">
                <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSelf}>
                  <SelectTrigger className="h-7 w-[120px] text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="customer">Member</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row
                icon={
                  !isActive ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : member.must_complete_profile ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )
                }
                label="Status"
              >
                {!isActive ? (
                  <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                    Deactivated
                  </Badge>
                ) : member.must_complete_profile ? (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                    Pending setup
                  </Badge>
                ) : (
                  <Badge className="bg-wj-green/20 text-wj-green border-wj-green/30 text-[10px]">
                    Active
                  </Badge>
                )}
              </Row>
              <Row icon={<Mail className="h-3.5 w-3.5" />} label="Email">
                <span className="text-xs text-foreground/80 truncate">{member.email || "—"}</span>
              </Row>
              <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Joined">
                <span className="text-xs text-foreground/80">
                  {new Date(member.created_at).toLocaleDateString()}
                </span>
              </Row>
            </div>

            <p className="text-[10px] text-muted-foreground/70 font-mono truncate">
              ID: {member.user_id}
            </p>

            {isSelf && (
              <p className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
                You can't change the role or status of your own account from this dialog.
              </p>
            )}

            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2 border-t border-border/30">
              <div className="flex flex-wrap items-center gap-2">
                {isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => { setAck(false); setConfirm("deactivate"); }}
                    disabled={isSelf || statusBusy}
                  >
                    <PowerOff className="h-3.5 w-3.5 mr-1.5" /> Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-wj-green/40 text-wj-green hover:bg-wj-green/10"
                    onClick={() => handleStatus(true)}
                    disabled={isSelf || statusBusy}
                  >
                    {statusBusy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Power className="h-3.5 w-3.5 mr-1.5" />}
                    Activate user
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => { setAck(false); setConfirm("delete"); }}
                  disabled={isSelf || statusBusy}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete user
                </Button>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs gradient-wj"
                onClick={handleSaveRole}
                disabled={saving || isSelf || role === member.role}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save changes
              </Button>
            </DialogFooter>
          </motion.div>
        )}

        {/* Confirmation modal */}
        <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-light">
                {confirm === "delete" ? "Delete this user?" : "Deactivate this user?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs space-y-2">
                {confirm === "delete" ? (
                  <>
                    This will <strong>permanently remove</strong> the user account, profile, roles
                    and pending invitations. This action <strong>cannot be undone</strong>. Any data
                    tied to this account may become inaccessible.
                  </>
                ) : (
                  <>
                    The user will be <strong>blocked from signing in</strong> immediately. Their
                    profile and history are kept and you can reactivate them at any time.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <label className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/30 p-3 cursor-pointer">
              <Checkbox
                checked={ack}
                onCheckedChange={(c) => setAck(c === true)}
                className="mt-0.5"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                I understand the consequences and confirm I want to{" "}
                {confirm === "delete" ? "permanently delete" : "deactivate"}{" "}
                <strong className="text-foreground">{member?.full_name || member?.email}</strong>.
              </span>
            </label>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={statusBusy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!ack || statusBusy}
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm === "delete") handleDelete();
                  else handleStatus(false);
                }}
                className={cn(
                  confirm === "delete"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-amber-500 text-black hover:bg-amber-500/90",
                )}
              >
                {statusBusy ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : confirm === "delete" ? (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                )}
                {confirm === "delete" ? "Delete permanently" : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/20">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">{children}</div>
    </div>
  );
}

function RatingStars({ value }: { value: number }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const hasRating = rating > 0;
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = hasRating && i <= Math.round(rating);
          return (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                filled ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40",
              )}
            />
          );
        })}
      </div>
      <span className="text-[10px] text-muted-foreground ml-1">
        {hasRating ? rating.toFixed(1) : "No ratings yet"}
      </span>
    </div>
  );
}
import { motion } from "framer-motion";
import { Mail, Shield, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface Props {
  member: MemberRow | null;
  onClose: () => void;
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

export default function MemberProfileDialog({ member, onClose }: Props) {
  const open = !!member;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
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
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 gap-2">
              <Row icon={<Shield className="h-3.5 w-3.5" />} label="Role">
                <Badge className={cn("text-[10px] capitalize", roleStyles[member.role])}>
                  {member.role}
                </Badge>
              </Row>
              <Row
                icon={
                  member.must_complete_profile ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )
                }
                label="Status"
              >
                {member.must_complete_profile ? (
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
          </motion.div>
        )}
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
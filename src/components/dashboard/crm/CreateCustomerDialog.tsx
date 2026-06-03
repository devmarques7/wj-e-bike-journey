import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, CheckCircle2 } from "lucide-react";
import { adminCreateCustomer, type LifecycleStage } from "@/hooks/crm/useCrmData";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type PlanOpt = { plan_version_id: string; label: string; price: number };

export default function CreateCustomerDialog({ open, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "staff" | "admin" | "guest">("member");
  const [stage, setStage] = useState<LifecycleStage>("new");
  const [planVersionId, setPlanVersionId] = useState<string>("none");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [planOpts, setPlanOpts] = useState<PlanOpt[]>([]);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: pvs } = await supabase
        .from("plan_versions")
        .select("id, price, plan_id, interval, status")
        .eq("status", "active");
      const planIds = [...new Set((pvs ?? []).map((p: any) => p.plan_id))];
      const { data: ps } = await supabase
        .from("plans")
        .select("id, name, tier_level")
        .in("id", planIds);
      setPlanOpts(
        (pvs ?? []).map((pv: any) => {
          const p = (ps ?? []).find((x: any) => x.id === pv.plan_id);
          return {
            plan_version_id: pv.id,
            label: `${p?.name ?? "?"} — €${Number(pv.price).toFixed(0)}/${pv.interval}`,
            price: Number(pv.price),
          };
        }),
      );
    })();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFullName(""); setEmail(""); setPhone(""); setPassword("");
      setRole("member"); setStage("new"); setPlanVersionId("none"); setTags("");
      setCredentials(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!email || !fullName) {
      toast.error("Email and name are required");
      return;
    }
    setSaving(true);
    try {
      const res = await adminCreateCustomer({
        email,
        full_name: fullName,
        phone: phone || null,
        password: password || undefined,
        role,
        lifecycle_stage: stage,
        plan_version_id: planVersionId !== "none" ? planVersionId : null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success(t("crm.new_customer_modal.created"));
      setCredentials({ email: res.email, password: res.temp_password });
      onCreated?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast.success("Copied");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-md max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-light">{t("crm.new_customer_modal.title")}</DialogTitle>
          <DialogDescription className="text-xs">{t("crm.new_customer_modal.subtitle")}</DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-wj-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">{t("crm.new_customer_modal.credentials_title")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("crm.new_customer_modal.credentials_warning")}</p>
            <div className="rounded-xl border border-border/40 bg-muted/20 divide-y divide-border/30">
              <CredRow label="Email" value={credentials.email} onCopy={copy} />
              <CredRow label="Password" value={credentials.password} onCopy={copy} mono />
            </div>
            <DialogFooter>
              <Button onClick={onClose} className="bg-wj-green hover:bg-wj-green/90">
                {t("crm.new_customer_modal.done")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="col-span-2">
                <Label className="text-xs">{t("crm.new_customer_modal.full_name")}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">{t("crm.new_customer_modal.email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">{t("crm.new_customer_modal.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t("crm.new_customer_modal.password")}</Label>
                <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••••••" className="h-9 mt-1 font-mono" />
                <p className="text-[10px] text-muted-foreground mt-1">{t("crm.new_customer_modal.password_hint")}</p>
              </div>
              <div>
                <Label className="text-xs">{t("crm.new_customer_modal.role")}</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t("crm.roles.member")}</SelectItem>
                    <SelectItem value="staff">{t("crm.roles.staff")}</SelectItem>
                    <SelectItem value="admin">{t("crm.roles.admin")}</SelectItem>
                    <SelectItem value="guest">{t("crm.roles.guest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("crm.new_customer_modal.lifecycle")}</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as LifecycleStage)}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["lead","new","active_subscriber","loyal","at_risk","churned"] as LifecycleStage[]).map((s) => (
                      <SelectItem key={s} value={s}>{t(`crm.lifecycle.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t("crm.new_customer_modal.plan")}</Label>
                <Select value={planVersionId} onValueChange={setPlanVersionId}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("crm.new_customer_modal.no_plan")}</SelectItem>
                    {planOpts.map((p) => (
                      <SelectItem key={p.plan_version_id} value={p.plan_version_id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t("crm.new_customer_modal.tags")}</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, lisboa" className="h-9 mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>{t("crm.actions.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
                {saving ? t("crm.actions.saving") : t("crm.new_customer_modal.create")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CredRow({ label, value, onCopy, mono }: { label: string; value: string; onCopy: (v: string) => void; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20">{label}</span>
      <span className={`flex-1 text-sm truncate ${mono ? "font-mono" : ""}`}>{value}</span>
      <Button size="sm" variant="ghost" onClick={() => onCopy(value)} className="h-7 w-7 p-0">
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
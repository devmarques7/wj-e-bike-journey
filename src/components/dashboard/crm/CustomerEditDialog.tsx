import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, AlertTriangle, CreditCard, Banknote, XCircle, Loader2 } from "lucide-react";
import { Plus, X, Check, ShieldAlert, Eye, EyeOff, KeyRound, UserCog, Sparkles, Mail, ChevronRight, Wallet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/integrations/supabase/client";
import { usePlans, cancelSubscription, changeSubscriptionPlan } from "@/hooks/plans/usePlansData";
import { type CrmCustomer, type LifecycleStage, updateCustomerProfile } from "@/hooks/crm/useCrmData";
import { LIFECYCLE_META } from "./colors";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: CrmCustomer | null;
  onSaved?: () => void;
}

type PayMethod = "cash" | "bank_transfer" | "pos_card" | "other";
type Mode = "chooser" | "crm" | "membership" | "login";

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex" aria-label="hint">
          <Info className="h-3 w-3 text-muted-foreground/70 hover:text-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs">{children}</TooltipContent>
    </Tooltip>
  );
}

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Hint>{hint}</Hint>
    </div>
  );
}

function TagsMultiSelect({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("customer_profiles").select("tags").limit(500);
      const all = new Set<string>();
      (data ?? []).forEach((r: any) => (r.tags ?? []).forEach((t: string) => t && all.add(t)));
      setSuggestions(Array.from(all).sort());
    })();
  }, [open]);

  const add = (tag: string) => {
    const v = tag.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange([...value, v]);
    setQuery("");
  };
  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const available = suggestions.filter((s) => !value.includes(s));
  const q = query.trim();
  const showCreate = q.length > 0 && !suggestions.some((s) => s.toLowerCase() === q.toLowerCase()) && !value.some((s) => s.toLowerCase() === q.toLowerCase());

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5 min-h-9">
      {value.map((t) => (
        <Badge key={t} variant="secondary" className="text-[10px] gap-1 pl-2 pr-1 py-0.5">
          {t}
          <button type="button" onClick={() => remove(t)} className="rounded hover:bg-muted-foreground/20" aria-label={`Remove ${t}`}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-muted-foreground">
            <Plus className="h-3 w-3 mr-1" /> {value.length ? "Add" : "Add tag"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-64" align="start">
          <Command shouldFilter>
            <CommandInput placeholder="Search or create…" value={query} onValueChange={setQuery}
              onKeyDown={(e) => { if (e.key === "Enter" && showCreate) { e.preventDefault(); add(q); } }} />
            <CommandList>
              <CommandEmpty>{showCreate ? "Press Enter to create" : "No tags"}</CommandEmpty>
              {available.length > 0 && (
                <CommandGroup heading="Existing">
                  {available.map((s) => (
                    <CommandItem key={s} value={s} onSelect={() => add(s)} className="text-xs">
                      <Check className="h-3 w-3 mr-2 opacity-0" />{s}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {showCreate && (
                <CommandGroup heading="Create">
                  <CommandItem value={`__create__${q}`} onSelect={() => add(q)} className="text-xs">
                    <Plus className="h-3 w-3 mr-2" /> Create "{q}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function generatePassword(length = 14) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

// ---------- Manage CRM ----------
function ManageCrmDialog({ open, onClose, customer, onSaved }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<LifecycleStage>("new");
  const [health, setHealth] = useState(50);
  const [risk, setRisk] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer || !open) return;
    setStage(customer.lifecycle_stage);
    setHealth(customer.health_score);
    setRisk(customer.churn_risk_score);
    setLtv(Number(customer.ltv_estimated));
    setTags(customer.tags ?? []);
  }, [customer, open]);

  const save = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await updateCustomerProfile(customer.id, {
        lifecycle_stage: stage,
        health_score: Math.max(0, Math.min(100, health)),
        churn_risk_score: Math.max(0, Math.min(100, risk)),
        ltv_estimated: ltv,
        tags: tags.map((s) => s.trim()).filter(Boolean),
      });
      toast.success(t("crm.edit_customer_modal.updated"));
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-md max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light">Manage CRM</DialogTitle>
          <DialogDescription className="text-xs">Lifecycle stage, scoring and tags for this customer.</DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{customer.full_name} · {customer.email}</p>
            <div>
              <FieldLabel label={t("crm.edit_customer_modal.stage")} hint="Lifecycle stage drives segmentation, health calculation and automations." />
              <Select value={stage} onValueChange={(v) => setStage(v as LifecycleStage)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(LIFECYCLE_META).map((k) => (
                    <SelectItem key={k} value={k}>{t(`crm.lifecycle.${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <FieldLabel label={t("crm.edit_customer_modal.health")} hint="Composite engagement score 0-100. Higher is better." />
                <Input type="number" value={health} onChange={(e) => setHealth(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <FieldLabel label={t("crm.edit_customer_modal.risk")} hint="Predicted churn likelihood 0-100. ≥70 surfaces alerts." />
                <Input type="number" value={risk} onChange={(e) => setRisk(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <FieldLabel label={t("crm.edit_customer_modal.ltv")} hint="Estimated lifetime value in EUR. Drives revenue KPIs." />
                <Input type="number" value={ltv} onChange={(e) => setLtv(+e.target.value)} className="h-9 mt-1" />
              </div>
            </div>
            <div>
              <FieldLabel label={t("crm.edit_customer_modal.tags")} hint="Labels for manual segmentation." />
              <TagsMultiSelect value={tags} onChange={setTags} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("crm.actions.cancel")}</Button>
          <Button className="bg-wj-green hover:bg-wj-green/90" onClick={save} disabled={saving}>
            {saving ? t("crm.actions.saving") : t("crm.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Manage Membership ----------
function ManageMembershipDialog({ open, onClose, customer, onSaved }: Props) {
  const { plans } = usePlans();
  const [subId, setSubId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [billingDate, setBillingDate] = useState<string>("");
  const [loadingSub, setLoadingSub] = useState(false);
  const [busy, setBusy] = useState<null | "assign" | "cancel">(null);

  const loadSub = async (userId: string) => {
    setLoadingSub(true);
    const [{ data: subs }, { data: pms }] = await Promise.all([
      supabase.from("subscriptions")
        .select("id, plan_version_id, status, payment_method, current_period_end")
        .eq("user_id", userId).in("status", ["active", "trialing", "past_due"])
        .order("started_at", { ascending: false }).limit(1),
      supabase.from("payment_methods").select("id").eq("user_id", userId).limit(1),
    ]);
    const sub = (subs ?? [])[0] as any;
    setSubId(sub?.id ?? null);
    setCurrentVersionId(sub?.plan_version_id ?? null);
    setSelectedVersionId(sub?.plan_version_id ?? "");
    setPayMethod((sub?.payment_method as PayMethod) ?? "cash");
    setBillingDate(sub?.current_period_end ? String(sub.current_period_end).slice(0, 10) : "");
    setHasPaymentMethod((pms ?? []).length > 0);
    setLoadingSub(false);
  };

  useEffect(() => { if (customer && open) loadSub(customer.user_id); }, [customer, open]);

  const bankRequiresMethod = payMethod === "bank_transfer" || payMethod === "pos_card";
  const bankBlocked = bankRequiresMethod && !hasPaymentMethod;

  const assignPlan = async () => {
    if (!customer || !selectedVersionId) return;
    if (bankBlocked) { toast.error("Customer has no payment method on file for bank billing"); return; }
    setBusy("assign");
    try {
      if (subId) {
        if (selectedVersionId !== currentVersionId) {
          const { error } = await changeSubscriptionPlan(subId, selectedVersionId);
          if (error) throw error;
        }
        const { error: e2 } = await supabase.from("subscriptions").update({
          payment_method: payMethod,
          ...(billingDate ? { current_period_end: new Date(billingDate).toISOString() } : {}),
        } as any).eq("id", subId);
        if (e2) throw e2;
        toast.success("Subscription updated");
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: customer.user_id, plan_version_id: selectedVersionId, status: "active",
          payment_method: payMethod,
          ...(billingDate ? { current_period_end: new Date(billingDate).toISOString() } : {}),
        } as any);
        if (error) throw error;
        toast.success("Plan assigned");
      }
      await loadSub(customer.user_id);
      onSaved?.();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const cancelSub = async () => {
    if (!subId) return;
    if (!confirm("Cancel this subscription at the end of the current period?")) return;
    setBusy("cancel");
    try {
      const { error } = await cancelSubscription(subId, true);
      if (error) throw error;
      toast.success("Subscription scheduled to cancel");
      if (customer) await loadSub(customer.user_id);
      onSaved?.();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-md max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light">Manage Membership</DialogTitle>
          <DialogDescription className="text-xs">Plan, payment method and billing cycle for this customer.</DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{customer.full_name} · {customer.email}</p>
              {loadingSub ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                : subId ? <Badge variant="outline" className="text-[10px] border-wj-green/40 text-wj-green">Active</Badge>
                : <Badge variant="outline" className="text-[10px]">No subscription</Badge>}
            </div>

            <div>
              <FieldLabel label={subId ? "Change plan" : "Assign plan"} hint="Pick an active membership tier." />
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  {plans.filter((p) => p.activeVersion).map((p) => (
                    <SelectItem key={p.id} value={p.activeVersion!.id}>
                      {p.name} · €{Number(p.activeVersion!.price).toFixed(2)}/{p.activeVersion!.interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel label="Monthly payment method" hint="Cash: collected in-store. Bank: charged from a saved card / SEPA." />
              <div className="grid grid-cols-2 gap-2 mt-1">
                {([{ v: "cash" as PayMethod, label: "Cash", Icon: Banknote },
                   { v: "bank_transfer" as PayMethod, label: "Bank", Icon: CreditCard }]).map(({ v, label, Icon }) => {
                  const selected = payMethod === v;
                  return (
                    <button key={v} type="button" onClick={() => setPayMethod(v)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                        selected ? "border-wj-green bg-wj-green/10 text-foreground"
                          : "border-border/40 hover:bg-muted/30 text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" /><span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <FieldLabel label="Next monthly payment date" hint="Updates current_period_end. Renewals follow this anchor day." />
              <DatePicker value={billingDate} onChange={setBillingDate} className="mt-1" placeholder="Pick a date" />
            </div>

            {bankRequiresMethod && (
              <div className={`flex items-center gap-2 text-xs rounded-lg p-2 border ${
                hasPaymentMethod ? "border-wj-green/30 bg-wj-green/5 text-wj-green"
                  : "border-orange-500/30 bg-orange-500/5 text-orange-400"}`}>
                {hasPaymentMethod ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                <span className="flex-1">
                  {hasPaymentMethod ? "Payment method on file — bank billing ready."
                    : "No payment method on file. Add a card before enabling bank billing."}
                </span>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="flex-wrap gap-2">
          {subId && (
            <Button size="sm" variant="outline" onClick={cancelSub} disabled={busy === "cancel"}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 mr-auto">
              {busy === "cancel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : (<><XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel subscription</>)}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={assignPlan} disabled={!selectedVersionId || busy === "assign" || bankBlocked}
            className="bg-wj-green hover:bg-wj-green/90">
            {busy === "assign" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : (subId ? "Save subscription" : "Assign plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Manage Login Credentials (admin only) ----------
function ManageLoginDialog({ open, onClose, customer, onSaved }: Props) {
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (customer && open) {
      setCredEmail(customer.email ?? "");
      setCredPassword("");
      setShowPassword(false);
    }
  }, [customer, open]);

  const saveCredentials = async () => {
    if (!customer) return;
    const payload: Record<string, unknown> = { user_id: customer.user_id, action: "update_credentials" };
    const emailChanged = credEmail && credEmail.trim() !== (customer.email ?? "").trim();
    if (emailChanged) payload.email = credEmail.trim();
    if (credPassword) payload.password = credPassword;
    if (!emailChanged && !credPassword) { toast.error("Change email or set a new password first"); return; }
    if (credPassword && credPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!confirm(credPassword ? "This will overwrite the user's login password. Continue?" : "Update the user's login email?")) return;
    setSavingCreds(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-member", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Login credentials updated");
      setCredPassword("");
      onSaved?.();
    } catch (e: any) { toast.error(e.message ?? "Failed to update credentials"); } finally { setSavingCreds(false); }
  };

  const sendRecovery = async () => {
    if (!customer?.email) { toast.error("This customer has no email on file"); return; }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(customer.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Recovery email sent to ${customer.email}`);
    } catch (e: any) { toast.error(e.message ?? "Failed to send recovery email"); } finally { setSendingReset(false); }
  };

  const generate = () => {
    const pw = generatePassword(14);
    setCredPassword(pw);
    setShowPassword(true);
    try { navigator.clipboard?.writeText(pw); toast.success("Password generated & copied to clipboard"); }
    catch { toast.success("Password generated"); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-md max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" /> Manage Login Credentials
          </DialogTitle>
          <DialogDescription className="text-xs">
            Admin only. Changes apply immediately and bypass email verification.
          </DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{customer.full_name} · {customer.email}</p>

            <div className="rounded-xl border border-border/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-medium">Send password recovery</h4>
                  <p className="text-[11px] text-muted-foreground">Emails a secure reset link to the user.</p>
                </div>
                <Button size="sm" variant="outline" onClick={sendRecovery} disabled={sendingReset}>
                  {sendingReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : (<><Mail className="h-3.5 w-3.5 mr-1.5" /> Send</>)}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium">Set credentials manually</h4>
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={generate}>
                  <Sparkles className="h-3 w-3 mr-1" /> Generate
                </Button>
              </div>
              <div>
                <FieldLabel label="Login email" hint="Must be unique across all accounts." />
                <Input type="email" autoComplete="off" value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <FieldLabel label="New password" hint="Leave empty to keep current. Minimum 8 characters." />
                <div className="relative mt-1">
                  <Input type={showPassword ? "text" : "password"} autoComplete="new-password"
                    value={credPassword} onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="••••••••" className="h-9 pr-9" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <Button size="sm" onClick={saveCredentials} disabled={savingCreds}
                className="bg-red-500/90 hover:bg-red-500 text-white w-full">
                {savingCreds ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : (<><KeyRound className="h-3.5 w-3.5 mr-1.5" /> Update credentials</>)}
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Chooser ----------
export default function CustomerEditDialog({ open, onClose, customer, onSaved }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [mode, setMode] = useState<Mode>("chooser");

  useEffect(() => { if (open) setMode("chooser"); }, [open, customer?.id]);

  const closeAll = () => { setMode("chooser"); onClose(); };

  const actions: { id: Exclude<Mode, "chooser">; label: string; desc: string; Icon: any; tone: string }[] = [
    { id: "crm", label: "Manage CRM", desc: "Lifecycle stage, scoring and tags.", Icon: UserCog, tone: "text-wj-green" },
    { id: "membership", label: "Manage Membership", desc: "Plan, payment method and billing.", Icon: Wallet, tone: "text-blue-400" },
    ...(isAdmin ? [{ id: "login" as const, label: "Manage Login Credentials", desc: "Email, password and recovery.", Icon: ShieldAlert, tone: "text-red-400" }] : []),
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={open && mode === "chooser"} onOpenChange={(v) => !v && closeAll()}>
        <DialogContent className="bg-background/95 backdrop-blur-md max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light">Edit customer</DialogTitle>
            <DialogDescription className="text-xs">
              {customer ? `${customer.full_name} · ${customer.email}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {actions.map(({ id, label, desc, Icon, tone }) => (
              <button key={id} type="button" onClick={() => setMode(id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors text-left">
                <div className={`h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeAll}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageCrmDialog open={open && mode === "crm"} onClose={closeAll} customer={customer} onSaved={onSaved} />
      <ManageMembershipDialog open={open && mode === "membership"} onClose={closeAll} customer={customer} onSaved={onSaved} />
      {isAdmin && (
        <ManageLoginDialog open={open && mode === "login"} onClose={closeAll} customer={customer} onSaved={onSaved} />
      )}
    </TooltipProvider>
  );
}

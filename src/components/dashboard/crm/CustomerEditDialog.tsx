import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info, CheckCircle2, AlertTriangle, CreditCard, Banknote, XCircle, Loader2 } from "lucide-react";
import { Plus, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/integrations/supabase/client";
import { usePlans, cancelSubscription, changeSubscriptionPlan } from "@/hooks/plans/usePlansData";
import { type CrmCustomer, type LifecycleStage, updateCustomerProfile } from "@/hooks/crm/useCrmData";
import { LIFECYCLE_META } from "./colors";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: CrmCustomer | null;
  onSaved?: () => void;
}

type PayMethod = "cash" | "bank_transfer" | "pos_card" | "other";

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
            <CommandInput
              placeholder="Search or create…"
              value={query}
              onValueChange={setQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreate) {
                  e.preventDefault();
                  add(q);
                }
              }}
            />
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

export default function CustomerEditDialog({ open, onClose, customer, onSaved }: Props) {
  const { t } = useTranslation();
  const { plans } = usePlans();
  const [stage, setStage] = useState<LifecycleStage>("new");
  const [health, setHealth] = useState(50);
  const [risk, setRisk] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [subId, setSubId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [billingDate, setBillingDate] = useState<string>(""); // YYYY-MM-DD — next monthly charge
  const [loadingSub, setLoadingSub] = useState(false);
  const [busy, setBusy] = useState<null | "assign" | "cancel">(null);

  const loadSub = async (userId: string) => {
    setLoadingSub(true);
    const [{ data: subs }, { data: pms }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, plan_version_id, status, payment_method, current_period_end")
        .eq("user_id", userId)
        .in("status", ["active", "trialing", "past_due"])
        .order("started_at", { ascending: false })
        .limit(1),
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

  useEffect(() => {
    if (!customer) return;
    setStage(customer.lifecycle_stage);
    setHealth(customer.health_score);
    setRisk(customer.churn_risk_score);
    setLtv(Number(customer.ltv_estimated));
    setTags(customer.tags ?? []);
    if (open) loadSub(customer.user_id);
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
        tags: tags.map((t) => t.trim()).filter(Boolean),
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

  const bankRequiresMethod = payMethod === "bank_transfer" || payMethod === "pos_card";
  const bankBlocked = bankRequiresMethod && !hasPaymentMethod;

  const assignPlan = async () => {
    if (!customer || !selectedVersionId) return;
    if (bankBlocked) {
      toast.error("Customer has no payment method on file for bank billing");
      return;
    }
    setBusy("assign");
    try {
      if (subId) {
        if (selectedVersionId !== currentVersionId) {
          const { error } = await changeSubscriptionPlan(subId, selectedVersionId);
          if (error) throw error;
        }
        const { error: e2 } = await supabase
          .from("subscriptions")
          .update({
            payment_method: payMethod,
            ...(billingDate ? { current_period_end: new Date(billingDate).toISOString() } : {}),
          } as any)
          .eq("id", subId);
        if (e2) throw e2;
        toast.success("Subscription updated");
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: customer.user_id,
          plan_version_id: selectedVersionId,
          status: "active",
          payment_method: payMethod,
          ...(billingDate ? { current_period_end: new Date(billingDate).toISOString() } : {}),
        } as any);
        if (error) throw error;
        toast.success("Plan assigned");
      }
      await loadSub(customer.user_id);
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-background/95 backdrop-blur-md max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-light">{t("crm.edit_customer_modal.title")}</DialogTitle>
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
                <FieldLabel label={t("crm.edit_customer_modal.tags")} hint="Comma-separated labels for manual segmentation." />
                <TagsMultiSelect value={tags} onChange={setTags} />
              </div>

              <Separator className="my-2" />

              <div className="space-y-3 rounded-xl border border-border/40 p-3 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Membership & Billing</h4>
                    <Hint>Assign or change the member's plan, choose how the monthly fee is collected, and manage cancellation.</Hint>
                  </div>
                  {loadingSub ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : subId ? (
                    <Badge variant="outline" className="text-[10px] border-wj-green/40 text-wj-green">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">No subscription</Badge>
                  )}
                </div>

                <div>
                  <FieldLabel
                    label={subId ? "Change plan" : "Assign plan"}
                    hint="Pick an active membership tier. Changing creates a subscription event and updates billing."
                  />
                  <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                    <SelectContent>
                      {plans
                        .filter((p) => p.activeVersion)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.activeVersion!.id}>
                            {p.name} · €{Number(p.activeVersion!.price).toFixed(2)}/{p.activeVersion!.interval}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FieldLabel
                    label="Monthly payment method"
                    hint="Cash: collected in-store each cycle. Bank: charged from a saved card / SEPA on file."
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {([
                      { v: "cash", label: "Cash", Icon: Banknote },
                      { v: "bank_transfer", label: "Bank", Icon: CreditCard },
                    ] as { v: PayMethod; label: string; Icon: any }[]).map(({ v, label, Icon }) => {
                      const selected = payMethod === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPayMethod(v)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                            selected
                              ? "border-wj-green bg-wj-green/10 text-foreground"
                              : "border-border/40 hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <FieldLabel
                    label="Next monthly payment date"
                    hint="Date of the next subscription charge / cash collection. Updates current_period_end. Renewals follow this anchor day."
                  />
                  <DatePicker
                    value={billingDate}
                    onChange={setBillingDate}
                    className="mt-1"
                    placeholder="Pick a date"
                  />
                </div>

                {bankRequiresMethod && (
                  <div className={`flex items-center gap-2 text-xs rounded-lg p-2 border ${
                    hasPaymentMethod
                      ? "border-wj-green/30 bg-wj-green/5 text-wj-green"
                      : "border-orange-500/30 bg-orange-500/5 text-orange-400"
                  }`}>
                    {hasPaymentMethod ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    <span className="flex-1">
                      {hasPaymentMethod
                        ? "Payment method on file — bank billing ready."
                        : "No payment method on file. Add a card before enabling bank billing."}
                    </span>
                    <Hint>Bank billing needs a stored card or SEPA mandate in payment_methods for this user.</Hint>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={assignPlan}
                        disabled={!selectedVersionId || busy === "assign" || bankBlocked}
                        className="bg-wj-green hover:bg-wj-green/90"
                      >
                        {busy === "assign" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (subId ? "Save subscription" : "Assign plan")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {subId ? "Update plan and/or payment method on the existing subscription." : "Create a new active subscription for this customer."}
                    </TooltipContent>
                  </Tooltip>

                  {subId && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelSub}
                          disabled={busy === "cancel"}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          {busy === "cancel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (<><XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel subscription</>)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        Cancels at the end of the current billing period. Customer keeps access until then.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
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
    </TooltipProvider>
  );
}
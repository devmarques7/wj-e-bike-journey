import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { registerManualPayment } from "@/hooks/plans/usePlansData";

export default function RegisterManualPaymentModal({
  open,
  onOpenChange,
  subscriptionId,
  defaultAmount = 0,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriptionId: string;
  defaultAmount?: number;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "pos_card" | "other">("cash");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast.error(t("plans.payment_modal.amount_required"));
      return;
    }
    setSaving(true);
    const { error } = await registerManualPayment({
      subscription_id: subscriptionId,
      amount,
      method,
      period_start: periodStart || undefined,
      period_end: periodEnd || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("plans.payment_modal.registered"));
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light text-xl">{t("plans.payment_modal.title")}</DialogTitle>
          <DialogDescription>{t("plans.payment_modal.desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("plans.payment_modal.amount")}</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("plans.payment_modal.method")}</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("plans.payment_modal.methods.cash")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("plans.payment_modal.methods.bank_transfer")}</SelectItem>
                  <SelectItem value="pos_card">{t("plans.payment_modal.methods.pos_card")}</SelectItem>
                  <SelectItem value="other">{t("plans.payment_modal.methods.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("plans.payment_modal.period_start")}</Label>
              <DatePicker value={periodStart} onChange={setPeriodStart} placeholder={String(t("plans.payment_modal.period_start_ph"))} />
            </div>
            <div>
              <Label>{t("plans.payment_modal.period_end")}</Label>
              <DatePicker value={periodEnd} onChange={setPeriodEnd} placeholder={String(t("plans.payment_modal.period_end_ph"))} />
            </div>
          </div>
          <div>
            <Label>{t("plans.payment_modal.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("plans.payment_modal.cancel")}</Button>
          <Button onClick={submit} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
            {saving ? t("plans.payment_modal.saving") : t("plans.payment_modal.register")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
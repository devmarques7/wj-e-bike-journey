import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "pos_card" | "other">("cash");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than 0");
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
    toast.success("Payment registered");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light text-xl">Register Manual Payment</DialogTitle>
          <DialogDescription>Record an offline payment (cash, transfer, POS).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (€)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pos_card">POS Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period Start (optional)</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label>Period End (optional)</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
            {saving ? "Saving..." : "Register"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
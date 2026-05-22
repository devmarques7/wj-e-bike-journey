import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { changeSubscriptionPlan, usePlans } from "@/hooks/plans/usePlansData";

export default function ChangePlanModal({
  open,
  onOpenChange,
  subscriptionId,
  currentVersionId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscriptionId: string;
  currentVersionId: string;
  onSaved: () => void;
}) {
  const { plans } = usePlans();
  const [selected, setSelected] = useState<string>(currentVersionId);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelected(currentVersionId), [currentVersionId]);

  const submit = async () => {
    if (!selected || selected === currentVersionId) {
      toast.error("Pick a different plan");
      return;
    }
    setSaving(true);
    const { error } = await changeSubscriptionPlan(subscriptionId, selected);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Plan changed");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light text-xl">Change Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {plans.map((p) => (
            p.activeVersion && (
              <button
                key={p.id}
                onClick={() => setSelected(p.activeVersion!.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selected === p.activeVersion.id ? "border-wj-green bg-wj-green/10" : "border-border/30 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">€{Number(p.activeVersion.price).toFixed(2)} / {p.activeVersion.interval}</div>
                  </div>
                  {p.activeVersion.id === currentVersionId && (
                    <span className="text-xs text-muted-foreground">Current</span>
                  )}
                </div>
              </button>
            )
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
            {saving ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
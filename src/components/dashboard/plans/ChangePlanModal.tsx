import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { plans } = usePlans();
  const [selected, setSelected] = useState<string>(currentVersionId);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelected(currentVersionId), [currentVersionId]);

  const submit = async () => {
    if (!selected || selected === currentVersionId) {
      toast.error(t("plans.change_modal.pick_diff"));
      return;
    }
    setSaving(true);
    const { error } = await changeSubscriptionPlan(subscriptionId, selected);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("plans.change_modal.changed"));
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light text-xl">{t("plans.change_modal.title")}</DialogTitle>
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
                    <div className="text-xs text-muted-foreground">€{Number(p.activeVersion.price).toFixed(2)} / {String(t(`plans.intervals.${p.activeVersion.interval}`, { defaultValue: p.activeVersion.interval }))}</div>
                  </div>
                  {p.activeVersion.id === currentVersionId && (
                    <span className="text-xs text-muted-foreground">{t("plans.change_modal.current")}</span>
                  )}
                </div>
              </button>
            )
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("plans.change_modal.cancel")}</Button>
          <Button onClick={submit} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
            {saving ? t("plans.change_modal.saving") : t("plans.change_modal.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
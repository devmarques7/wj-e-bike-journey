import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type CrmCustomer, type LifecycleStage, updateCustomerProfile } from "@/hooks/crm/useCrmData";
import { LIFECYCLE_META } from "./colors";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: CrmCustomer | null;
  onSaved?: () => void;
}

export default function CustomerEditDialog({ open, onClose, customer, onSaved }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<LifecycleStage>("new");
  const [health, setHealth] = useState(50);
  const [risk, setRisk] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setStage(customer.lifecycle_stage);
    setHealth(customer.health_score);
    setRisk(customer.churn_risk_score);
    setLtv(Number(customer.ltv_estimated));
    setTags((customer.tags ?? []).join(", "));
  }, [customer]);

  const save = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await updateCustomerProfile(customer.id, {
        lifecycle_stage: stage,
        health_score: Math.max(0, Math.min(100, health)),
        churn_risk_score: Math.max(0, Math.min(100, risk)),
        ltv_estimated: ltv,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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
      <DialogContent className="bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-light">{t("crm.edit_customer_modal.title")}</DialogTitle>
        </DialogHeader>
        {customer && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{customer.full_name} · {customer.email}</p>
            <div>
              <Label className="text-xs">{t("crm.edit_customer_modal.stage")}</Label>
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
                <Label className="text-xs">{t("crm.edit_customer_modal.health")}</Label>
                <Input type="number" value={health} onChange={(e) => setHealth(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">{t("crm.edit_customer_modal.risk")}</Label>
                <Input type="number" value={risk} onChange={(e) => setRisk(+e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">{t("crm.edit_customer_modal.ltv")}</Label>
                <Input type="number" value={ltv} onChange={(e) => setLtv(+e.target.value)} className="h-9 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("crm.edit_customer_modal.tags")}</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, recorrente, lisboa" className="h-9 mt-1" />
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
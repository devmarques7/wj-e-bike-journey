import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { createPlan, createPlanVersion, updatePlan, type PlanWithActiveVersion } from "@/hooks/plans/usePlansData";

export default function PlanFormModal({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan?: PlanWithActiveVersion | null;
  onSaved: () => void;
}) {
  const isEdit = Boolean(plan);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tier, setTier] = useState(1);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#058c42");
  const [price, setPrice] = useState(0);
  const [interval, setInterval] = useState<"monthly" | "quarterly" | "yearly" | "lifetime">("monthly");
  const [trial, setTrial] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setTier(plan.tier_level);
      setDescription(plan.description ?? "");
      setColor(plan.color_hex ?? "#058c42");
      setPrice(Number(plan.activeVersion?.price ?? 0));
      setInterval((plan.activeVersion?.interval ?? "monthly") as any);
      setTrial(plan.activeVersion?.trial_days ?? 0);
      setFeatures(plan.activeVersion?.features ?? []);
    } else {
      setName(""); setSlug(""); setTier(1); setDescription(""); setColor("#058c42");
      setPrice(0); setInterval("monthly"); setTrial(0); setFeatures([]);
    }
  }, [plan, open]);

  const save = async () => {
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      let planId = plan?.id;
      if (isEdit && planId) {
        await updatePlan(planId, { name, slug, tier_level: tier, description, color_hex: color });
      } else {
        const { data, error } = await createPlan({ name, slug, tier_level: tier, description, color_hex: color, display_order: tier });
        if (error) throw error;
        planId = data!.id;
      }
      const priceChanged =
        !plan?.activeVersion ||
        Number(plan.activeVersion.price) !== Number(price) ||
        plan.activeVersion.interval !== interval ||
        plan.activeVersion.trial_days !== trial ||
        JSON.stringify(plan.activeVersion.features) !== JSON.stringify(features);
      if (priceChanged && planId) {
        const { error } = await createPlanVersion({
          p_plan_id: planId,
          p_price: price,
          p_interval: interval,
          p_trial_days: trial,
          p_features: features,
          p_activate: true,
        });
        if (error) throw error;
      }
      toast.success(isEdit ? "Plan updated — new version created" : "Plan created");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light text-xl">{isEdit ? `Edit ${plan?.name}` : "New Plan"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Saving creates a new version. Existing subscribers keep the old price (grandfathering)." : "Define the plan and its initial active version."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plus" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="plus" disabled={isEdit} />
          </div>
          <div>
            <Label>Tier Level</Label>
            <Input type="number" value={tier} onChange={(e) => setTier(Number(e.target.value))} />
          </div>
          <div>
            <Label>Color</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div>
            <Label>Price (€)</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <Label>Interval</Label>
            <Select value={interval} onValueChange={(v) => setInterval(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trial Days</Label>
            <Input type="number" value={trial} onChange={(e) => setTrial(Number(e.target.value))} />
          </div>

          <div className="col-span-2">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyDown={(e) => { if (e.key === "Enter" && newFeature.trim()) { setFeatures([...features, newFeature.trim()]); setNewFeature(""); } }}
              />
              <Button type="button" size="icon" variant="outline" onClick={() => { if (newFeature.trim()) { setFeatures([...features, newFeature.trim()]); setNewFeature(""); } }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              {features.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/40 rounded px-3 py-1.5 text-sm">
                  <span>{f}</span>
                  <button onClick={() => setFeatures(features.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
            {saving ? "Saving..." : isEdit ? "Save new version" : "Create plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
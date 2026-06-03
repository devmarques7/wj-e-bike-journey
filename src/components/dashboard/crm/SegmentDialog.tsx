import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSegment, updateSegment, type CrmSegment } from "@/hooks/crm/useCrmData";

interface Props {
  open: boolean;
  onClose: () => void;
  segment?: CrmSegment | null;
  onSaved?: () => void;
}

const PRESET_COLORS = ["#e8593c", "#60a5fa", "#a78bfa", "#f59e0b", "#34d399", "#f87171", "#94a3b8"];

export default function SegmentDialog({ open, onClose, segment, onSaved }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#e8593c");
  const [type, setType] = useState<"dynamic" | "static">("dynamic");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(segment?.name ?? "");
      setDescription(segment?.description ?? "");
      setColor(segment?.color ?? "#e8593c");
      setType((segment?.segment_type as any) ?? "dynamic");
    }
  }, [open, segment]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      if (segment) {
        await updateSegment(segment.id, { name, description, color, segment_type: type });
      } else {
        await createSegment({ name, description, color, segment_type: type });
      }
      toast.success(t("crm.segments.modal.saved"));
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
          <DialogTitle className="font-light">
            {segment ? t("crm.segments.modal.title_edit") : t("crm.segments.modal.title_new")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{t("crm.segments.modal.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("crm.segments.modal.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("crm.segments.modal.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dynamic">{t("crm.segments.modal.type_dynamic")}</SelectItem>
                  <SelectItem value="static">{t("crm.segments.modal.type_static")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("crm.segments.modal.color")}</Label>
              <div className="flex gap-1.5 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("crm.actions.cancel")}</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-wj-green hover:bg-wj-green/90">
            {saving ? t("crm.actions.saving") : t("crm.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
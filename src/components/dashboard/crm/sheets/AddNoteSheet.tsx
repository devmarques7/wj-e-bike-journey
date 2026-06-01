import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logNote } from "@/hooks/crm/useCrmData";

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string;
  onLogged?: () => void;
}

export default function AddNoteSheet({ open, onClose, customerId, customerName, onLogged }: Props) {
  const [noteType, setNoteType] = useState<"general" | "complaint" | "compliment" | "followup" | "opportunity">("general");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [followup, setFollowup] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (content.trim().length < 10) {
      toast.error("Mínimo 10 caracteres");
      return;
    }
    setSaving(true);
    try {
      await logNote({
        customerId,
        content,
        noteType,
        isPinned,
        followupDate: followup || undefined,
      });
      toast.success("Nota guardada");
      setContent("");
      setFollowup("");
      setIsPinned(false);
      onLogged?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Falhou guardar nota");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Nota</SheetTitle>
          <SheetDescription>{customerName ?? "Cliente"}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={noteType} onValueChange={(v) => setNoteType(v as any)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="complaint">Reclamação</SelectItem>
                <SelectItem value="compliment">Elogio</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="opportunity">Oportunidade de venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Conteúdo *</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-2" rows={6} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Fixar nota</Label>
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
          </div>
          <div>
            <Label className="text-xs">Follow-up em (opcional)</Label>
            <Input type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} className="mt-2" />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button className="flex-1 bg-wj-green hover:bg-wj-green/90" onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar nota
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
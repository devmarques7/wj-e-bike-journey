import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Phone, MessageSquare, Mail, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logContact, logNote } from "@/hooks/crm/useCrmData";

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string;
  onLogged?: () => void;
}

export default function LogContactSheet({ open, onClose, customerId, customerName, onLogged }: Props) {
  const [type, setType] = useState<"call" | "whatsapp" | "email" | "in_person">("call");
  const [direction, setDirection] = useState<"outbound" | "inbound">("outbound");
  const [duration, setDuration] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("resolved");
  const [followup, setFollowup] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!summary.trim()) {
      toast.error("Adiciona um resumo");
      return;
    }
    setSaving(true);
    try {
      await logContact({
        customerId,
        type,
        direction,
        durationMin: duration ? Number(duration) : undefined,
        subject: subject || undefined,
        summary,
        outcome,
      });
      if (followup) {
        await logNote({
          customerId,
          content: `Follow-up de contacto: ${subject || summary.slice(0, 60)}`,
          noteType: "followup",
          followupDate: followup,
        });
      }
      toast.success("Contacto registado");
      onLogged?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Falhou registar contacto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registar Contacto</SheetTitle>
          <SheetDescription>{customerName ?? "Cliente"}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs">Tipo</Label>
            <ToggleGroup type="single" value={type} onValueChange={(v) => v && setType(v as any)} className="justify-start mt-2">
              <ToggleGroupItem value="call" aria-label="Chamada"><Phone className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="whatsapp" aria-label="WhatsApp"><MessageSquare className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="email" aria-label="Email"><Mail className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="in_person" aria-label="Presencial"><Users className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label className="text-xs">Direcção</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Entrámos em contacto</SelectItem>
                <SelectItem value="inbound">Cliente contactou-nos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(type === "call" || type === "in_person") && (
            <div>
              <Label className="text-xs">Duração (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-2" />
            </div>
          )}
          <div>
            <Label className="text-xs">Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label className="text-xs">Resumo *</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-2" rows={4} />
          </div>
          <div>
            <Label className="text-xs">Resultado</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="followup_scheduled">Agendou follow-up</SelectItem>
                <SelectItem value="sales_opportunity">Oportunidade de venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Follow-up em (opcional)</Label>
            <Input type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} className="mt-2" />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button className="flex-1 bg-wj-green hover:bg-wj-green/90" onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
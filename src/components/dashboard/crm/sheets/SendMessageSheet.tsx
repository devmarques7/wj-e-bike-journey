import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

/**
 * UI-only sheet for now. Wires to email/WhatsApp providers in a future iteration.
 */
export default function SendMessageSheet({ open, onClose, customerName, customerEmail, customerPhone }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (channel: "email" | "whatsapp") => {
    if (!message.trim()) {
      toast.error("Mensagem vazia");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`Mensagem ${channel === "email" ? "de email" : "WhatsApp"} preparada (envio real será activado em breve)`);
    setSubject("");
    setMessage("");
    setSending(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Contactar {customerName ?? "cliente"}</SheetTitle>
          <SheetDescription>Escolhe o canal de envio</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="email" className="mt-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" /> Email</TabsTrigger>
            <TabsTrigger value="whatsapp"><MessageSquare className="h-4 w-4 mr-2" /> WhatsApp</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs">Para</Label>
              <Input value={customerEmail ?? ""} disabled className="mt-2" />
            </div>
            <div>
              <Label className="text-xs">Assunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="mt-2" />
            </div>
            <Button className="w-full bg-wj-green hover:bg-wj-green/90" onClick={() => send("email")} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar email
            </Button>
          </TabsContent>
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs">Para</Label>
              <Input value={customerPhone ?? ""} disabled className="mt-2" />
            </div>
            <div>
              <Label className="text-xs">Mensagem (template aprovado)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                A WhatsApp Business API só permite templates pré-aprovados.
              </p>
            </div>
            <Button className="w-full bg-wj-green hover:bg-wj-green/90" onClick={() => send("whatsapp")} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar WhatsApp
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
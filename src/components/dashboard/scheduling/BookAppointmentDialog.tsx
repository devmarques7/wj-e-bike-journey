import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Bike, CalendarDays, Clock, UserCheck, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ServiceType } from "@/hooks/scheduling/useSchedulingData";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Customer = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

type Slot = {
  start: string; // "HH:MM"
  end: string;
  mechanicId: string;
  mechanicName: string;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  serviceTypes: ServiceType[];
  onCreated?: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/* ------------------------------------------------------------------ */

export default function BookAppointmentDialog({
  open,
  onOpenChange,
  serviceTypes,
  onCreated,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Customer
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Bike info
  const [bikeModel, setBikeModel] = useState("");
  const [bikeSerial, setBikeSerial] = useState("");
  const [notes, setNotes] = useState("");

  // Service & date
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<Slot | null>(null);

  // Availability
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedService = useMemo(
    () => serviceTypes.find((s) => s.id === serviceId) ?? null,
    [serviceTypes, serviceId],
  );

  /* ---------- reset on close ---------- */
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSearch("");
      setCustomers([]);
      setCustomer(null);
      setBikeModel("");
      setBikeSerial("");
      setNotes("");
      setServiceId("");
      setDate(todayISO());
      setSlot(null);
      setSlots([]);
    }
  }, [open]);

  /* ---------- customer search ---------- */
  useEffect(() => {
    if (!open || step !== 1) return;
    const term = search.trim();
    if (term.length < 2) {
      setCustomers([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(8);
      if (cancelled) return;
      if (!error) setCustomers((data ?? []) as Customer[]);
      setSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, open, step]);

  /* ---------- availability ---------- */
  const computeSlots = useCallback(async () => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSlot(null);
    try {
      const dow = new Date(date + "T00:00:00").getDay();

      // 1. Business hours for that day (latest valid version)
      const { data: bhData } = await supabase
        .from("business_hours")
        .select("*")
        .eq("day_of_week", dow)
        .lte("valid_from", date);
      const validBh = (bhData ?? [])
        .filter((r: any) => !r.valid_until || r.valid_until >= date)
        .sort((a: any, b: any) => (a.valid_from < b.valid_from ? 1 : -1))[0];

      // 2. Holiday/exception override
      const { data: bheData } = await supabase
        .from("business_hour_exceptions")
        .select("*")
        .eq("exception_date", date)
        .maybeSingle();

      let openTime: string | null = validBh?.open_time ?? null;
      let closeTime: string | null = validBh?.close_time ?? null;
      let workshopOpen = !!validBh?.is_open;
      const buffer = validBh?.buffer_minutes ?? 15;

      if (bheData) {
        workshopOpen = !!bheData.is_open;
        openTime = bheData.open_time ?? openTime;
        closeTime = bheData.close_time ?? closeTime;
      }

      if (!workshopOpen || !openTime || !closeTime) {
        setSlots([]);
        return;
      }

      // 3. Staff schedules for that day
      const { data: ssData } = await supabase
        .from("staff_schedules")
        .select("*")
        .eq("day_of_week", dow)
        .eq("is_working", true)
        .lte("valid_from", date);
      const validSs = (ssData ?? []).filter(
        (r: any) => !r.valid_until || r.valid_until >= date,
      );
      // Keep latest version per staff
      const ssByStaff = new Map<string, any>();
      for (const r of validSs) {
        const prev = ssByStaff.get(r.staff_id);
        if (!prev || prev.valid_from < r.valid_from) ssByStaff.set(r.staff_id, r);
      }
      const staffIds = Array.from(ssByStaff.keys());
      if (staffIds.length === 0) {
        setSlots([]);
        return;
      }

      // 4. Staff names
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", staffIds);
      const nameMap = new Map<string, string>(
        (profs ?? []).map((p: any) => [p.user_id, p.full_name ?? "Mecânico"]),
      );

      // 5. Existing appointments that day
      const { data: appts } = await supabase
        .from("appointments")
        .select("assigned_mechanic_id, scheduled_start_time, duration_minutes")
        .eq("scheduled_date", date)
        .in("status", ["pending", "confirmed", "in_progress"]);
      const busyByMech = new Map<string, Array<[number, number]>>();
      (appts ?? []).forEach((a: any) => {
        if (!a.assigned_mechanic_id) return;
        const s = toMinutes(a.scheduled_start_time);
        const e = s + (a.duration_minutes ?? selectedService.duration_minutes);
        const arr = busyByMech.get(a.assigned_mechanic_id) ?? [];
        arr.push([s, e]);
        busyByMech.set(a.assigned_mechanic_id, arr);
      });

      // 6. Generate slots: step = service duration + buffer, snapped to 15min
      const dur = selectedService.duration_minutes;
      const stepMin = 30;
      const openM = toMinutes(openTime);
      const closeM = toMinutes(closeTime);
      const out: Slot[] = [];
      for (let t = openM; t + dur <= closeM; t += stepMin) {
        // find first available mechanic
        for (const staffId of staffIds) {
          const sched = ssByStaff.get(staffId);
          const sStart = toMinutes(sched.start_time);
          const sEnd = toMinutes(sched.end_time);
          if (t < sStart || t + dur > sEnd) continue;
          const busy = busyByMech.get(staffId) ?? [];
          const overlaps = busy.some(
            ([bs, be]) => Math.max(bs, t) < Math.min(be, t + dur + buffer),
          );
          if (overlaps) continue;
          out.push({
            start: fromMinutes(t),
            end: fromMinutes(t + dur),
            mechanicId: staffId,
            mechanicName: nameMap.get(staffId) ?? "Mecânico",
          });
          break;
        }
      }
      setSlots(out);
    } catch (e: any) {
      console.error("[book] slots error", e);
      toast.error("Falha ao calcular disponibilidade");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedService, date]);

  useEffect(() => {
    if (open && step === 3 && selectedService) computeSlots();
  }, [open, step, computeSlots, selectedService]);

  /* ---------- submit ---------- */
  const submit = async () => {
    if (!customer || !selectedService || !slot) return;
    setSubmitting(true);
    try {
      const bikeLine =
        bikeModel || bikeSerial
          ? `Bicicleta: ${bikeModel || "—"}${bikeSerial ? ` · Nº série/matrícula: ${bikeSerial}` : ""}`
          : "";
      const combinedNotes = [bikeLine, notes].filter(Boolean).join("\n");

      const { error } = await supabase.from("appointments").insert({
        user_id: customer.user_id,
        service_type_id: selectedService.id,
        assigned_mechanic_id: slot.mechanicId,
        scheduled_date: date,
        scheduled_start_time: `${slot.start}:00`,
        scheduled_end_time: `${slot.end}:00`,
        duration_minutes: selectedService.duration_minutes,
        status: "confirmed",
        priority: "normal",
        booked_via: "admin",
        notes: combinedNotes || null,
      });
      if (error) throw error;

      toast.success("Agendamento registado");
      onCreated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- gating ---------- */
  const canNext1 = !!customer;
  const canNext2 = !!serviceId;
  const canSubmit = !!slot && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-light flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-wj-green" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription className="text-xs">
            Passo {step} de 3 — {step === 1 ? "Cliente & bicicleta" : step === 2 ? "Serviço" : "Data & horário"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step >= s ? "bg-wj-green" : "bg-muted",
              )}
            />
          ))}
        </div>

        {/* STEP 1: Customer + bike */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Procurar cliente</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome ou email…"
                  className="pl-9 text-sm"
                />
              </div>
              {searching && (
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> A procurar…
                </p>
              )}
              {customers.length > 0 && !customer && (
                <div className="mt-2 max-h-44 overflow-y-auto border border-border/30 rounded-lg divide-y divide-border/30">
                  {customers.map((c) => (
                    <button
                      key={c.user_id}
                      onClick={() => setCustomer(c)}
                      className="w-full text-left p-2 hover:bg-muted/40 text-xs"
                    >
                      <div className="font-medium">{c.full_name ?? "—"}</div>
                      <div className="text-muted-foreground">{c.email}</div>
                    </button>
                  ))}
                </div>
              )}
              {customer && (
                <div className="mt-2 p-3 border border-wj-green/30 bg-wj-green/5 rounded-lg flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-medium">{customer.full_name ?? "—"}</div>
                    <div className="text-muted-foreground">{customer.email}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px]"
                    onClick={() => setCustomer(null)}
                  >
                    Trocar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Bike className="h-3 w-3" /> Modelo da bicicleta
                </Label>
                <Input
                  value={bikeModel}
                  onChange={(e) => setBikeModel(e.target.value)}
                  placeholder="WJ Vision Black"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nº série / matrícula</Label>
                <Input
                  value={bikeSerial}
                  onChange={(e) => setBikeSerial(e.target.value)}
                  placeholder="VIN-XXXX"
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descrição do problema ou pedido…"
                className="mt-1 text-sm min-h-16"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Service */}
        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-xs">Tipo de serviço</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {serviceTypes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    serviceId === s.id
                      ? "border-wj-green/60 bg-wj-green/5"
                      : "border-border/30 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color ?? "#9ca3af" }}
                      />
                      {s.name}
                    </span>
                    {s.is_emergency && (
                      <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
                        Urgência
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {s.duration_minutes}m
                    </span>
                    {s.base_price != null && <span>€ {Number(s.base_price).toFixed(2)}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Date + slots */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div className="text-xs text-muted-foreground pb-2">
                {selectedService?.name} · {selectedService?.duration_minutes}m
              </div>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Horários disponíveis
              </Label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> A analisar disponibilidade…
                </div>
              ) : slots.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg mt-2">
                  Sem horários disponíveis nesta data.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-64 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <button
                      key={`${s.start}-${s.mechanicId}`}
                      onClick={() => setSlot(s)}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-colors",
                        slot?.start === s.start && slot?.mechanicId === s.mechanicId
                          ? "border-wj-green/60 bg-wj-green/10"
                          : "border-border/30 hover:bg-muted/40",
                      )}
                    >
                      <div className="text-sm font-medium">{s.start}</div>
                      <div className="text-[9px] text-muted-foreground truncate">
                        {s.mechanicName}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {slot && (
              <div className="p-3 rounded-lg border border-wj-green/30 bg-wj-green/5 text-xs space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-wj-green" /> Pronto a confirmar
                </div>
                <div className="text-muted-foreground">
                  {customer?.full_name} · {selectedService?.name} · {date} {slot.start}–{slot.end} · {slot.mechanicName}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              disabled={submitting}
            >
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="bg-wj-green hover:bg-wj-green/90 text-black"
            >
              Continuar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={submit}
              disabled={!canSubmit}
              className="bg-wj-green hover:bg-wj-green/90 text-black"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> A registar…
                </>
              ) : (
                "Confirmar agendamento"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
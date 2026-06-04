import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles } from "lucide-react";
import FieldLabel from "@/components/dashboard/inventory/FieldLabel";
import {
  useServiceTypesCrud,
  type ServiceTypeRow,
} from "@/hooks/scheduling/useServiceTypesCrud";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface Props {
  service: ServiceTypeRow | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type PlanOption = {
  value: number;
  label: string;
  color: string | null;
};

export default function ServiceTypeEditDialog({ service, open, onClose, onSaved }: Props) {
  const { upsert } = useServiceTypesCrud();
  const [form, setForm] = useState<Partial<ServiceTypeRow>>({});
  const [busy, setBusy] = useState(false);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("name, tier_level, color_hex, is_active")
        .eq("is_active", true)
        .order("tier_level", { ascending: true });
      if (error) {
        console.error("[ServiceTypeEditDialog] plans fetch", error);
        return;
      }
      setPlanOptions(
        (data ?? [])
          .filter((p: any) => typeof p.tier_level === "number" && p.tier_level > 0)
          .map((p: any) => ({
            value: p.tier_level,
            label: p.name,
            color: p.color_hex ?? null,
          })),
      );
    })();
  }, [open]);

  useEffect(() => {
    setForm(
      service ?? {
        name: "",
        slug: "",
        duration_minutes: 60,
        base_price: 0,
        color: "#058c42",
        icon: "wrench",
        display_order: 0,
        priority_score: 0,
        reward_points: 0,
        is_active: true,
        is_emergency: false,
        covered_by_plan_levels: [],
      },
    );
  }, [service, open]);

  const update = <K extends keyof ServiceTypeRow>(k: K, v: ServiceTypeRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const togglePlan = (lvl: number) => {
    const cur = new Set(form.covered_by_plan_levels ?? []);
    cur.has(lvl) ? cur.delete(lvl) : cur.add(lvl);
    update("covered_by_plan_levels", Array.from(cur).sort() as any);
  };

  const save = async () => {
    if (!form.name || !form.duration_minutes) {
      return;
    }
    setBusy(true);
    const saved = await upsert({
      ...(form as any),
      slug: form.slug || slugify(form.name!),
      base_price: form.base_price != null ? Number(form.base_price) : null,
      duration_minutes: Number(form.duration_minutes),
      display_order: Number(form.display_order ?? 0),
      priority_score: Number(form.priority_score ?? 0),
      reward_points: Number(form.reward_points ?? 0),
      buffer_minutes_override:
        form.buffer_minutes_override != null && form.buffer_minutes_override !== ("" as any)
          ? Number(form.buffer_minutes_override)
          : null,
    });
    setBusy(false);
    if (saved) {
      onSaved?.();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light">
            {service ? "Editar serviço" : "Novo serviço"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FieldLabel
              label="Nome"
              required
              hint="Nome público do serviço apresentado ao cliente (ex.: 'Revisão Completa')."
            />
            <Input
              value={form.name ?? ""}
              onChange={(e) => update("name", e.target.value)}
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Slug"
              hint="Identificador URL (ex.: revisao-completa). Deixe vazio para gerar a partir do nome."
            />
            <Input
              value={form.slug ?? ""}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="auto"
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Ordem"
              hint="Ordem de apresentação na lista de serviços."
            />
            <Input
              type="number"
              value={form.display_order ?? 0}
              onChange={(e) => update("display_order", Number(e.target.value) as any)}
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Duração (min)"
              required
              hint="Duração estimada do serviço em minutos. Usado para calcular slots disponíveis."
            />
            <Input
              type="number"
              value={form.duration_minutes ?? 60}
              onChange={(e) => update("duration_minutes", Number(e.target.value) as any)}
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Preço base (EUR)"
              hint="Preço cobrado quando o serviço não está coberto pela subscrição."
            />
            <Input
              type="number"
              step="0.01"
              value={form.base_price ?? 0}
              onChange={(e) => update("base_price", Number(e.target.value) as any)}
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Cor"
              hint="Cor de destaque usada nos calendários e cartões do serviço."
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color ?? "#058c42"}
                onChange={(e) => update("color", e.target.value)}
                className="h-9 w-12 rounded-md border border-border/40 bg-transparent cursor-pointer"
              />
              <Input
                value={form.color ?? ""}
                onChange={(e) => update("color", e.target.value)}
                className="bg-background/60"
              />
            </div>
          </div>

          <div>
            <FieldLabel
              label="Ícone"
              hint="Nome do ícone lucide-react (ex.: wrench, settings, zap)."
            />
            <Input
              value={form.icon ?? ""}
              onChange={(e) => update("icon", e.target.value)}
              placeholder="wrench"
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Prioridade"
              hint="Pontuação de prioridade na fila (maior = atendido primeiro)."
            />
            <Input
              type="number"
              value={form.priority_score ?? 0}
              onChange={(e) => update("priority_score", Number(e.target.value) as any)}
              className="bg-background/60"
            />
          </div>

          <div>
            <FieldLabel
              label="Buffer (min)"
              hint="Tempo extra entre marcações para este serviço. Deixe vazio para usar o buffer global."
            />
            <Input
              type="number"
              value={form.buffer_minutes_override ?? ""}
              onChange={(e) =>
                update("buffer_minutes_override", (e.target.value === "" ? null : Number(e.target.value)) as any)
              }
              placeholder="auto"
              className="bg-background/60"
            />
          </div>

          <div className="col-span-2">
            <FieldLabel
              label="Descrição"
              hint="Resumo apresentado ao cliente na altura do agendamento."
            />
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              className="bg-background/60"
            />
          </div>

          <div className="col-span-2">
            <FieldLabel
              label="Coberto pelos planos"
              hint="Quais níveis de subscrição incluem este serviço sem custo extra."
            />
            <div className="flex flex-wrap gap-2 mt-1">
              {PLAN_LEVELS.map((p) => {
                const active = (form.covered_by_plan_levels ?? []).includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlan(p.value)}
                    className={`px-3 h-8 rounded-full text-xs border transition ${
                      active
                        ? "bg-wj-green/15 border-wj-green/40 text-wj-green"
                        : "border-border/40 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={!!form.is_active}
              onCheckedChange={(v) => update("is_active", v)}
            />
            <FieldLabel
              label="Ativo"
              hint="Quando desligado, o serviço não aparece para agendamento."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={!!form.is_emergency}
              onCheckedChange={(v) => update("is_emergency", v)}
            />
            <FieldLabel
              label="Emergência"
              hint="Marca o serviço como urgente — destaca-o no portal e na agenda."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={busy}
            className="bg-wj-green hover:bg-wj-green/90 text-black"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Wrench,
  Loader2,
  Zap,
  Upload,
} from "lucide-react";
import {
  useServiceTypesCrud,
  type ServiceTypeRow,
} from "@/hooks/scheduling/useServiceTypesCrud";
import ServiceTypeEditDialog from "./ServiceTypeEditDialog";
import ServiceTypesImportDialog from "./ServiceTypesImportDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ServiceTypesManagerDialog({ open, onOpenChange }: Props) {
  const { rows, loading, remove, toggleActive, refetch } = useServiceTypesCrud();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ServiceTypeRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = rows.filter((r) =>
    [r.name, r.slug, r.description ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (r: ServiceTypeRow) => {
    setEditing(r);
    setEditorOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-light flex items-center gap-2">
              <Wrench className="h-4 w-4 text-wj-green" />
              Catálogo de Serviços
            </DialogTitle>
            <DialogDescription className="text-xs">
              Faça a gestão dos serviços de revisão da empresa. Crie, edite ou desative tipos de
              serviço usados nos agendamentos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar serviço…"
                className="h-9 pl-8 bg-background/60 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="h-9 text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> Importar
            </Button>
            <Button
              size="sm"
              onClick={openNew}
              className="h-9 bg-wj-green hover:bg-wj-green/90 text-black"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo Serviço
            </Button>
          </div>

          <div className="mt-3 -mx-2 px-2 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Nenhum serviço encontrado.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {filtered.map((s) => (
                  <li
                    key={s.id}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/30 bg-background/40 hover:bg-muted/30 transition"
                  >
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${s.color ?? "#058c42"}22` }}
                    >
                      {s.is_emergency ? (
                        <Zap className="h-4 w-4" style={{ color: s.color ?? "#058c42" }} />
                      ) : (
                        <Wrench className="h-4 w-4" style={{ color: s.color ?? "#058c42" }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{s.name}</span>
                        {!s.is_active && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 border-border/40 text-muted-foreground"
                          >
                            inativo
                          </Badge>
                        )}
                        {s.is_emergency && (
                          <Badge className="text-[9px] h-4 bg-red-500/15 text-red-400 border-red-500/30">
                            urgência
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{s.duration_minutes} min</span>
                        <span>
                          {s.base_price != null
                            ? `€ ${Number(s.base_price).toFixed(2)}`
                            : "—"}
                        </span>
                        <span className="truncate">/{s.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition">
                      <Switch
                        checked={s.is_active}
                        onCheckedChange={(v) => toggleActive(s.id, v)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setConfirmDel(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <span className="text-[11px] text-muted-foreground">
              {rows.length} serviço(s) · {rows.filter((r) => r.is_active).length} ativo(s)
            </span>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ServiceTypeEditDialog
        service={editing}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={refetch}
      />

      <ServiceTypesImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refetch}
      />

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/40 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-light">Remover serviço?</DialogTitle>
            <DialogDescription className="text-xs">
              Esta ação é definitiva. Agendamentos existentes mantêm a referência mas não será
              possível agendar novamente este serviço.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-500/90 text-white"
              onClick={async () => {
                if (confirmDel) {
                  await remove(confirmDel);
                  setConfirmDel(null);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
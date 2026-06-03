import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon, Check, Loader2, Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BusinessHourException } from "@/hooks/scheduling/useSchedulingData";

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const trim = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exceptions: BusinessHourException[];
  onChanged: () => void;
}

export default function ExceptionsCalendarDialog({ open, onOpenChange, exceptions, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("pt") ? "pt-PT" : "en-GB";
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [isOpen, setIsOpen] = useState<boolean>(false); // default closed
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const map = useMemo(() => {
    const m = new Map<string, BusinessHourException>();
    exceptions.forEach((e) => m.set(e.exception_date, e));
    return m;
  }, [exceptions]);

  const closedDates = useMemo(
    () => exceptions.filter((e) => !e.is_open && !e.is_public_holiday).map((e) => new Date(e.exception_date + "T00:00:00")),
    [exceptions],
  );
  const specialDates = useMemo(
    () => exceptions.filter((e) => e.is_open).map((e) => new Date(e.exception_date + "T00:00:00")),
    [exceptions],
  );
  const holidayDates = useMemo(
    () => exceptions.filter((e) => e.is_public_holiday).map((e) => new Date(e.exception_date + "T00:00:00")),
    [exceptions],
  );

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exceptions
      .filter((e) => e.is_public_holiday && new Date(e.exception_date + "T00:00:00") >= today)
      .sort((a, b) => a.exception_date.localeCompare(b.exception_date));
  }, [exceptions]);

  useEffect(() => {
    if (!selected) return;
    const ex = map.get(ymd(selected));
    if (ex) {
      setIsOpen(ex.is_open);
      setOpenTime(trim(ex.open_time) || "09:00");
      setCloseTime(trim(ex.close_time) || "18:00");
      setReason(ex.reason ?? "");
    } else {
      // default closed
      setIsOpen(false);
      setOpenTime("09:00");
      setCloseTime("18:00");
      setReason("");
    }
  }, [selected, map]);

  const existing = selected ? map.get(ymd(selected)) : undefined;

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        exception_date: ymd(selected),
        is_open: isOpen,
        exception_type: isOpen ? "reduced_hours" : "closed",
        open_time: isOpen ? openTime : null,
        close_time: isOpen ? closeTime : null,
        reason: reason || (isOpen ? "Special hours" : "Closed"),
        is_public_holiday: false,
      };
      let error;
      if (existing) {
        ({ error } = await supabase.from("business_hour_exceptions").update(payload).eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("business_hour_exceptions").insert(payload));
      }
      if (error) throw error;
      toast.success(t("manage.exceptions_modal.saved"));
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("business_hour_exceptions").delete().eq("id", existing.id);
      if (error) throw error;
      toast.success(t("manage.exceptions_modal.deleted"));
      onChanged();
      setSelected(undefined);
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CalendarIcon className="h-4 w-4 text-wj-green" />
            {t("manage.exceptions_modal.title")}
          </DialogTitle>
          <DialogDescription>{t("manage.exceptions_modal.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
          {/* Calendar */}
          <div className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={{ closedEx: closedDates, specialEx: specialDates, holidayEx: holidayDates }}
              modifiersClassNames={{
                closedEx: "bg-red-500/20 text-red-400 font-semibold",
                specialEx: "bg-amber-500/20 text-amber-400 font-semibold",
                holidayEx: "bg-wj-green/30 text-wj-green font-semibold ring-1 ring-wj-green/50",
              }}
              showOutsideDays
              className={cn("p-4 pointer-events-auto rounded-2xl border border-border/30 bg-background/40 w-full")}
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-3 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-semibold text-foreground",
                nav: "space-x-1 flex items-center",
                nav_button:
                  "h-7 w-7 bg-transparent p-0 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-wj-green/10 hover:border-wj-green/40 transition-colors inline-flex items-center justify-center",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell:
                  "text-muted-foreground/70 rounded-md flex-1 font-medium text-[0.7rem] uppercase tracking-wider h-8 flex items-center justify-center",
                row: "flex w-full mt-1",
                cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-9 w-full p-0 font-normal rounded-lg hover:bg-wj-green/10 hover:text-wj-green transition-colors inline-flex items-center justify-center text-foreground",
                day_selected:
                  "bg-wj-green text-white hover:bg-wj-green hover:text-white focus:bg-wj-green focus:text-white",
                day_today: "ring-1 ring-wj-green/60 text-wj-green font-semibold",
                day_outside: "text-muted-foreground/40",
                day_disabled: "text-muted-foreground/30 opacity-50",
                day_hidden: "invisible",
              }}
            />
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-wj-green/60" />
                {t("manage.exceptions_modal.legend_holiday", "Holiday")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                {t("manage.exceptions_modal.legend_closed")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                {t("manage.exceptions_modal.legend_special")}
              </span>
            </div>
          </div>

          {/* Editor */}
          <div className="rounded-2xl border border-border/30 bg-muted/20 p-4 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-muted-foreground py-12">
                {t("manage.exceptions_modal.pick_date")}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {selected.toLocaleDateString(locale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {existing
                        ? t("manage.exceptions_modal.existing")
                        : t("manage.exceptions_modal.new_default_closed")}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px]",
                      isOpen
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30",
                    )}
                  >
                    {isOpen ? t("manage.exceptions_modal.open") : t("manage.exceptions_modal.closed")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {t("manage.exceptions_modal.open_toggle")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("manage.exceptions_modal.open_toggle_hint")}
                    </p>
                  </div>
                  <Switch checked={isOpen} onCheckedChange={setIsOpen} />
                </div>

                {isOpen && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t("manage.exceptions_modal.open_time")}
                      </label>
                      <Input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t("manage.exceptions_modal.close_time")}
                      </label>
                      <Input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("manage.exceptions_modal.reason")}
                  </label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("manage.exceptions_modal.reason_placeholder")}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  {existing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("manage.exceptions_modal.delete")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="ml-auto bg-wj-green hover:bg-wj-green/90 text-white gap-1.5"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {t("manage.exceptions_modal.save")}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Dutch Holidays list */}
          <div className="rounded-2xl border border-border/30 bg-muted/20 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-wj-green" />
              <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">
                {t("manage.exceptions_modal.holidays_title", "Dutch Holidays")}
              </h3>
            </div>
            <ScrollArea className="flex-1 max-h-[420px] pr-2">
              <div className="space-y-1.5">
                {upcomingHolidays.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-6">
                    {t("manage.exceptions_modal.no_holidays", "No upcoming holidays")}
                  </p>
                ) : (
                  upcomingHolidays.map((h) => {
                    const d = new Date(h.exception_date + "T00:00:00");
                    const isSelected = selected && ymd(selected) === h.exception_date;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setSelected(d)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg border transition-all hover:border-wj-green/40 hover:bg-wj-green/5",
                          isSelected
                            ? "border-wj-green/50 bg-wj-green/10"
                            : "border-border/30 bg-background/40",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground truncate">
                              {h.reason}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {d.toLocaleDateString(locale, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <Badge className="text-[9px] bg-wj-green/20 text-wj-green border-wj-green/30 shrink-0">
                            {t("manage.exceptions_modal.closed")}
                          </Badge>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
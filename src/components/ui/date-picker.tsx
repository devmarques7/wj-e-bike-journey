import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  /** ISO date string YYYY-MM-DD */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Disable dates before this ISO date (YYYY-MM-DD). */
  min?: string;
  /** Disable dates after this ISO date (YYYY-MM-DD). */
  max?: string;
  id?: string;
}

/**
 * Project-wide date picker built from shadcn `Popover` + `Calendar`.
 * Uses string values (YYYY-MM-DD) for easy interop with form state and APIs.
 * Never use native <input type="date"> — always use this component.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  min,
  max,
  id,
}: DatePickerProps) {
  const selected = value ? parseISO(value) : undefined;
  const safe = selected && isValid(selected) ? selected : undefined;
  const minDate = min ? parseISO(min) : undefined;
  const maxDate = max ? parseISO(max) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!safe}
          className={cn(
            "h-9 w-full justify-start text-left font-normal",
            "data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 mr-2" />
          {safe ? format(safe, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={safe}
          onSelect={(d) => onChange?.(d ? format(d, "yyyy-MM-dd") : "")}
          disabled={(d) =>
            (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false)
          }
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
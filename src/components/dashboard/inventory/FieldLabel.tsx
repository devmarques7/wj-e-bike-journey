import { Info } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  hint: string;
  required?: boolean;
  className?: string;
}

/** Inline form label with hover info icon explaining the field. */
export default function FieldLabel({ label, hint, required, className }: Props) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      <TooltipPrimitive.Provider delayDuration={120}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <button type="button" className="text-muted-foreground/60 hover:text-wj-green transition-colors">
              <Info className="h-3 w-3" />
            </button>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="top"
              sideOffset={6}
              collisionPadding={12}
              avoidCollisions
              className="z-[200] max-w-[260px] rounded-md border border-border/40 bg-background/95 backdrop-blur-md px-3 py-1.5 text-[11px] leading-relaxed text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              {hint}
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    </div>
  );
}
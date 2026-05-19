import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      <TooltipProvider delayDuration={120}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/60 hover:text-wj-green transition-colors">
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-[11px] leading-relaxed bg-background/95 backdrop-blur-md border-border/40">
            {hint}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
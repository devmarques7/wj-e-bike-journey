import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BikePreset = { name: string; hex: string };

export const BIKE_COLOR_PRESETS: BikePreset[] = [
  { name: "WJ Green", hex: "#058c42" },
  { name: "Midnight Black", hex: "#0a0a0a" },
  { name: "Arctic White", hex: "#f5f5f5" },
  { name: "Storm Grey", hex: "#4a4a4a" },
  { name: "Signal Red", hex: "#c0392b" },
  { name: "Ocean Blue", hex: "#1e3a8a" },
  { name: "Sand Beige", hex: "#c9b99a" },
  { name: "Sunset Orange", hex: "#e85d3a" },
];

interface Props {
  value: string | null | undefined;
  onChange: (hex: string | null) => void;
  presets?: BikePreset[];
  allowClear?: boolean;
  className?: string;
}

export default function BikeColorPicker({
  value,
  onChange,
  presets = BIKE_COLOR_PRESETS,
  allowClear = true,
  className,
}: Props) {
  const current = value ?? "";
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3 bg-background/60 border border-input rounded-md px-3 py-2">
        <input
          type="color"
          value={current || "#058c42"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 rounded cursor-pointer bg-transparent border-0 p-0"
        />
        <Input
          value={current}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="#058c42"
          className="bg-transparent border-0 h-8 px-0 focus-visible:ring-0"
        />
        {allowClear && current && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-[10px] h-7"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = current.toLowerCase() === p.hex.toLowerCase();
          return (
            <button
              key={p.hex}
              type="button"
              onClick={() => onChange(p.hex)}
              title={`${p.name} (${p.hex})`}
              className={cn(
                "relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                active ? "border-wj-green ring-2 ring-wj-green/30" : "border-border/60",
              )}
              style={{ backgroundColor: p.hex }}
            >
              {active && (
                <Check
                  className="absolute inset-0 m-auto h-4 w-4"
                  style={{ color: isLight(p.hex) ? "#000" : "#fff" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
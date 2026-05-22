import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Props {
  current: string;
  to?: string;
  parentLabel?: string;
}

export default function InventoryBackHeader({ current, to = "/dashboard/admin/inventory", parentLabel = "Inventory" }: Props) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-background/40 backdrop-blur-md hover:bg-background/70 transition-all w-fit"
    >
      <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:-translate-x-0.5 transition-transform" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground">
        {parentLabel}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-foreground">{current}</span>
    </Link>
  );
}
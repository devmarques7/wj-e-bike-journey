import { motion } from "framer-motion";
import { Inbox, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Minimalist "No data" placeholder used inside dashboard cards
 * when the authenticated user has no records yet.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data",
  description = "Nothing to show yet.",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "h-full w-full min-h-[160px] flex flex-col items-center justify-center text-center px-6 py-8",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground/80">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
        {description}
      </p>
    </motion.div>
  );
}
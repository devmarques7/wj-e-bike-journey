import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface FinishShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  working?: boolean;
}

/**
 * Confirmation modal before ending the shift. Once confirmed, the shift is
 * locked for the rest of the day — it cannot be reopened until 00:00 next day.
 */
export function FinishShiftDialog({
  open,
  onOpenChange,
  onConfirm,
  working,
}: FinishShiftDialogProps) {
  const [checked, setChecked] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setChecked(false);
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End your shift?</AlertDialogTitle>
          <AlertDialogDescription>
            You won't be able to start a new shift today — your next shift will
            be available after 00:00 tomorrow.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/30 p-3 cursor-pointer">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground leading-snug">
            Yes, I finished my shift for today.
          </span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!checked || working}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
              setChecked(false);
              onOpenChange(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {working ? "Ending…" : "End shift"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default FinishShiftDialog;
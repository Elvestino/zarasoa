import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  success: "bg-green-600/10 text-green-700 dark:bg-green-400/15 dark:text-green-400",
  warning: "bg-secondary/25 text-amber-800 dark:bg-secondary/20 dark:text-secondary",
  danger: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary/10 text-primary dark:bg-primary/20",
};

/** Pastille d'état colorée (le libellé est déjà traduit par l'appelant). */
export function StatusBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="ghost" className={cn("font-medium", TONES[tone], className)}>
      {children}
    </Badge>
  );
}

export const accountTone = (status: string): Tone =>
  status === "approved" ? "success" : status === "locked" || status === "rejected" || status === "suspended" ? "danger" : status === "deactivated" ? "neutral" : "warning";

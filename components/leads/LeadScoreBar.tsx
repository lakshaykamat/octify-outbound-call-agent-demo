import { cn } from "@/lib/utils";

export function LeadScoreBar({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500/90"
      : score >= 50
        ? "bg-amber-500/80"
        : "bg-slate-400/70";
  const label =
    score >= 80 ? "Hot" : score >= 50 ? "Warm" : score >= 30 ? "Cool" : "Cold";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="w-9 text-xs tabular-nums text-muted-foreground">
        {score}
      </span>
      <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
        {label}
      </span>
    </div>
  );
}

import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon,
  delta,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  delta?: { value: number; suffix?: string };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="px-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-28" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
        </div>
        <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
          {delta ? <DeltaPill value={delta.value} suffix={delta.suffix} /> : null}
          {hint ? <span>{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaPill({ value, suffix = "" }: { value: number; suffix?: string }) {
  const flat = Math.abs(value) < 0.001;
  const up = value > 0;
  const Icon = flat ? MinusIcon : up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[11px] font-medium",
        flat && "bg-muted text-muted-foreground",
        !flat && up && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        !flat && !up && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

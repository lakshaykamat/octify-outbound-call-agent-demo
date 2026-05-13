"use client";

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import type { DashboardKpi } from "@/lib/mock";

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-8 w-full text-foreground/60"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        points={points}
      />
    </svg>
  );
}

function DeltaPill({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const flat = Math.abs(value) < 0.001;
  const up = value > 0;
  const Icon = flat ? MinusIcon : up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[11px] font-medium tabular-nums",
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

function formatValue(kpi: DashboardKpi): string {
  if (kpi.pct) return `${(kpi.value * 100).toFixed(1)}%`;
  if (kpi.duration) return formatDuration(kpi.value);
  if (kpi.label.toLowerCase().includes("quality")) return kpi.value.toFixed(1);
  return kpi.value.toLocaleString();
}

export function KpiGrid({ kpis, loading }: { kpis: DashboardKpi[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-6 lg:px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-6 lg:px-6">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {kpi.label}
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
            {formatValue(kpi)}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <DeltaPill value={kpi.delta} />
          </div>
          <Sparkline values={kpi.spark} />
        </div>
      ))}
    </div>
  );
}

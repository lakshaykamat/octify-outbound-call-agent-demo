"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import type { DashboardKpi } from "@/lib/mock";

type Tone = "up" | "down" | "flat";

function toneFor(delta: number): Tone {
  if (Math.abs(delta) < 0.001) return "flat";
  return delta > 0 ? "up" : "down";
}

function Spark({ values, tone }: { values: number[]; tone: Tone }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * 100;
      const y = 20 - ((v - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke =
    tone === "up"
      ? "text-emerald-400/80"
      : tone === "down"
        ? "text-rose-400/80"
        : "text-muted-foreground/50";
  return (
    <svg
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      className={cn("h-6 w-full", stroke)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={pts}
      />
    </svg>
  );
}

function Delta({ value, tone, suffix = "%" }: { value: number; tone: Tone; suffix?: string }) {
  const Icon = tone === "flat" ? null : tone === "up" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
        tone === "flat" && "text-muted-foreground",
        tone === "up" && "text-emerald-400",
        tone === "down" && "text-rose-400",
      )}
    >
      {Icon ? <Icon className="size-3" strokeWidth={2.5} /> : null}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

function formatValue(kpi: DashboardKpi): string {
  if (kpi.pct) return `${(kpi.value * 100).toFixed(1)}%`;
  if (kpi.duration) return formatDuration(kpi.value);
  if (kpi.label.toLowerCase().includes("quality")) return kpi.value.toFixed(1);
  return kpi.value.toLocaleString();
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const tone = toneFor(kpi.delta);
  return (
    <div className="flex flex-col justify-between rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {kpi.label}
        </span>
        <Delta value={kpi.delta} tone={tone} />
      </div>
      <div className="mt-3 text-2xl font-semibold leading-none tabular-nums tracking-tight">
        {formatValue(kpi)}
      </div>
      <div className="mt-3">
        <Spark values={kpi.spark} tone={tone} />
      </div>
    </div>
  );
}

export function KpiGrid({ kpis, loading }: { kpis: DashboardKpi[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-6 lg:px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[112px] w-full rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-6 lg:px-6">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

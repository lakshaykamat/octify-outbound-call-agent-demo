"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { SectionCard } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData, RangeKey } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Metric = "calls" | "connected" | "meetings" | "bookRate";

const METRIC_LABEL: Record<Metric, string> = {
  calls: "Calls",
  connected: "Connected",
  meetings: "Meetings",
  bookRate: "Book rate",
};

const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  qtd: "QTD",
};

const config = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PerformanceChart({
  data,
  loading,
  range,
  onRangeChange,
}: {
  data: DashboardData["performance"];
  loading: boolean;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
}) {
  const [metric, setMetric] = useState<Metric>("calls");

  const rows = data.map((d) => ({
    label: d.label,
    value: metric === "bookRate" ? d.bookRate * 100 : d[metric],
  }));

  return (
    <SectionCard
      title="Performance"
      description="Activity and conversion trend across the window."
      className="flex h-full flex-col"
      contentClassName="flex flex-1 flex-col"
      action={
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                metric === m
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {(Object.keys(RANGE_LABEL) as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                range === r
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <Skeleton className="min-h-64 w-full flex-1" />
      ) : (
        <ChartContainer config={config} className="min-h-64 w-full flex-1">
          <AreaChart
            data={rows}
            margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPerf" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-value)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={metric === "bookRate"}
              tickFormatter={(v) =>
                metric === "bookRate" ? `${v.toFixed(1)}%` : String(v)
              }
              fontSize={11}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              fill="url(#fillPerf)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

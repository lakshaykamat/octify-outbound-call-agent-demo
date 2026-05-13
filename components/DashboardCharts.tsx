"use client";

import { useMemo } from "react";
import { format, eachDayOfInterval, subDays, startOfDay } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ErrorCard } from "@/components/ErrorCard";
import { useCalls } from "@/hooks/queries";
import type { Outcome, XyloCall } from "@/lib/mock";
import { outcomeLabel } from "@/lib/outcomes";

const TREND_DAYS = 30;

const trendConfig = {
  calls: { label: "Calls", color: "var(--chart-1)" },
  connected: { label: "Connected", color: "var(--chart-2)" },
} satisfies ChartConfig;

function buildTrend(calls: XyloCall[]) {
  const today = startOfDay(new Date());
  const days = eachDayOfInterval({
    start: subDays(today, TREND_DAYS - 1),
    end: today,
  });
  const map = new Map(
    days.map((d) => [format(d, "yyyy-MM-dd"), { calls: 0, connected: 0 }]),
  );
  for (const call of calls) {
    const key = (call.startedAt ?? call.createdAt).slice(0, 10);
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.calls += 1;
    if ((call.durationSec ?? 0) > 0) bucket.connected += 1;
  }
  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const bucket = map.get(key)!;
    return {
      date: key,
      label: format(d, "MMM d"),
      calls: bucket.calls,
      connected: bucket.connected,
    };
  });
}

function buildOutcomes(calls: XyloCall[]) {
  const counts = new Map<Outcome, number>();
  for (const call of calls) {
    const outcome = call.analysis?.outcome;
    if (!outcome) continue;
    counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([outcome, count]) => ({
      outcome,
      label: outcomeLabel(outcome),
      count,
      pct: total ? count / total : 0,
    }));
}

function TrendCard({ calls, isLoading }: { calls: XyloCall[]; isLoading: boolean }) {
  const data = useMemo(() => buildTrend(calls), [calls]);
  const total = data.reduce((sum, d) => sum + d.calls, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Call volume</CardTitle>
        <CardDescription>
          Last {TREND_DAYS} days · {total} call{total === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pb-2">
        {isLoading ? (
          <Skeleton className="min-h-[200px] flex-1 w-full" />
        ) : (
          <ChartContainer config={trendConfig} className="min-h-[200px] w-full flex-1">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-calls)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-calls)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillConnected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-connected)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-connected)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
                fontSize={11}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="var(--color-calls)"
                fill="url(#fillCalls)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="connected"
                stroke="var(--color-connected)"
                fill="url(#fillConnected)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

function OutcomeBar({
  label,
  count,
  pct,
}: {
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count} <span className="text-xs">· {pctFmt.format(pct)}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70"
          style={{ width: `${Math.max(2, Math.round(pct * 100))}%` }}
        />
      </div>
    </div>
  );
}

function OutcomeCard({ calls, isLoading }: { calls: XyloCall[]; isLoading: boolean }) {
  const rows = useMemo(() => buildOutcomes(calls), [calls]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outcome mix</CardTitle>
        <CardDescription>Recent calls by classification</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No classified calls yet.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <OutcomeBar
                key={row.outcome}
                label={row.label}
                count={row.count}
                pct={row.pct}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardCharts() {
  const callsQuery = useCalls({ page: 1, limit: 3000 });

  if (callsQuery.isError) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Couldn't load call data."
          detail={callsQuery.error instanceof Error ? callsQuery.error.message : undefined}
        />
      </div>
    );
  }

  const calls = callsQuery.data?.calls ?? [];
  const loading = callsQuery.isLoading;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
      <div className="lg:col-span-2">
        <TrendCard calls={calls} isLoading={loading} />
      </div>
      <OutcomeCard calls={calls} isLoading={loading} />
    </div>
  );
}

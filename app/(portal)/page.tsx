"use client";

import { useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { DashboardFunnel } from "@/components/dashboard/Funnel";
import { Heatmap } from "@/components/dashboard/Heatmap";
import {
  CampaignLeaderboard,
  AgentLeaderboard,
} from "@/components/dashboard/Leaderboards";
import {
  Insights,
  ActivityFeed,
} from "@/components/dashboard/InsightsAndActivity";
import { useDashboard } from "@/hooks/queries";
import type { RangeKey } from "@/lib/mock";

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const dash = useDashboard(range);

  if (dash.isError) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Couldn't load dashboard."
          detail={dash.error instanceof Error ? dash.error.message : undefined}
        />
      </div>
    );
  }

  const data = dash.data;
  const loading = dash.isLoading || !data;

  return (
    <>
      <KpiGrid kpis={data?.kpis ?? []} loading={loading} />

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="lg:col-span-2 lg:flex lg:flex-col">
          <PerformanceChart
            data={data?.performance ?? []}
            loading={loading}
            range={range}
            onRangeChange={setRange}
          />
        </div>
        <DashboardFunnel
          totals={
            data?.totals ?? {
              dialed: 0,
              connected: 0,
              conversations: 0,
              qualified: 0,
              booked: 0,
              attended: 0,
              avgQuality: 0,
              avgDurationSec: 0,
            }
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="lg:col-span-2 lg:flex lg:flex-col">
          <Heatmap data={data?.heatmap ?? []} />
        </div>
        <Insights insights={data?.insights ?? []} />
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <CampaignLeaderboard campaigns={data?.topCampaigns ?? []} />
        <AgentLeaderboard agents={data?.topAgents ?? []} />
        <ActivityFeed activity={data?.activity ?? []} />
      </div>
    </>
  );
}

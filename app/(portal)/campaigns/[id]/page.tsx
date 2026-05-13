"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  XCircleIcon,
  PhoneCallIcon,
  CalendarCheck2Icon,
  UsersIcon,
  PercentIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile, SectionCard } from "@/components/patterns";
import { ErrorCard } from "@/components/ErrorCard";
import { CampaignFunnel } from "@/components/campaigns/CampaignFunnel";
import {
  useAgents,
  useCampaign,
  useCampaignStats,
  useUpdateCampaignStatus,
} from "@/hooks/queries";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  paused: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  completed: "border-border bg-muted text-muted-foreground",
  draft: "border-blue-500/40 bg-blue-500/10 text-blue-600",
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaign = useCampaign(id);
  const stats = useCampaignStats(id);
  const agents = useAgents();
  const updateStatus = useUpdateCampaignStatus();

  const agentName = useMemo(() => {
    if (!campaign.data) return "";
    return agents.data?.find((a) => a.id === campaign.data!.agentId)?.name ?? "Unassigned";
  }, [campaign.data, agents.data]);

  if (campaign.isError) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Couldn't load this campaign."
          detail={campaign.error instanceof Error ? campaign.error.message : undefined}
        />
      </div>
    );
  }

  if (campaign.isLoading || !campaign.data) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <Skeleton className="h-20 w-1/2" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const c = campaign.data;
  const s = stats.data;
  const bookRate = (c.conversionRate * 100).toFixed(1);

  const toggle = async (next: "active" | "paused" | "completed") => {
    await updateStatus.mutateAsync({ id: c.id, status: next });
    toast.success(
      next === "active" ? "Campaign resumed" : next === "paused" ? "Campaign paused" : "Campaign ended",
    );
  };

  const objections = (s?.objections ?? []).filter((o) => o.count > 0).slice(0, 5);
  const totalObjectionLost = objections.reduce((sum, o) => sum + o.count, 0);
  const topObjection = objections[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <h2 className="text-lg font-semibold tracking-tight">{c.name}</h2>
          <Badge variant="outline" className={cn(STATUS_TONE[c.status])}>
            {c.status}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{agentName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{c.scheduleSummary}</span>
          <span className="text-muted-foreground">·</span>
          <span className="tabular-nums text-muted-foreground">
            {c.startedAt ? `Started ${format(new Date(c.startedAt), "MMM d, yyyy")}` : "Not started"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/campaigns" />}>
            <ArrowLeftIcon className="size-3.5" /> All campaigns
          </Button>
          {c.status === "active" && (
            <Button variant="outline" size="sm" onClick={() => toggle("paused")}>
              <PauseIcon className="size-3.5" /> Pause
            </Button>
          )}
          {c.status === "paused" && (
            <Button variant="outline" size="sm" onClick={() => toggle("active")}>
              <PlayIcon className="size-3.5" /> Resume
            </Button>
          )}
          <Button variant="outline" size="sm" disabled>
            <CopyIcon className="size-3.5" /> Duplicate
          </Button>
          {c.status !== "completed" && (
            <Button variant="outline" size="sm" onClick={() => toggle("completed")}>
              <XCircleIcon className="size-3.5" /> End
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-6">
        <StatTile
          label="Audience"
          icon={<UsersIcon className="size-3.5" />}
          value={c.audienceSize.toLocaleString()}
          hint="leads enrolled"
        />
        <StatTile
          label="Calls"
          icon={<PhoneCallIcon className="size-3.5" />}
          value={c.callsMade.toLocaleString()}
          hint={s ? `${s.connected.toLocaleString()} connected` : ""}
        />
        <StatTile
          label="Meetings"
          icon={<CalendarCheck2Icon className="size-3.5" />}
          value={c.meetingsBooked.toLocaleString()}
          hint="booked"
        />
        <StatTile
          label="Book rate"
          icon={<PercentIcon className="size-3.5" />}
          value={`${bookRate}%`}
          delta={{ value: c.conversionRate * 100 - 6, suffix: "pp" }}
          hint="vs avg 6.0%"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <SectionCard
          title="Funnel"
          description="From dial to booked meeting."
          className="lg:col-span-2"
        >
          {stats.isLoading || !s ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <CampaignFunnel
              stages={[
                { label: "Dialed", value: s.dialed },
                { label: "Connected", value: s.connected },
                { label: "Conversation", value: s.conversations },
                { label: "Qualified", value: s.qualified },
                { label: "Meeting booked", value: s.booked },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard
          title={
            <span className="inline-flex items-center gap-1.5">
              <SparklesIcon className="size-4" /> AI insights
            </span>
          }
          description="Computed from this campaign's calls."
        >
          {topObjection && totalObjectionLost > 0 ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Top objection
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">{topObjection.label}</span> came up in{" "}
                  <span className="tabular-nums font-medium">
                    {((topObjection.count / s!.dialed) * 100).toFixed(1)}%
                  </span>{" "}
                  of dials.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Connect rate
                </p>
                <p className="mt-1 text-sm">
                  <span className="tabular-nums font-semibold">
                    {s ? ((s.connected / s.dialed) * 100).toFixed(1) : "0"}%
                  </span>{" "}
                  — in the healthy band for B2B outbound voice.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommendation
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm">
                  <TrendingUpIcon className="size-3.5" />
                  Shift dial cap up 15% on Tue–Thu 2–4pm.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Need more dials before we can surface insights.
            </p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <SectionCard title="Top objections" description="Most common reasons calls didn't convert.">
          {objections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No objections recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {objections.map((o) => {
                const pct =
                  totalObjectionLost > 0 ? (o.count / totalObjectionLost) * 100 : 0;
                return (
                  <li key={o.label} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{o.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {o.count.toLocaleString()}{" "}
                        <span className="text-xs">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-rose-500/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Schedule" description="Calling window and retry policy.">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Window</span>
              <span>{c.scheduleSummary}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Daily cap</span>
              <span className="tabular-nums">120 dials</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retry policy</span>
              <span>3 attempts · 24h apart</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Agent</span>
              <span>{agentName}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

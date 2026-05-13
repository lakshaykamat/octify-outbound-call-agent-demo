"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CalendarCheck2Icon,
  MegaphoneIcon,
  UploadCloudIcon,
  UserPlusIcon,
  BotIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { SectionCard } from "@/components/patterns";
import type { DashboardData } from "@/lib/mock";

function ActivityIcon({ type }: { type: DashboardData["activity"][number]["type"] }) {
  switch (type) {
    case "call.booked":
      return <CalendarCheck2Icon className="size-3.5" />;
    case "campaign.launched":
      return <MegaphoneIcon className="size-3.5" />;
    case "lead.imported":
      return <UploadCloudIcon className="size-3.5" />;
    case "member.joined":
      return <UserPlusIcon className="size-3.5" />;
    case "agent.updated":
      return <BotIcon className="size-3.5" />;
  }
}

export function Insights({ insights }: { insights: DashboardData["insights"] }) {
  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-1.5">
          <SparklesIcon className="size-4" /> AI insights
        </span>
      }
      description="Computed from the calls in this window."
    >
      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not enough data yet.</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight, i) => (
            <li key={i} className="rounded-lg border bg-muted/30 p-3">
              <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <TrendingUpIcon className="size-3" /> {insight.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{insight.body}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function ActivityFeed({ activity }: { activity: DashboardData["activity"] }) {
  return (
    <SectionCard title="Recent activity" description="Latest signals from the system.">
      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {activity.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                <ActivityIcon type={event.type} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.at), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

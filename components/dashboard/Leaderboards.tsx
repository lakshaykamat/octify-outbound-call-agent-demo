"use client";

import Link from "next/link";
import { SectionCard } from "@/components/patterns";
import type { DashboardData } from "@/lib/mock";

export function CampaignLeaderboard({ campaigns }: { campaigns: DashboardData["topCampaigns"] }) {
  return (
    <SectionCard title="Top campaigns" description="Ranked by meetings booked.">
      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <ol className="space-y-3">
          {campaigns.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <Link
                href={`/campaigns/${c.id}`}
                className="min-w-0 flex-1 truncate text-sm hover:underline"
              >
                {c.name}
              </Link>
              <span className="text-xs tabular-nums text-muted-foreground">
                {(c.bookRate * 100).toFixed(1)}%
              </span>
              <span className="w-12 text-right text-sm font-medium tabular-nums">
                {c.meetings}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

export function AgentLeaderboard({ agents }: { agents: DashboardData["topAgents"] }) {
  return (
    <SectionCard title="Top agents" description="Ranked by average quality score.">
      {agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents yet.</p>
      ) : (
        <ol className="space-y-3">
          {agents.map((a, i) => (
            <li key={a.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{a.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {a.calls.toLocaleString()} calls
              </span>
              <span className="w-12 text-right text-sm font-medium tabular-nums">
                {a.quality.toFixed(1)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

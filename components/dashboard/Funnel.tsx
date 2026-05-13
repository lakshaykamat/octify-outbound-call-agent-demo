"use client";

import { SectionCard } from "@/components/patterns";
import { CampaignFunnel } from "@/components/campaigns/CampaignFunnel";
import type { DashboardData } from "@/lib/mock";

export function DashboardFunnel({ totals }: { totals: DashboardData["totals"] }) {
  return (
    <SectionCard
      title="Pipeline funnel"
      description="From dial to attended meeting across all campaigns."
    >
      <CampaignFunnel
        stages={[
          { label: "Dialed", value: totals.dialed },
          { label: "Connected", value: totals.connected },
          { label: "Conversation", value: totals.conversations },
          { label: "Qualified", value: totals.qualified },
          { label: "Meeting booked", value: totals.booked },
          { label: "Attended", value: totals.attended },
        ]}
      />
    </SectionCard>
  );
}

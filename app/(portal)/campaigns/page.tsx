"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/patterns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { ErrorCard } from "@/components/ErrorCard";
import { useAgents, useCampaigns, useUpdateCampaignStatus } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import type { Campaign } from "@/lib/mock";

const STATUS_TABS: Array<{ value: "all" | Campaign["status"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Drafts" },
  { value: "completed", label: "Completed" },
];

export default function CampaignsPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["value"]>("all");
  const campaigns = useCampaigns();
  const agents = useAgents();
  const updateStatus = useUpdateCampaignStatus();

  const agentName = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of agents.data ?? []) map.set(a.id, a.name);
    return map;
  }, [agents.data]);

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, paused: 0, draft: 0, completed: 0 };
    for (const cmp of campaigns.data ?? []) {
      c.all++;
      c[cmp.status]++;
    }
    return c;
  }, [campaigns.data]);

  const filtered = useMemo(() => {
    const all = campaigns.data ?? [];
    if (tab === "all") return all;
    return all.filter((c) => c.status === tab);
  }, [campaigns.data, tab]);

  const onToggleStatus = async (id: string, next: Campaign["status"]) => {
    await updateStatus.mutateAsync({ id, status: next });
    toast.success(`Campaign ${next === "active" ? "resumed" : "paused"}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Campaigns"
        description="Outbound campaigns currently running across your AI SDR agents."
        actions={
          <Button render={<Link href="/campaigns/new" />}>
            <PlusIcon className="size-4" /> New campaign
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t) => {
            const active = tab === t.value;
            const count = counts[t.value];
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs transition-colors " +
                  (active
                    ? "border-foreground/30 bg-foreground/5 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted")
                }
              >
                {t.label}
                <span className="ml-1.5 tabular-nums text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>

        {campaigns.isError ? (
          <ErrorCard
            message="Couldn't load campaigns."
            detail={campaigns.error instanceof Error ? campaigns.error.message : undefined}
          />
        ) : campaigns.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No campaigns here yet"
            description="Try a different filter, or create a new campaign."
            action={
              <Button render={<Link href="/campaigns/new" />}>
                <PlusIcon className="size-4" /> New campaign
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                agentName={agentName.get(c.agentId) ?? "Unassigned"}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

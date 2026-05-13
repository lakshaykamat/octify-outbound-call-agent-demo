"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns";
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
  const [query, setQuery] = useState("");
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
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
  }, [campaigns.data, tab, query]);

  const onToggleStatus = async (id: string, next: Campaign["status"]) => {
    await updateStatus.mutateAsync({ id, status: next });
    toast.success(`Campaign ${next === "active" ? "resumed" : "paused"}`);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 lg:px-6">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="h-9 w-full rounded-md border bg-card pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
        <Button render={<Link href="/campaigns/new" />}>
          <PlusIcon className="size-4" /> New campaign
        </Button>
      </div>

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

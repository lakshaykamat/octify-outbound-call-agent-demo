"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PhoneCallIcon,
  CalendarCheck2Icon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/mock";

const STATUS_TONE: Record<Campaign["status"], string> = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  paused: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  completed: "border-border bg-muted text-muted-foreground",
  draft: "border-blue-500/40 bg-blue-500/10 text-blue-600",
};

export function CampaignCard({
  campaign,
  agentName,
  onToggleStatus,
}: {
  campaign: Campaign;
  agentName: string;
  onToggleStatus?: (id: string, next: Campaign["status"]) => void;
}) {
  const c = campaign;
  const bookRate = (c.conversionRate * 100).toFixed(1);

  return (
    <div className="group flex flex-col gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/campaigns/${c.id}`}
          className="min-w-0 space-y-1 hover:underline-offset-2"
        >
          <p className="truncate text-sm font-semibold">{c.name}</p>
          <p className="text-xs text-muted-foreground">{agentName}</p>
        </Link>
        <Badge variant="outline" className={cn("shrink-0", STATUS_TONE[c.status])}>
          {c.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 border-y py-3">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <UsersIcon className="size-3" /> Audience
          </div>
          <div className="text-base font-semibold tabular-nums">
            {c.audienceSize.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <PhoneCallIcon className="size-3" /> Calls
          </div>
          <div className="text-base font-semibold tabular-nums">
            {c.callsMade.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarCheck2Icon className="size-3" /> Booked
          </div>
          <div className="text-base font-semibold tabular-nums">
            {c.meetingsBooked.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Book rate</span>
          <span className="font-medium tabular-nums">{bookRate}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500/80"
            style={{ width: `${Math.min(100, c.conversionRate * 100 * 10)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon className="size-3" /> {c.scheduleSummary}
        </span>
        <span className="tabular-nums">
          {c.startedAt ? format(new Date(c.startedAt), "MMM d") : "—"}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {c.status === "active" && onToggleStatus && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleStatus(c.id, "paused")}
          >
            <PauseIcon className="size-3.5" /> Pause
          </Button>
        )}
        {c.status === "paused" && onToggleStatus && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleStatus(c.id, "active")}
          >
            <PlayIcon className="size-3.5" /> Resume
          </Button>
        )}
        <Button size="sm" variant="ghost" render={<Link href={`/campaigns/${c.id}`} />}>
          Open
        </Button>
        <Button size="sm" variant="ghost" disabled>
          <CopyIcon className="size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" disabled className="ml-auto">
          <MoreHorizontalIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

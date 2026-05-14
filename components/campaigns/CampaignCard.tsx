"use client";

import Link from "next/link";
import { format } from "date-fns";
import { PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/mock";

const STATUS_META: Record<
  Campaign["status"],
  { label: string; dot: string; text: string }
> = {
  active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-500" },
  paused: { label: "Paused", dot: "bg-amber-500", text: "text-amber-500" },
  completed: {
    label: "Completed",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  draft: { label: "Draft", dot: "bg-sky-500", text: "text-sky-500" },
};

function stableDelta(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.round(((Math.abs(h) % 30) - 12) * 10) / 100;
}

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
  const bookRate = c.conversionRate * 100;
  const reachPct =
    c.audienceSize > 0
      ? Math.min(100, Math.round((c.callsMade / c.audienceSize) * 100))
      : 0;
  const status = STATUS_META[c.status];
  const startedAt = c.startedAt ? format(new Date(c.startedAt), "MMM d") : null;
  const delta = stableDelta(c.id);
  const deltaSymbol = delta > 0 ? "▴" : delta < 0 ? "▾" : "·";
  const showAction =
    (c.status === "active" || c.status === "paused") && onToggleStatus;
  const agentLabel = agentName.replace(/^Xylo\s*·\s*/, "");

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card transition-colors hover:border-foreground/20">
      <Link href={`/campaigns/${c.id}`} className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{c.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{agentLabel}</p>
          </div>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs", status.text)}>
            <span className={cn("size-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        </div>

        <div>
          <p className="text-3xl font-semibold tabular-nums leading-none tracking-tight">
            {bookRate.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Book rate
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="tabular-nums">
              {deltaSymbol} {Math.abs(delta).toFixed(1)} this week
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs tabular-nums text-muted-foreground">
            <span className="text-foreground/80">{c.callsMade.toLocaleString()}</span>
            <span> of </span>
            <span className="text-foreground/80">{c.audienceSize.toLocaleString()}</span>
            <span> called</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="text-foreground/80">{c.meetingsBooked.toLocaleString()}</span>
            <span> booked</span>
          </p>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/40 transition-all"
              style={{ width: `${reachPct}%` }}
            />
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 px-5 pb-4 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">
          {c.scheduleSummary}
          {startedAt ? (
            <>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span className="tabular-nums">{startedAt}</span>
            </>
          ) : null}
        </span>
        {showAction ? (
          <Button
            size="sm"
            variant="ghost"
            className="-mr-2 h-7 shrink-0 px-2 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              onToggleStatus(c.id, c.status === "active" ? "paused" : "active");
            }}
          >
            {c.status === "active" ? (
              <>
                <PauseIcon className="size-3" /> Pause
              </>
            ) : (
              <>
                <PlayIcon className="size-3" /> Resume
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

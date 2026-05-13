"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/mock";

const STATUS_META: Record<
  Campaign["status"],
  { label: string; dot: string; text: string }
> = {
  active:    { label: "Active",    dot: "bg-emerald-500", text: "text-emerald-400" },
  paused:    { label: "Paused",    dot: "bg-amber-500",   text: "text-amber-400" },
  completed: { label: "Completed", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  draft:     { label: "Draft",     dot: "bg-sky-500",     text: "text-sky-400" },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-lg font-semibold tabular-nums leading-tight">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
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
  const status = STATUS_META[c.status];
  const startedAt = c.startedAt ? format(new Date(c.startedAt), "MMM d") : "—";

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card transition-colors hover:border-foreground/20">
      <Link
        href={`/campaigns/${c.id}`}
        className="flex flex-col gap-4 p-4 pb-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
                  status.text,
                  "bg-current/10",
                )}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{agentName}</p>
          </div>

          {(c.status === "active" || c.status === "paused") && onToggleStatus ? (
            <Button
              size="icon-sm"
              variant="ghost"
              className="-mr-1 -mt-1 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                onToggleStatus(c.id, c.status === "active" ? "paused" : "active");
              }}
              aria-label={c.status === "active" ? "Pause" : "Resume"}
            >
              {c.status === "active" ? (
                <PauseIcon className="size-3.5" />
              ) : (
                <PlayIcon className="size-3.5" />
              )}
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Audience" value={c.audienceSize.toLocaleString()} />
          <Stat label="Calls" value={c.callsMade.toLocaleString()} />
          <Stat label="Booked" value={c.meetingsBooked.toLocaleString()} />
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Book rate</span>
          <span className="font-mono tabular-nums text-foreground/80">
            {bookRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              c.status === "paused"
                ? "bg-amber-500/70"
                : c.status === "completed"
                  ? "bg-muted-foreground/60"
                  : "bg-emerald-500/70",
            )}
            style={{ width: `${Math.max(0, Math.min(100, bookRate))}%` }}
          />
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <CalendarIcon className="size-3 shrink-0 opacity-70" />
          <span className="truncate">{c.scheduleSummary}</span>
        </span>
        <span className="shrink-0 font-mono tabular-nums">{startedAt}</span>
      </div>
    </div>
  );
}

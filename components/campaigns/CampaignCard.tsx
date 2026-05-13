"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  PauseIcon,
  PlayIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/lib/mock";

const STATUS_RING: Record<Campaign["status"], string> = {
  active:    "text-foreground",
  paused:    "text-amber-400",
  completed: "text-muted-foreground",
  draft:     "text-sky-400",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-semibold tabular-nums leading-none">{value}</div>
    </div>
  );
}

function Ring({ value, tone }: { value: number; tone: string }) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value * 10));
  const dash = (clamped / 100) * circumference;
  return (
    <div className="relative inline-flex size-9 items-center justify-center">
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/60" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={tone}
        />
      </svg>
      <span className="absolute font-mono text-[9px] font-semibold tabular-nums">
        {value.toFixed(1)}%
      </span>
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
  const ringTone = STATUS_RING[c.status];
  const startedAt = c.startedAt ? format(new Date(c.startedAt), "MMM d") : "—";

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pl-4 pr-1.5 pt-3 pb-1">
        <Link href={`/campaigns/${c.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{agentName}</p>
        </Link>
        <div className="flex shrink-0 items-center">
          {c.status === "active" && onToggleStatus ? (
            <Button size="icon-sm" variant="ghost" onClick={() => onToggleStatus(c.id, "paused")} aria-label="Pause">
              <PauseIcon className="size-3.5" />
            </Button>
          ) : null}
          {c.status === "paused" && onToggleStatus ? (
            <Button size="icon-sm" variant="ghost" onClick={() => onToggleStatus(c.id, "active")} aria-label="Resume">
              <PlayIcon className="size-3.5" />
            </Button>
          ) : null}
          <Button size="icon-sm" variant="ghost" disabled aria-label="More">
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Link href={`/campaigns/${c.id}`} className="flex items-center gap-4 px-4 pt-2 pb-3">
        <div className="grid flex-1 grid-cols-3 gap-3">
          <Stat label="Audience" value={c.audienceSize.toLocaleString()} />
          <Stat label="Calls" value={c.callsMade.toLocaleString()} />
          <Stat label="Booked" value={c.meetingsBooked.toLocaleString()} />
        </div>
        <Ring value={bookRate} tone={ringTone} />
      </Link>

      {/* Footer */}
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

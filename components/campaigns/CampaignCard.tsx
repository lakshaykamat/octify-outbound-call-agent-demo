"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon, PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/mock";

const STATUS_META: Record<
  Campaign["status"],
  { label: string; dot: string; pill: string }
> = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  paused: {
    label: "Paused",
    dot: "bg-amber-400",
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  completed: {
    label: "Completed",
    dot: "bg-muted-foreground",
    pill: "border-border bg-muted/60 text-muted-foreground",
  },
  draft: {
    label: "Draft",
    dot: "bg-sky-400",
    pill: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
};

export function CampaignCard({
  campaign,
  onToggleStatus,
}: {
  campaign: Campaign;
  agentName?: string;
  onToggleStatus?: (id: string, next: Campaign["status"]) => void;
}) {
  const c = campaign;
  const status = STATUS_META[c.status];
  const startedAt = c.startedAt ? format(new Date(c.startedAt), "MMM d, yyyy") : null;
  const showAction =
    (c.status === "active" || c.status === "paused") && onToggleStatus;

  return (
    <Card className="group/campaign transition-colors hover:ring-foreground/20">
      <Link href={`/campaigns/${c.id}`} className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle className="truncate">{c.name}</CardTitle>
          <CardAction>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                status.pill,
              )}
            >
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 truncate">
            <ClockIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{c.scheduleSummary}</span>
          </p>
          <p className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
            <span className="tabular-nums">
              {startedAt ? `Started ${startedAt}` : "Not started"}
            </span>
          </p>
        </CardContent>
      </Link>

      <CardFooter className="justify-between py-2 text-xs text-muted-foreground">
        <span className="truncate">
          {c.status === "draft"
            ? "Awaiting launch"
            : c.status === "completed"
              ? "Campaign ended"
              : c.status === "paused"
                ? "Paused, ready to resume"
                : "Running on schedule"}
        </span>
        {showAction ? (
          <Button
            size="sm"
            variant="ghost"
            className="-mr-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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
      </CardFooter>
    </Card>
  );
}

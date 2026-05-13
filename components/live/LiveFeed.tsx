"use client";

import { formatDistanceToNow } from "date-fns";
import { PhoneCallIcon, CalendarCheck2Icon, VoicemailIcon, PhoneOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LiveEvent = {
  id: string;
  prospectName: string;
  company: string;
  region: string;
  outcome: "connected" | "voicemail" | "no-answer" | "booked";
  ts: number;
  durationSec?: number;
};

const TONE: Record<LiveEvent["outcome"], string> = {
  connected: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  voicemail: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  "no-answer": "border-border bg-muted/30 text-muted-foreground",
  booked: "border-blue-500/40 bg-blue-500/5 text-blue-700 dark:text-blue-400",
};

const ICON: Record<LiveEvent["outcome"], React.ComponentType<{ className?: string }>> = {
  connected: PhoneCallIcon,
  voicemail: VoicemailIcon,
  "no-answer": PhoneOffIcon,
  booked: CalendarCheck2Icon,
};

const LABEL: Record<LiveEvent["outcome"], string> = {
  connected: "Connected",
  voicemail: "Voicemail",
  "no-answer": "No answer",
  booked: "Booked",
};

export function LiveFeed({
  events,
  onSelect,
}: {
  events: LiveEvent[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Live feed
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Newest first
        </span>
      </div>
      <ol className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {events.length === 0 && (
          <li className="px-3 py-8 text-center text-xs text-muted-foreground">
            Waiting for activity…
          </li>
        )}
        {events.map((e) => {
          const Icon = ICON[e.outcome];
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onSelect(e.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
                  TONE[e.outcome],
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                    <Icon className="size-3" /> {LABEL[e.outcome]}
                  </span>
                  <span className="text-[10px] tabular-nums opacity-80">
                    {formatDistanceToNow(e.ts, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {e.prospectName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.company} · {e.region}
                </p>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

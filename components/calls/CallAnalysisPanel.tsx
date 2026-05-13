"use client";

import { format } from "date-fns";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Analysis, XyloCall } from "@/lib/api/types";

function TalkListenBar({ outcome }: { outcome: Analysis["outcome"] }) {
  // Booked calls: agent 45 / lead 55. Lost calls flip.
  const agent = outcome === "meeting_booked" ? 45 : outcome === "callback_requested" ? 50 : 60;
  const lead = 100 - agent;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Talk · listen ratio</span>
        <span className="tabular-nums">
          Agent {agent}% · Lead {lead}%
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-foreground/70" style={{ width: `${agent}%` }} />
        <div className="bg-emerald-500/70" style={{ width: `${lead}%` }} />
      </div>
    </div>
  );
}

export function CallAnalysisPanel({ call }: { call: XyloCall }) {
  const analysis = call.analysis;
  if (!analysis) {
    return <p className="text-sm text-muted-foreground">No AI analysis for this call.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Summary
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {analysis.summary || "No summary available."}
        </p>
      </div>

      <TalkListenBar outcome={analysis.outcome} />

      {analysis.objectionsRaised.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Objections detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.objectionsRaised.map((o, i) => (
              <Badge key={i} variant="outline">
                <AlertCircleIcon className="size-3 text-amber-500" /> {o}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.followUpAction && (
        <div
          className={cn(
            "rounded-lg border p-4",
            analysis.outcome === "meeting_booked"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "bg-card",
          )}
        >
          <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CheckCircle2Icon className="size-3" /> Next step
          </p>
          <p className="text-sm">{analysis.followUpAction}</p>
          {analysis.followUpDate && (
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {format(new Date(analysis.followUpDate), "MMM d, yyyy")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  XCircleIcon,
  RefreshCwIcon,
  ClockIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { XyloCall } from "@/lib/mock";

const STATUS_LABEL: Record<NonNullable<XyloCall["crmWritebackStatus"]>, string> = {
  pending: "Pending",
  success: "Synced",
  failed: "Failed",
  abandoned: "Abandoned",
};

export function CrmPanel({ call }: { call: XyloCall }) {
  const [resyncing, setResyncing] = useState(false);
  const status = call.crmWritebackStatus ?? "pending";

  const fields: Array<{ label: string; value: string }> = [];
  if (call.analysis) {
    fields.push({ label: "Outcome", value: call.analysis.outcome });
    fields.push({ label: "Sentiment", value: call.analysis.sentiment });
    fields.push({ label: "Score", value: `${call.analysis.score}/10` });
    if (call.analysis.followUpAction) {
      fields.push({ label: "Follow-up", value: call.analysis.followUpAction });
    }
  }

  const tone =
    status === "success"
      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600"
      : status === "failed" || status === "abandoned"
        ? "border-rose-500/40 bg-rose-500/5 text-rose-600"
        : "border-amber-500/40 bg-amber-500/5 text-amber-600";

  const Icon =
    status === "success" ? CheckCircle2Icon : status === "pending" ? ClockIcon : XCircleIcon;

  const resync = async () => {
    setResyncing(true);
    await new Promise((r) => setTimeout(r, 900));
    setResyncing(false);
    toast.success("Re-synced contact to HubSpot");
  };

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center justify-between rounded-lg border p-3", tone)}>
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide">
              HubSpot · {STATUS_LABEL[status]}
            </p>
            <p className="text-xs">
              Contact{" "}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="font-medium underline-offset-2 hover:underline"
              >
                {call.prospectName || "Lead"}
                <ExternalLinkIcon className="ml-0.5 inline size-3" />
              </a>
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={resync} disabled={resyncing}>
          <RefreshCwIcon className={cn("size-3.5", resyncing && "animate-spin")} />
          {resyncing ? "Syncing…" : "Re-sync"}
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Synced fields
          </p>
          <ul className="space-y-1.5 text-sm">
            {fields.map((f) => (
              <li key={f.label} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="truncate">{f.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

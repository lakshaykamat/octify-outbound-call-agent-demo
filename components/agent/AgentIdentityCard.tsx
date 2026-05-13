"use client";

import { toast } from "sonner";
import { BotIcon } from "lucide-react";
import { InlineEditField } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { useUpdateAgentConfig } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { AgentConfig } from "@/lib/mock";

export function AgentIdentityCard({ a }: { a: AgentConfig }) {
  const update = useUpdateAgentConfig();

  async function save(patch: Parameters<typeof update.mutateAsync>[0], success: string) {
    try {
      await update.mutateAsync(patch);
      toast.success(success);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-start">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <BotIcon className="size-6" />
      </div>

      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-medium uppercase tracking-wider",
              a.enabled
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full", a.enabled ? "bg-emerald-400" : "bg-muted-foreground/60")} />
            {a.enabled ? "Live" : "Paused"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            From <span className="font-mono">{a.agent.fromNumber}</span>
          </span>
        </div>

        <InlineEditField
          value={a.agent.name}
          onSave={(v) => save({ name: v }, "Name updated")}
          displayClassName="text-xl font-semibold tracking-tight"
          ariaLabel="Edit agent name"
        />

        <InlineEditField
          value={a.objective}
          onSave={(v) => save({ objective: v }, "Objective updated")}
          multiline
          displayClassName="text-sm leading-relaxed text-muted-foreground"
          ariaLabel="Edit objective"
        />
      </div>

      <Button
        variant={a.enabled ? "outline" : "default"}
        size="sm"
        className="sm:self-start"
        onClick={() => save({ enabled: !a.enabled }, a.enabled ? "Agent paused" : "Agent live")}
      >
        {a.enabled ? "Pause agent" : "Activate agent"}
      </Button>
    </div>
  );
}

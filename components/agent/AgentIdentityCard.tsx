"use client";

import { toast } from "sonner";
import { SectionCard, InlineEditField } from "@/components/patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateAgentConfig } from "@/hooks/queries";
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
    <SectionCard
      title="Identity"
      description="The name your prospects see in CRM and what the agent is here to do."
      action={
        <Button
          variant={a.enabled ? "secondary" : "default"}
          size="sm"
          onClick={() => save({ enabled: !a.enabled }, a.enabled ? "Agent paused" : "Agent live")}
        >
          {a.enabled ? "Pause" : "Activate"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Badge variant={a.enabled ? "default" : "secondary"}>
            {a.enabled ? "Live" : "Paused"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            From <span className="font-mono">{a.agent.fromNumber}</span>
          </span>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Display name
          </div>
          <InlineEditField
            value={a.agent.name}
            onSave={(v) => save({ name: v }, "Name updated")}
            displayClassName="text-lg font-semibold tracking-tight"
            ariaLabel="Edit agent name"
          />
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Objective
          </div>
          <InlineEditField
            value={a.objective}
            onSave={(v) => save({ objective: v }, "Objective updated")}
            multiline
            displayClassName="text-sm leading-relaxed text-muted-foreground"
            ariaLabel="Edit objective"
          />
        </div>
      </div>
    </SectionCard>
  );
}

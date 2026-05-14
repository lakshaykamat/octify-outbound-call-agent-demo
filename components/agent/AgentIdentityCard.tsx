"use client";

import { toast } from "sonner";
import { InlineEditField } from "@/components/patterns";
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
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Name
        </p>
        <InlineEditField
          value={a.agent.name}
          onSave={(v) => save({ name: v }, "Name updated")}
          displayClassName="text-xl font-semibold tracking-tight"
          ariaLabel="Edit agent name"
        />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Objective
        </p>
        <InlineEditField
          value={a.objective}
          onSave={(v) => save({ objective: v }, "Objective updated")}
          multiline
          displayClassName="text-sm leading-relaxed text-muted-foreground"
          ariaLabel="Edit objective"
        />
      </div>
    </section>
  );
}

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorCard } from "@/components/ErrorCard";
import { PageHeader } from "@/components/patterns";
import { AgentIdentityCard } from "@/components/agent/AgentIdentityCard";
import { VoiceCard } from "@/components/agent/VoiceCard";
import { ScriptEditor } from "@/components/agent/ScriptEditor";
import { ScheduleGrid } from "@/components/agent/ScheduleGrid";
import { VersionsCard } from "@/components/agent/VersionsCard";
import { TestCallButton } from "@/components/agent/TestCallDialog";
import { useAgentConfig } from "@/hooks/queries";
import type { AgentConfig } from "@/lib/mock";

function StudioHeader({ a }: { a: AgentConfig | undefined }) {
  return (
    <PageHeader
      eyebrow="Agent Studio"
      title="Agent"
      description="Identity, voice, script, schedule, and versions — everything that shapes how your agent shows up on a call."
      actions={
        <div className="flex items-center gap-2">
          {a ? (
            <Badge variant={a.enabled ? "default" : "secondary"}>
              {a.enabled ? "Live" : "Paused"}
            </Badge>
          ) : null}
          <TestCallButton />
        </div>
      }
    />
  );
}

export default function AgentPage() {
  const agent = useAgentConfig();

  if (agent.isLoading) {
    return (
      <>
        <StudioHeader a={undefined} />
        <div className="flex flex-col gap-4 px-4 lg:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-72" />
          <Skeleton className="h-48" />
        </div>
      </>
    );
  }
  if (agent.isError || !agent.data) {
    return (
      <>
        <StudioHeader a={undefined} />
        <div className="px-4 lg:px-6">
          <ErrorCard
            message="Agent configuration unavailable."
            detail={agent.error instanceof Error ? agent.error.message : undefined}
          />
        </div>
      </>
    );
  }
  const a = agent.data;

  return (
    <>
      <StudioHeader a={a} />
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <AgentIdentityCard a={a} />
          <VoiceCard a={a} />
        </div>
        <ScriptEditor />
        <ScheduleGrid a={a} />
        <VersionsCard a={a} />
      </div>
    </>
  );
}

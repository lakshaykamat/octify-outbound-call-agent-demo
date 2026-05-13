"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorCard } from "@/components/ErrorCard";
import { AgentIdentityCard } from "@/components/agent/AgentIdentityCard";
import { VoiceCard } from "@/components/agent/VoiceCard";
import { ScriptEditor } from "@/components/agent/ScriptEditor";
import { ScheduleGrid } from "@/components/agent/ScheduleGrid";
import { VersionsCard } from "@/components/agent/VersionsCard";
import { useAgentConfig } from "@/hooks/queries";

export default function AgentPage() {
  const agent = useAgentConfig();

  if (agent.isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-72" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (agent.isError || !agent.data) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Agent configuration unavailable."
          detail={agent.error instanceof Error ? agent.error.message : undefined}
        />
      </div>
    );
  }
  const a = agent.data;

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <AgentIdentityCard a={a} />
        <VoiceCard a={a} />
      </div>
      <ScriptEditor />
      <ScheduleGrid a={a} />
      <VersionsCard a={a} />
    </div>
  );
}

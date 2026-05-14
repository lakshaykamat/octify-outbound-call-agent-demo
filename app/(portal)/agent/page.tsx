"use client";

import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/ErrorCard";
import { AgentIdentityCard } from "@/components/agent/AgentIdentityCard";
import { VoiceCard } from "@/components/agent/VoiceCard";
import { ScriptEditor } from "@/components/agent/ScriptEditor";
import { ScheduleGrid } from "@/components/agent/ScheduleGrid";
import { VersionsCard } from "@/components/agent/VersionsCard";
import { TestCallButton } from "@/components/agent/TestCallDialog";
import { useAgentConfig, useUpdateAgentConfig } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export default function AgentPage() {
  const agent = useAgentConfig();
  const update = useUpdateAgentConfig();

  if (agent.isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-12" />
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-[420px]" />
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
  const enabled = a.enabled;

  const togglePause = async () => {
    try {
      await update.mutateAsync({ enabled: !enabled });
      toast.success(enabled ? "Agent paused" : "Agent live");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 lg:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium",
              enabled ? "text-emerald-500" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                enabled ? "bg-emerald-500" : "bg-muted-foreground/60",
              )}
            />
            {enabled ? "Live" : "Paused"}
          </span>
          <span className="truncate text-sm font-semibold">{a.agent.name}</span>
          <span className="hidden text-muted-foreground/40 sm:inline">·</span>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {a.agent.fromNumber}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TestCallButton />
          <Button
            variant={enabled ? "outline" : "default"}
            size="sm"
            onClick={togglePause}
            disabled={update.isPending}
          >
            {enabled ? "Pause agent" : "Activate agent"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="script" className="gap-0">
        <TabsList variant="line" className="h-auto w-full justify-start gap-1 border-b p-0">
          <TabsTrigger value="identity" className="!flex-none px-3">Identity</TabsTrigger>
          <TabsTrigger value="script" className="!flex-none px-3">Script</TabsTrigger>
          <TabsTrigger value="voice" className="!flex-none px-3">Voice & tone</TabsTrigger>
          <TabsTrigger value="hours" className="!flex-none px-3">Hours</TabsTrigger>
          <TabsTrigger value="versions" className="!flex-none px-3">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="pt-6">
          <AgentIdentityCard a={a} />
        </TabsContent>
        <TabsContent value="script" className="pt-6">
          <ScriptEditor />
        </TabsContent>
        <TabsContent value="voice" className="pt-6">
          <VoiceCard a={a} />
        </TabsContent>
        <TabsContent value="hours" className="pt-6">
          <ScheduleGrid a={a} />
        </TabsContent>
        <TabsContent value="versions" className="pt-6">
          <VersionsCard a={a} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

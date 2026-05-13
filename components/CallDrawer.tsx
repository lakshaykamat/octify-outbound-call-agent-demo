"use client";

import { format } from "date-fns";
import {
  ClockIcon,
  PhoneIcon,
  CalendarIcon,
  Building2Icon,
  XIcon,
} from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorCard } from "@/components/ErrorCard";
import { useCall } from "@/hooks/queries";
import type { XyloCall } from "@/lib/mock";
import { formatDuration } from "@/lib/format";
import { outcomeLabel, sentimentLabel } from "@/lib/outcomes";
import { Waveform } from "@/components/calls/Waveform";
import { TranscriptWithSentiment } from "@/components/calls/TranscriptWithSentiment";
import { CallAnalysisPanel } from "@/components/calls/CallAnalysisPanel";
import { CrmPanel } from "@/components/calls/CrmPanel";
import { CallTimeline } from "@/components/calls/CallTimeline";
import { cn } from "@/lib/utils";

function WritebackBadge({ status }: { status: XyloCall["crmWritebackStatus"] }) {
  if (!status) return null;
  const variant =
    status === "success"
      ? "default"
      : status === "failed" || status === "abandoned"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>CRM: {status}</Badge>;
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-sm text-foreground tabular-nums truncate">{value}</div>
      </div>
    </div>
  );
}

function CloseButton() {
  return (
    <DrawerClose
      aria-label="Close"
      className="-mr-1.5 -mt-1.5 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <XIcon className="size-4" />
    </DrawerClose>
  );
}

function QualityChip({ score }: { score: number }) {
  const tone =
    score >= 8
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : score >= 6
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : "border-rose-500/30 bg-rose-500/10 text-rose-400";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium",
        tone,
      )}
    >
      <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">Score</span>
      <span className="font-mono tabular-nums">{score.toFixed(1)}</span>
    </span>
  );
}

function CallHeader({ call }: { call: XyloCall }) {
  const startedAt = call.startedAt ?? call.createdAt;
  return (
    <DrawerHeader className="gap-4 border-b p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Call detail
        </span>
        <CloseButton />
      </div>

      <div className="space-y-1">
        <DrawerTitle className="text-2xl font-semibold tracking-tight">
          {call.prospectName || "Unknown caller"}
        </DrawerTitle>
        <DrawerDescription className="font-mono text-sm">
          {call.phone}
        </DrawerDescription>
      </div>

      {(call.analysis?.score !== undefined ||
        call.analysis?.outcome ||
        call.analysis?.sentiment ||
        call.crmWritebackStatus) && (
        <div className="my-2 flex flex-wrap items-center gap-1.5">
          {call.analysis?.score !== undefined && (
            <QualityChip score={call.analysis.score} />
          )}
          {call.analysis?.outcome && (
            <Badge>{outcomeLabel(call.analysis.outcome)}</Badge>
          )}
          {call.analysis?.sentiment && (
            <Badge variant="outline">
              {sentimentLabel(call.analysis.sentiment)}
            </Badge>
          )}
          <WritebackBadge status={call.crmWritebackStatus} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-4">
        <MetaItem
          icon={<CalendarIcon className="size-3.5" />}
          label="When"
          value={format(new Date(startedAt), "MMM d, yyyy")}
        />
        <MetaItem
          icon={<ClockIcon className="size-3.5" />}
          label="Time"
          value={format(new Date(startedAt), "HH:mm")}
        />
        <MetaItem
          icon={<ClockIcon className="size-3.5" />}
          label="Duration"
          value={formatDuration(call.durationSec)}
        />
        {call.company ? (
          <MetaItem
            icon={<Building2Icon className="size-3.5" />}
            label="Company"
            value={call.company}
          />
        ) : (
          <MetaItem
            icon={<PhoneIcon className="size-3.5" />}
            label="Phone"
            value={call.phone}
          />
        )}
      </div>
    </DrawerHeader>
  );
}

function DrawerLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function DrawerError({ error }: { error: unknown }) {
  return (
    <div className="p-6">
      <ErrorCard
        message="Couldn't load this call."
        detail={error instanceof Error ? error.message : undefined}
      />
    </div>
  );
}

function DrawerBody({ call }: { call: XyloCall }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-4 p-6">
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recording
          </h3>
          <div className="rounded-lg border bg-muted/30 p-3">
            <Waveform callId={call._id} durationSec={call.durationSec ?? 0} />
          </div>
        </section>

        <Separator />

        <Tabs defaultValue="analysis" className="gap-0">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis" className="pt-4">
            <CallAnalysisPanel call={call} />
          </TabsContent>
          <TabsContent value="transcript" className="pt-4">
            <TranscriptWithSentiment lines={call.transcript ?? []} callId={call._id} />
          </TabsContent>
          <TabsContent value="timeline" className="pt-4">
            <CallTimeline call={call} />
          </TabsContent>
          <TabsContent value="crm" className="pt-4">
            <CrmPanel call={call} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function CallDrawer({
  callId,
  open,
  onOpenChange,
}: {
  callId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: call, isLoading, error } = useCall(callId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full flex-col data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:w-[40vw] data-[vaul-drawer-direction=right]:sm:max-w-none">
        {call ? (
          <CallHeader call={call} />
        ) : (
          <DrawerHeader className="gap-3 border-b p-6">
            <div className="flex items-start justify-between gap-3">
              <DrawerTitle>{isLoading ? "Loading…" : "Call"}</DrawerTitle>
              <CloseButton />
            </div>
            <DrawerDescription>&nbsp;</DrawerDescription>
          </DrawerHeader>
        )}

        {isLoading && <DrawerLoading />}
        {error && <DrawerError error={error} />}
        {call && <DrawerBody call={call} />}
      </DrawerContent>
    </Drawer>
  );
}

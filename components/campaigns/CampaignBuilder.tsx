"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CalendarClockIcon,
  UsersIcon,
  MicIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useAgents,
  useCreateCampaign,
  usePreviewAudience,
} from "@/hooks/queries";
import {
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from "@/lib/leads";
import type { LeadSource, LeadStatus, NewCampaign } from "@/lib/mock";

type Step = 1 | 2 | 3 | 4;

const DEFAULT_OPENING =
  "Hi {first_name}, this is Xylo from Motornexo. I'm reaching out because we work with dealerships in {region} that have aged or excess parts inventory. Quick question — are you the right person to talk to about moving slow-moving SKUs?";

const DEFAULT_OBJECTIONS = [
  "We already have a system for that",
  "Send me an email instead",
  "Not the right time",
];

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8..18
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StepDot({ index, active, done, label }: { index: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
          active && "border-foreground bg-foreground text-background",
          done && !active && "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
          !active && !done && "border-border bg-muted text-muted-foreground",
        )}
      >
        {done ? <CheckCircle2Icon className="size-3.5" /> : index}
      </div>
      <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Audience", "Agent & script", "Schedule", "Review"];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      {labels.map((label, i) => {
        const idx = (i + 1) as Step;
        return (
          <div key={label} className="flex items-center gap-3">
            <StepDot index={idx} active={step === idx} done={step > idx} label={label} />
            {i < labels.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" />}
          </div>
        );
      })}
    </div>
  );
}

type BuilderState = {
  name: string;
  audience: {
    status: LeadStatus | "all";
    source: LeadSource | "all";
    scoreMin: number;
  };
  agentId: string;
  opening: string;
  objections: string[];
  newObjection: string;
  timezone: string;
  startHour: number;
  endHour: number;
  workdays: Set<number>;
  dailyCap: number;
  retryAttempts: number;
  retryGapHours: number;
};

function AudienceStep({
  state,
  onChange,
  audienceCount,
}: {
  state: BuilderState;
  onChange: (next: BuilderState) => void;
  audienceCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <Label htmlFor="cmp-name">Campaign name</Label>
        <Input
          id="cmp-name"
          className="mt-2"
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder="e.g. Q3 California dealerships"
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Audience filter</p>
            <p className="text-xs text-muted-foreground">
              Live count updates as you refine.
            </p>
          </div>
          <Badge variant="outline" className="text-base tabular-nums">
            <UsersIcon className="size-3.5" /> {audienceCount.toLocaleString()}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={state.audience.status}
              onValueChange={(v) =>
                onChange({ ...state, audience: { ...state.audience, status: v as LeadStatus | "all" } })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Source</Label>
            <Select
              value={state.audience.source}
              onValueChange={(v) =>
                onChange({ ...state, audience: { ...state.audience, source: v as LeadSource | "all" } })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {LEAD_SOURCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Min lead score</Label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={state.audience.scoreMin}
                onChange={(e) =>
                  onChange({ ...state, audience: { ...state.audience, scoreMin: Number(e.target.value) } })
                }
                className="w-full accent-foreground"
              />
              <span className="w-9 text-sm tabular-nums">{state.audience.scoreMin}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentStep({
  state,
  onChange,
  agents,
}: {
  state: BuilderState;
  onChange: (next: BuilderState) => void;
  agents: Array<{ id: string; name: string; persona: string }>;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <Label className="text-sm">Agent</Label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {agents.map((a) => {
            const active = state.agentId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange({ ...state, agentId: a.id })}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border bg-card p-3 text-left transition-colors",
                  active ? "border-foreground bg-muted/40" : "hover:bg-muted/30",
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <MicIcon className="size-3.5" /> {a.name}
                </span>
                <span className="text-xs text-muted-foreground">{a.persona}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Label htmlFor="opening" className="text-sm">Opening line</Label>
        <textarea
          id="opening"
          value={state.opening}
          onChange={(e) => onChange({ ...state, opening: e.target.value })}
          rows={4}
          className="mt-2 w-full resize-none rounded-md border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Use <code className="rounded bg-muted px-1">{"{first_name}"}</code> /{" "}
          <code className="rounded bg-muted px-1">{"{company}"}</code> /{" "}
          <code className="rounded bg-muted px-1">{"{region}"}</code> for substitutions.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Label className="text-sm">Objections & rebuttals</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {state.objections.map((obj, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
            >
              {obj}
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    objections: state.objections.filter((_, j) => j !== i),
                  })
                }
                className="text-muted-foreground hover:text-foreground"
                aria-label="Remove"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={state.newObjection}
            onChange={(e) => onChange({ ...state, newObjection: e.target.value })}
            placeholder="Add an objection…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && state.newObjection.trim()) {
                e.preventDefault();
                onChange({
                  ...state,
                  objections: [...state.objections, state.newObjection.trim()],
                  newObjection: "",
                });
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!state.newObjection.trim()) return;
              onChange({
                ...state,
                objections: [...state.objections, state.newObjection.trim()],
                newObjection: "",
              });
            }}
          >
            <PlusIcon className="size-3.5" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScheduleStep({
  state,
  onChange,
}: {
  state: BuilderState;
  onChange: (next: BuilderState) => void;
}) {
  const toggleDay = (i: number) => {
    const next = new Set(state.workdays);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange({ ...state, workdays: next });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <Label className="text-sm">Time zone</Label>
        <Select
          value={state.timezone}
          onValueChange={(v) => onChange({ ...state, timezone: v })}
        >
          <SelectTrigger className="mt-2 w-full sm:w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/Los_Angeles">Pacific — America/Los_Angeles</SelectItem>
            <SelectItem value="America/Denver">Mountain — America/Denver</SelectItem>
            <SelectItem value="America/Chicago">Central — America/Chicago</SelectItem>
            <SelectItem value="America/New_York">Eastern — America/New_York</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Label className="text-sm">Calling hours</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Tue–Thu 10–11am and 2–4pm are the highest-connect bands. Defaults respect that.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {DAYS.map((d, i) => {
            const active = state.workdays.has(i);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Start hour</Label>
            <Select
              value={String(state.startHour)}
              onValueChange={(v) => onChange({ ...state, startHour: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{h}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End hour</Label>
            <Select
              value={String(state.endHour)}
              onValueChange={(v) => onChange({ ...state, endHour: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{h}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Label className="text-sm">Daily cap & retry policy</Label>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Daily cap</Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={state.dailyCap}
              onChange={(e) => onChange({ ...state, dailyCap: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Retries</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={state.retryAttempts}
              onChange={(e) => onChange({ ...state, retryAttempts: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Retry gap (hrs)</Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={state.retryGapHours}
              onChange={(e) => onChange({ ...state, retryGapHours: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({
  state,
  audienceCount,
  agentName,
}: {
  state: BuilderState;
  audienceCount: number;
  agentName: string;
}) {
  const tz = state.timezone.split("/").pop() ?? "";
  return (
    <aside className="space-y-3 rounded-xl border bg-card p-4 lg:sticky lg:top-20">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Preview
      </p>
      <p className="text-sm font-semibold">{state.name || "Untitled campaign"}</p>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Audience</span>
          <span className="tabular-nums">{audienceCount.toLocaleString()} leads</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Agent</span>
          <span>{agentName || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Window</span>
          <span className="tabular-nums">
            {state.startHour}:00–{state.endHour}:00 {tz}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Days</span>
          <span>
            {[...state.workdays].sort().map((i) => DAYS[i]).join(" ") || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Cap / Retries</span>
          <span className="tabular-nums">
            {state.dailyCap}/day · {state.retryAttempts}×{state.retryGapHours}h
          </span>
        </div>
      </div>
      <div className="rounded-md border bg-muted/30 p-2 text-xs italic text-muted-foreground">
        “{state.opening.slice(0, 140)}{state.opening.length > 140 ? "…" : ""}”
      </div>
    </aside>
  );
}

export function CampaignBuilder() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<BuilderState>({
    name: "",
    audience: { status: "new", source: "all", scoreMin: 40 },
    agentId: "",
    opening: DEFAULT_OPENING,
    objections: DEFAULT_OBJECTIONS,
    newObjection: "",
    timezone: "America/Los_Angeles",
    startHour: 9,
    endHour: 17,
    workdays: new Set([0, 1, 2, 3, 4]),
    dailyCap: 120,
    retryAttempts: 3,
    retryGapHours: 24,
  });

  const agents = useAgents();
  const previewMut = usePreviewAudience();
  const createMut = useCreateCampaign();
  const [audienceCount, setAudienceCount] = useState(0);

  useEffect(() => {
    if (agents.data && !state.agentId) {
      setState((s) => ({ ...s, agentId: agents.data[0].id }));
    }
  }, [agents.data, state.agentId]);

  useEffect(() => {
    let cancelled = false;
    previewMut.mutate(
      {
        status: state.audience.status,
        source: state.audience.source,
        scoreMin: state.audience.scoreMin,
      },
      {
        onSuccess: (n) => {
          if (!cancelled) setAudienceCount(n);
        },
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.audience.status, state.audience.source, state.audience.scoreMin]);

  const agentName = useMemo(() => {
    return agents.data?.find((a) => a.id === state.agentId)?.name ?? "";
  }, [agents.data, state.agentId]);

  const scheduleSummary = useMemo(() => {
    const days = [...state.workdays].sort();
    const consecutive =
      days.length > 0 &&
      days.every((d, i) => i === 0 || d === days[i - 1] + 1);
    const range = consecutive && days.length > 1
      ? `${DAYS[days[0]]}–${DAYS[days[days.length - 1]]}`
      : days.map((i) => DAYS[i]).join(" ");
    return `${range} · ${state.startHour}am–${state.endHour > 12 ? state.endHour - 12 : state.endHour}${state.endHour >= 12 ? "pm" : "am"}`;
  }, [state.workdays, state.startHour, state.endHour]);

  const canAdvance = (() => {
    if (step === 1) return state.name.trim().length > 0 && audienceCount > 0;
    if (step === 2) return state.agentId && state.opening.trim().length > 0;
    if (step === 3) return state.workdays.size > 0 && state.endHour > state.startHour;
    return true;
  })();

  const launch = async () => {
    const input: NewCampaign = {
      name: state.name.trim(),
      agentId: state.agentId,
      audienceFilter: {
        status: state.audience.status,
        source: state.audience.source,
        scoreMin: state.audience.scoreMin,
      },
      scheduleSummary,
    };
    const cmp = await createMut.mutateAsync(input);
    toast.success(`Campaign "${cmp.name}" launched`);
    router.push(`/campaigns/${cmp.id}`);
  };

  return (
    <div className="space-y-4">
      <Stepper step={step} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {step === 1 && (
            <AudienceStep state={state} onChange={setState} audienceCount={audienceCount} />
          )}
          {step === 2 && (
            <AgentStep
              state={state}
              onChange={setState}
              agents={agents.data ?? []}
            />
          )}
          {step === 3 && <ScheduleStep state={state} onChange={setState} />}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">Ready to launch</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review the preview on the right. Launching creates the campaign and starts
                  dialing during the next available window.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Audience
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm">
                  <UsersIcon className="size-3.5" /> {audienceCount.toLocaleString()} leads enrolled
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Schedule
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm">
                  <CalendarClockIcon className="size-3.5" /> {scheduleSummary}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border bg-card p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => Math.max(1, (s - 1) as Step) as Step)}
              disabled={step === 1 || createMut.isPending}
            >
              <ArrowLeftIcon className="size-3.5" /> Back
            </Button>
            <div className="text-xs text-muted-foreground">Step {step} of 4</div>
            {step < 4 ? (
              <Button
                size="sm"
                disabled={!canAdvance}
                onClick={() => setStep((s) => Math.min(4, (s + 1) as Step) as Step)}
              >
                Next <ArrowRightIcon className="size-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={launch} disabled={createMut.isPending}>
                {createMut.isPending ? "Launching…" : "Launch campaign"}
              </Button>
            )}
          </div>
        </div>

        <PreviewPanel state={state} audienceCount={audienceCount} agentName={agentName} />
      </div>
    </div>
  );
}

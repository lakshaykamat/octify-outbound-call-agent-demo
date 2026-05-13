"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSegmentSchedules, useUpdateSegmentSchedules } from "@/hooks/queries";
import type { SegmentScheduleRule } from "@/lib/mock";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function ScheduleRow({
  rule,
  onChange,
  onDelete,
}: {
  rule: SegmentScheduleRule;
  onChange: (next: SegmentScheduleRule) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ ...rule, enabled: !rule.enabled })}
          className={cn(
            "h-5 w-9 shrink-0 rounded-full transition",
            rule.enabled ? "bg-primary" : "bg-muted",
          )}
          aria-label={rule.enabled ? "Disable" : "Enable"}
        >
          <span
            className={cn(
              "block size-4 translate-x-0.5 rounded-full bg-background shadow transition",
              rule.enabled && "translate-x-4",
            )}
          />
        </button>
        <Input
          value={rule.segment}
          onChange={(e) => onChange({ ...rule, segment: e.target.value })}
          placeholder="Segment name"
          className="font-medium"
        />
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-12">
        {DAYS.map((d) => {
          const on = rule.days.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() =>
                onChange({
                  ...rule,
                  days: on ? rule.days.filter((x) => x !== d.key) : [...rule.days, d.key],
                })
              }
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium transition",
                on ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:border-foreground/30",
              )}
            >
              {d.label}
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Input
            type="time"
            value={rule.open}
            onChange={(e) => onChange({ ...rule, open: e.target.value })}
            className="h-8 w-28"
          />
          <span>–</span>
          <Input
            type="time"
            value={rule.close}
            onChange={(e) => onChange({ ...rule, close: e.target.value })}
            className="h-8 w-28"
          />
          <span className="font-mono text-[11px]">{rule.timezone}</span>
        </span>
      </div>
    </div>
  );
}

export function SegmentSchedulesCard() {
  const schedules = useSegmentSchedules();
  const update = useUpdateSegmentSchedules();
  const [draft, setDraft] = useState<SegmentScheduleRule[]>([]);

  useEffect(() => { if (schedules.data) setDraft(schedules.data); }, [schedules.data]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(schedules.data ?? []);

  async function save() {
    try {
      await update.mutateAsync(draft);
      toast.success("Segment schedules updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function addRule() {
    setDraft((d) => [
      ...d,
      {
        id: `seg_${Math.random().toString(36).slice(2, 8)}`,
        segment: "New segment",
        days: ["mon", "tue", "wed", "thu", "fri"],
        open: "09:00",
        close: "17:00",
        timezone: "America/Los_Angeles",
        enabled: true,
      },
    ]);
  }

  return (
    <SectionCard
      title="Hours by segment"
      description="Override base business hours for specific lead segments."
      action={
        <div className="flex gap-2">
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={() => setDraft(schedules.data ?? [])}>
              Reset
            </Button>
          ) : null}
          <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {schedules.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {draft.map((r) => (
            <ScheduleRow
              key={r.id}
              rule={r}
              onChange={(next) => setDraft((d) => d.map((x) => (x.id === r.id ? next : x)))}
              onDelete={() => setDraft((d) => d.filter((x) => x.id !== r.id))}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addRule} className="self-start">
            <Plus className="size-3.5" />
            Add segment
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

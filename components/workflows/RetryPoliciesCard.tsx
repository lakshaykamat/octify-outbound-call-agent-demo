"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRetryPolicies, useUpdateRetryPolicies } from "@/hooks/queries";
import type { RetryPolicyRule } from "@/lib/mock";
import { cn } from "@/lib/utils";

const OUTCOMES: Array<{ key: RetryPolicyRule["outcome"]; label: string }> = [
  { key: "no_answer",          label: "No answer" },
  { key: "voicemail",          label: "Voicemail" },
  { key: "callback_requested", label: "Callback requested" },
  { key: "not_interested",     label: "Not interested" },
  { key: "wrong_number",       label: "Wrong number" },
];

function PolicyRow({
  rule,
  onChange,
  onDelete,
}: {
  rule: RetryPolicyRule;
  onChange: (next: RetryPolicyRule) => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_120px_120px_auto] items-center gap-3 rounded-xl border bg-card p-3">
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
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          On outcome
        </div>
        <select
          value={rule.outcome}
          onChange={(e) => onChange({ ...rule, outcome: e.target.value as RetryPolicyRule["outcome"] })}
          className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {OUTCOMES.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Delay (h)
        </div>
        <Input
          type="number"
          min={0}
          max={168}
          value={rule.delayHours}
          onChange={(e) => onChange({ ...rule, delayHours: Number(e.target.value) })}
          className="mt-1"
        />
      </div>
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Max attempts
        </div>
        <Input
          type="number"
          min={0}
          max={10}
          value={rule.maxAttempts}
          onChange={(e) => onChange({ ...rule, maxAttempts: Number(e.target.value) })}
          className="mt-1"
        />
      </div>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export function RetryPoliciesCard() {
  const policies = useRetryPolicies();
  const update = useUpdateRetryPolicies();
  const [draft, setDraft] = useState<RetryPolicyRule[]>([]);

  useEffect(() => { if (policies.data) setDraft(policies.data); }, [policies.data]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(policies.data ?? []);

  async function save() {
    try {
      await update.mutateAsync(draft);
      toast.success("Retry policies updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function addRule() {
    setDraft((d) => [
      ...d,
      {
        id: `ret_${Math.random().toString(36).slice(2, 8)}`,
        outcome: "no_answer",
        delayHours: 18,
        maxAttempts: 3,
        enabled: true,
      },
    ]);
  }

  return (
    <SectionCard
      title="Retry policies"
      description="When the agent should try again, and how many times."
      action={
        <div className="flex gap-2">
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={() => setDraft(policies.data ?? [])}>
              Reset
            </Button>
          ) : null}
          <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {policies.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {draft.map((r) => (
            <PolicyRow
              key={r.id}
              rule={r}
              onChange={(next) => setDraft((d) => d.map((x) => (x.id === r.id ? next : x)))}
              onDelete={() => setDraft((d) => d.filter((x) => x.id !== r.id))}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addRule} className="self-start">
            <Plus className="size-3.5" />
            Add policy
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

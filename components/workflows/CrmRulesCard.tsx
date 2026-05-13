"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Tag, Trash2, Plus } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmRules, useUpdateCrmRules } from "@/hooks/queries";
import type { CrmMappingRule } from "@/lib/mock";
import { cn } from "@/lib/utils";

const OUTCOME_LABEL: Record<CrmMappingRule["when"]["outcome"], string> = {
  meeting_booked:     "Meeting booked",
  callback_requested: "Callback requested",
  not_interested:     "Not interested",
  voicemail:          "Voicemail",
  opted_out:          "Opted out",
  wrong_number:       "Wrong number",
  other:              "Other",
};

const OUTCOME_KEYS = Object.keys(OUTCOME_LABEL) as Array<keyof typeof OUTCOME_LABEL>;

function RuleRow({
  rule,
  onChange,
  onDelete,
}: {
  rule: CrmMappingRule;
  onChange: (next: CrmMappingRule) => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_2fr_auto] items-center gap-3 rounded-xl border bg-card p-3">
      <button
        type="button"
        onClick={() => onChange({ ...rule, enabled: !rule.enabled })}
        className={cn(
          "h-5 w-9 shrink-0 rounded-full transition",
          rule.enabled ? "bg-primary" : "bg-muted",
        )}
        aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
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
          When outcome is
        </div>
        <select
          value={rule.when.outcome}
          onChange={(e) =>
            onChange({ ...rule, when: { outcome: e.target.value as CrmMappingRule["when"]["outcome"] } })
          }
          className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {OUTCOME_KEYS.map((k) => (
            <option key={k} value={k}>{OUTCOME_LABEL[k]}</option>
          ))}
        </select>
      </div>
      <div className="text-xs text-muted-foreground">→</div>
      <div className="grid gap-2">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Set stage / add tag
          </div>
          <div className="mt-1 flex gap-2">
            <Input
              value={rule.then.stage}
              onChange={(e) => onChange({ ...rule, then: { ...rule.then, stage: e.target.value } })}
              placeholder="HubSpot stage"
              className="flex-1"
            />
            <Input
              value={rule.then.addTag ?? ""}
              onChange={(e) =>
                onChange({ ...rule, then: { ...rule.then, addTag: e.target.value || null } })
              }
              placeholder="Optional tag"
              className="flex-1"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={rule.then.notifyOwner}
            onChange={(e) => onChange({ ...rule, then: { ...rule.then, notifyOwner: e.target.checked } })}
            className="size-3.5 rounded border-input"
          />
          <Bell className="size-3" /> Notify owner
          {rule.then.addTag ? (
            <Badge variant="secondary" className="ml-2 gap-1">
              <Tag className="size-2.5" />
              {rule.then.addTag}
            </Badge>
          ) : null}
        </label>
      </div>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export function CrmRulesCard() {
  const rules = useCrmRules();
  const update = useUpdateCrmRules();
  const [draft, setDraft] = useState<CrmMappingRule[]>([]);

  useEffect(() => { if (rules.data) setDraft(rules.data); }, [rules.data]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(rules.data ?? []);

  async function save() {
    try {
      await update.mutateAsync(draft);
      toast.success("CRM rules updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function addRule() {
    setDraft((d) => [
      ...d,
      {
        id: `crm_${Math.random().toString(36).slice(2, 8)}`,
        when: { outcome: "callback_requested" },
        then: { stage: "Follow Up", notifyOwner: false, addTag: null },
        enabled: true,
      },
    ]);
  }

  return (
    <SectionCard
      title="CRM mapping"
      description="What happens in your CRM after each call outcome."
      action={
        <div className="flex gap-2">
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={() => setDraft(rules.data ?? [])}>
              Reset
            </Button>
          ) : null}
          <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {rules.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {draft.map((r) => (
            <RuleRow
              key={r.id}
              rule={r}
              onChange={(next) => setDraft((d) => d.map((x) => (x.id === r.id ? next : x)))}
              onDelete={() => setDraft((d) => d.filter((x) => x.id !== r.id))}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addRule} className="self-start">
            <Plus className="size-3.5" />
            Add rule
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

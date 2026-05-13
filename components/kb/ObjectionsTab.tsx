"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { EditableEntry, type Field } from "./EditableEntry";
import { SuggestionsPanel } from "./SuggestionsCard";
import { useAiSuggestObjections, useUpdateKnowledgeBase } from "@/hooks/queries";
import type { KbObjection, KnowledgeBase } from "@/lib/mock";

const FIELDS: Field<KbObjection>[] = [
  { key: "objection", label: "Objection",  placeholder: "What the prospect says", multiline: true },
  { key: "response",  label: "Response",   placeholder: "How the agent responds", multiline: true },
];
const EMPTY: KbObjection = { objection: "", response: "" };

export function ObjectionsTab({ kb }: { kb: KnowledgeBase }) {
  const update = useUpdateKnowledgeBase();
  const suggest = useAiSuggestObjections();
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<KbObjection[] | null>(null);

  async function commit(next: KbObjection[]) {
    try { await update.mutateAsync({ objections: next }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  }

  function updateAt(i: number, v: KbObjection) {
    const next = [...kb.objections];
    next[i] = v;
    return commit(next).then(() => toast.success("Objection updated"));
  }
  function removeAt(i: number) {
    return commit(kb.objections.filter((_, idx) => idx !== i)).then(() => toast.success("Removed"));
  }
  function addOne(v: KbObjection) {
    return commit([...kb.objections, v]).then(() => {
      setAdding(false);
      toast.success("Objection added");
    });
  }

  async function loadSuggestions() {
    setSuggestions([]);
    try {
      const items = await suggest.mutateAsync();
      setSuggestions(items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load suggestions");
      setSuggestions(null);
    }
  }

  function accept(item: KbObjection) {
    commit([...kb.objections, item]).then(() => toast.success("Accepted"));
    setSuggestions((cur) => (cur ? cur.filter((s) => s !== item) : cur));
  }

  return (
    <SectionCard
      title="Objections"
      description="What you hear in the wild, and how the agent handles each one."
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadSuggestions} disabled={suggest.isPending}>
            <Sparkles className="size-3.5" />
            {suggest.isPending ? "Thinking…" : "AI suggest"}
          </Button>
          <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <SuggestionsPanel
          open={suggestions !== null}
          loading={suggest.isPending}
          items={suggestions ?? []}
          render={(it) => (
            <div>
              <div className="font-medium">&ldquo;{it.objection}&rdquo;</div>
              <div className="mt-1 text-xs text-muted-foreground">{it.response}</div>
            </div>
          )}
          onAccept={accept}
          onDismiss={(i) =>
            setSuggestions((cur) => (cur ? cur.filter((_, idx) => idx !== i) : cur))
          }
          onClose={() => setSuggestions(null)}
        />
        {adding ? (
          <EditableEntry
            value={EMPTY}
            fields={FIELDS}
            view={() => null}
            initiallyEditing
            onCancelNew={() => setAdding(false)}
            onSave={addOne}
            onDelete={() => setAdding(false)}
          />
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {kb.objections.map((o, i) => (
            <EditableEntry
              key={i}
              value={o}
              fields={FIELDS}
              view={(v) => (
                <div className="pr-16">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Objection {(i + 1).toString().padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-sm font-medium">&ldquo;{v.objection}&rdquo;</div>
                  <p className="mt-2 text-sm text-muted-foreground">{v.response}</p>
                </div>
              )}
              onSave={(next) => updateAt(i, next)}
              onDelete={() => removeAt(i)}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

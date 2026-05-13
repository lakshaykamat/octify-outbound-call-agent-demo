"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { EditableEntry, type Field } from "./EditableEntry";
import { SuggestionsPanel } from "./SuggestionsCard";
import { useAiSuggestFaqs, useUpdateKnowledgeBase } from "@/hooks/queries";
import type { KbFaq, KnowledgeBase } from "@/lib/mock";

type FaqRow = { question: string; answer: string };

const FIELDS: Field<FaqRow>[] = [
  { key: "question", label: "Question", placeholder: "Question prospects ask" },
  { key: "answer",   label: "Answer",   multiline: true, placeholder: "What the agent should say" },
];
const EMPTY: FaqRow = { question: "", answer: "" };

function normalize(f: KbFaq): FaqRow {
  return { question: f.question, answer: f.answer };
}

export function FaqsTab({ kb }: { kb: KnowledgeBase }) {
  const update = useUpdateKnowledgeBase();
  const suggest = useAiSuggestFaqs();
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<KbFaq[] | null>(null);

  const rows = kb.faqs.map(normalize);

  async function commit(next: FaqRow[]) {
    try { await update.mutateAsync({ faqs: next }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  }

  function updateAt(i: number, v: FaqRow) {
    const next = [...rows];
    next[i] = v;
    return commit(next).then(() => toast.success("FAQ updated"));
  }
  function removeAt(i: number) {
    return commit(rows.filter((_, idx) => idx !== i)).then(() => toast.success("Removed"));
  }
  function addOne(v: FaqRow) {
    return commit([...rows, v]).then(() => {
      setAdding(false);
      toast.success("FAQ added");
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

  function accept(item: KbFaq) {
    commit([...rows, normalize(item)]).then(() => toast.success("Accepted"));
    setSuggestions((cur) => (cur ? cur.filter((s) => s !== item) : cur));
  }

  return (
    <SectionCard
      title="FAQs"
      description="Recurring questions and the canonical answer."
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
              <div className="font-medium">{it.question}</div>
              <div className="mt-1 text-xs text-muted-foreground">{it.answer}</div>
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
        {rows.map((f, i) => (
          <EditableEntry
            key={i}
            value={f}
            fields={FIELDS}
            view={(v) => (
              <div className="pr-16">
                <div className="text-sm font-medium">{v.question}</div>
                <p className="mt-1 text-sm text-muted-foreground">{v.answer}</p>
              </div>
            )}
            onSave={(next) => updateAt(i, next)}
            onDelete={() => removeAt(i)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

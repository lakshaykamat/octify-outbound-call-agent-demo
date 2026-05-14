"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, GripVertical } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateKnowledgeBase } from "@/hooks/queries";
import type { KnowledgeBase } from "@/lib/mock";

function QualifyingList({ items }: { items: string[] }) {
  const update = useUpdateKnowledgeBase();
  const [draftNew, setDraftNew] = useState("");

  async function commit(next: string[], msg: string) {
    try {
      await update.mutateAsync({ qualifyingQuestions: next });
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function updateAt(i: number, value: string) {
    const next = [...items];
    next[i] = value;
    return commit(next, "Question updated");
  }
  function removeAt(i: number) {
    return commit(items.filter((_, idx) => idx !== i), "Question removed");
  }
  function addNew() {
    const v = draftNew.trim();
    if (!v) return;
    commit([...items, v], "Question added");
    setDraftNew("");
  }

  return (
    <SectionCard
      bare
      title="Qualifying questions"
      description="What the agent asks to confirm a prospect is worth booking time with."
    >
      <div className="flex flex-col gap-3">
        <ol className="flex flex-col gap-2">
          {items.map((q, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <GripVertical className="size-3.5 text-muted-foreground/50" />
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {i + 1}.
              </span>
              <Input
                value={q}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  // Local update — commit on blur.
                  e.target.dataset.dirty = "true";
                }}
                onBlur={(e) => {
                  if (e.currentTarget.dataset.dirty === "true" && e.currentTarget.value !== q) {
                    updateAt(i, e.currentTarget.value);
                  }
                }}
                defaultValue={q}
                className="h-8 border-0 px-2 shadow-none focus-visible:ring-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeAt(i)}
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          <Input
            value={draftNew}
            onChange={(e) => setDraftNew(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addNew(); }}
            placeholder="Add a qualifying question"
            className="flex-1"
          />
          <Button onClick={addNew} disabled={!draftNew.trim()}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function DoNotMentionList({ items }: { items: string[] }) {
  const update = useUpdateKnowledgeBase();
  const [draft, setDraft] = useState("");

  async function commit(next: string[], msg: string) {
    try {
      await update.mutateAsync({ doNotMention: next });
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function remove(i: number) {
    return commit(items.filter((_, idx) => idx !== i), "Removed");
  }
  function add() {
    const v = draft.trim();
    if (!v) return;
    commit([...items, v], "Added to do-not-mention");
    setDraft("");
  }

  return (
    <SectionCard
      bare
      title="Do not mention"
      description="Topics the agent must avoid in any call — compliance, sensitive deals, internal jargon."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <span className="text-sm text-muted-foreground">Nothing on the list.</span>
          ) : (
            items.map((d, i) => (
              <Badge
                key={i}
                variant="destructive"
                className="gap-1.5 pr-1"
              >
                {d}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-sm p-0.5 hover:bg-white/10"
                  aria-label={`Remove ${d}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder="e.g. internal model names"
            className="flex-1"
          />
          <Button onClick={add} disabled={!draft.trim()}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function GuardsTab({ kb }: { kb: KnowledgeBase }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <QualifyingList items={kb.qualifyingQuestions} />
      <DoNotMentionList items={kb.doNotMention} />
    </div>
  );
}

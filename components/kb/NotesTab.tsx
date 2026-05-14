"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { useUpdateKnowledgeBase } from "@/hooks/queries";
import type { KnowledgeBase } from "@/lib/mock";

function NoteCard({
  title,
  description,
  value,
  field,
}: {
  title: string;
  description: string;
  value: string;
  field: "competitorNotes" | "pricingNotes";
}) {
  const update = useUpdateKnowledgeBase();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const dirty = draft !== value;

  async function save() {
    try {
      await update.mutateAsync({ [field]: draft });
      toast.success(`${title} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <SectionCard
      title={title}
      description={description}
      action={
        dirty ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft(value)}>
              Reset
            </Button>
            <Button size="sm" onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : null
      }
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        className="min-h-[180px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </SectionCard>
  );
}

export function NotesTab({ kb }: { kb: KnowledgeBase }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <NoteCard
        title="Competitor notes"
        description="How to position against each competitor when their name comes up."
        value={kb.competitorNotes}
        field="competitorNotes"
      />
      <NoteCard
        title="Pricing notes"
        description="Rules of thumb the agent should follow around price."
        value={kb.pricingNotes}
        field="pricingNotes"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { EditableEntry, type Field } from "./EditableEntry";
import { useUpdateKnowledgeBase } from "@/hooks/queries";
import type { KbCaseStudy, KnowledgeBase } from "@/lib/mock";

const FIELDS: Field<KbCaseStudy>[] = [
  { key: "customer", label: "Customer", placeholder: "Acme Robotics" },
  { key: "outcome",  label: "Outcome",  multiline: true, placeholder: "What changed for them" },
  { key: "metric",   label: "Metric",   placeholder: "+31% meetings booked in 6 weeks" },
];

const EMPTY: KbCaseStudy = { customer: "", outcome: "", metric: "" };

export function CaseStudiesTab({ kb }: { kb: KnowledgeBase }) {
  const update = useUpdateKnowledgeBase();
  const [adding, setAdding] = useState(false);

  async function commit(next: KbCaseStudy[]) {
    try { await update.mutateAsync({ caseStudies: next }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  }

  function updateAt(i: number, v: KbCaseStudy) {
    const next = [...kb.caseStudies];
    next[i] = v;
    return commit(next).then(() => toast.success("Case study updated"));
  }
  function removeAt(i: number) {
    return commit(kb.caseStudies.filter((_, idx) => idx !== i)).then(() => toast.success("Removed"));
  }
  function addOne(v: KbCaseStudy) {
    return commit([...kb.caseStudies, v]).then(() => {
      setAdding(false);
      toast.success("Case study added");
    });
  }

  return (
    <SectionCard
      bare
      action={
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="size-3.5" />
          Add case study
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
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
        {kb.caseStudies.map((c, i) => (
          <EditableEntry
            key={`${c.customer}-${i}`}
            value={c}
            fields={FIELDS}
            view={(v) => (
              <div className="pr-16">
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Customer
                </div>
                <div className="mt-1 text-sm font-semibold">{v.customer}</div>
                <p className="mt-2 text-sm">{v.outcome}</p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">{v.metric}</p>
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

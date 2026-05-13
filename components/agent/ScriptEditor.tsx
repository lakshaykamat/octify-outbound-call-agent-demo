"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAgentScript,
  useAiRewriteSection,
  useUpdateAgentScript,
} from "@/hooks/queries";
import type { AgentScript, ScriptSectionKey } from "@/lib/mock";

const SECTIONS: Array<{ key: ScriptSectionKey; label: string; description: string }> = [
  { key: "opening",       label: "Opening",       description: "First 8 seconds. Earn the next sentence." },
  { key: "qualification", label: "Qualification", description: "Confirm the contact is the right person." },
  { key: "pitch",         label: "Pitch",         description: "The single sentence they remember." },
  { key: "objections",    label: "Objections",    description: "Soft acknowledgement, one rebuttal, accept the answer." },
  { key: "close",         label: "Close",         description: "Concrete two-slot ask. No open-ended follow-ups." },
];

function SectionEditor({
  section,
  initialValue,
  onChanged,
}: {
  section: (typeof SECTIONS)[number];
  initialValue: string;
  onChanged: (key: ScriptSectionKey, value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [animating, setAnimating] = useState(false);
  const update = useUpdateAgentScript();
  const rewrite = useAiRewriteSection();
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInitial = useRef(initialValue);

  useEffect(() => {
    if (initialValue !== lastInitial.current) {
      setValue(initialValue);
      lastInitial.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => () => { if (animTimer.current) clearTimeout(animTimer.current); }, []);

  async function commit() {
    if (value === initialValue) return;
    try {
      await update.mutateAsync({ section: section.key, value });
      onChanged(section.key, value);
      toast.success(`${section.label} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function aiRewrite() {
    if (animating) return;
    try {
      const next = await rewrite.mutateAsync(section.key);
      setAnimating(true);
      // Typing animation.
      let i = 0;
      setValue("");
      const tick = () => {
        i += Math.max(2, Math.round(next.length / 60));
        if (i >= next.length) {
          setValue(next);
          setAnimating(false);
          update.mutateAsync({ section: section.key, value: next }).then(() => {
            onChanged(section.key, next);
            toast.success(`${section.label} rewritten`);
          });
          return;
        }
        setValue(next.slice(0, i));
        animTimer.current = setTimeout(tick, 25);
      };
      tick();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rewrite failed");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{section.label}</div>
          <div className="text-[11px] text-muted-foreground">{section.description}</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={aiRewrite}
          disabled={animating || rewrite.isPending}
        >
          <Sparkles className="size-3.5" />
          {rewrite.isPending ? "Thinking…" : animating ? "Writing…" : "AI rewrite"}
        </Button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        rows={4}
        disabled={animating}
        className="mt-3 min-h-[110px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}

export function ScriptEditor() {
  const script = useAgentScript();

  if (script.isLoading || !script.data) {
    return (
      <SectionCard title="Script" description="Sectioned talk track with per-section AI rewrites.">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Script"
      description="Sectioned talk track. Click AI rewrite for an alternative — it edits in place."
    >
      <div className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <SectionEditor
            key={s.key}
            section={s}
            initialValue={(script.data as AgentScript)[s.key]}
            onChanged={() => {}}
          />
        ))}
      </div>
    </SectionCard>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useAgentScript,
  useAgentVersions,
  useRestoreAgentVersion,
  useSaveAgentVersion,
} from "@/hooks/queries";
import type { AgentConfig, AgentScript, AgentVersion, ScriptSectionKey } from "@/lib/mock";

function formatStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const SECTION_LABELS: Record<ScriptSectionKey, string> = {
  opening: "Opening",
  qualification: "Qualification",
  pitch: "Pitch",
  objections: "Objections",
  close: "Close",
};

function VersionRow({
  v,
  onView,
  onRestore,
  restoring,
}: {
  v: AgentVersion;
  onView: () => void;
  onRestore: () => void;
  restoring: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{v.label}</div>
        <div className="text-[11px] text-muted-foreground">
          {formatStamp(v.createdAt)} · {v.author}
        </div>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{v.note}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" onClick={onView}>View</Button>
        <Button variant="outline" size="sm" onClick={onRestore} disabled={restoring}>
          <RotateCcw className="size-3.5" />
          Restore
        </Button>
      </div>
    </li>
  );
}

function DiffView({
  version,
  current,
  currentScript,
}: {
  version: AgentVersion;
  current: AgentConfig;
  currentScript: AgentScript;
}) {
  const snap = version.snapshot;
  const fieldRows: Array<{ label: string; was: string; now: string }> = [
    { label: "Name",        was: snap.name,        now: current.agent.name },
    { label: "Objective",   was: snap.objective,   now: current.objective },
    { label: "Voice",       was: snap.voiceId,     now: current.agent.voice?.voiceId ?? "" },
    { label: "Speech rate", was: `${snap.speed.toFixed(2)}×`, now: `${(current.agent.voice?.speed ?? 1).toFixed(2)}×` },
    { label: "Creativity",  was: snap.temperature.toFixed(2), now: (current.agent.llm?.temperature ?? 0).toFixed(2) },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border">
        <div className="grid grid-cols-[120px_1fr_1fr] border-b bg-muted/50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <div>Field</div>
          <div>This version</div>
          <div>Now</div>
        </div>
        {fieldRows.map((r) => {
          const changed = r.was !== r.now;
          return (
            <div
              key={r.label}
              className="grid grid-cols-[120px_1fr_1fr] gap-3 border-b px-3 py-2 text-xs last:border-b-0"
            >
              <div className="font-medium text-muted-foreground">{r.label}</div>
              <div className={changed ? "rounded bg-amber-500/[0.08] px-2 py-1" : "px-2 py-1"}>
                {r.was}
              </div>
              <div className={changed ? "rounded bg-emerald-500/[0.08] px-2 py-1" : "px-2 py-1"}>
                {r.now}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        {(Object.keys(SECTION_LABELS) as ScriptSectionKey[]).map((key) => {
          const was = snap.script[key];
          const now = currentScript[key];
          const changed = was !== now;
          return (
            <div key={key} className="rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {SECTION_LABELS[key]}
                </span>
                {changed ? (
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                    Changed
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Same</span>
                )}
              </div>
              <div className="grid gap-0 sm:grid-cols-2">
                <div className={"border-r p-3 text-xs leading-relaxed " + (changed ? "bg-amber-500/[0.05]" : "")}>
                  {was}
                </div>
                <div className={"p-3 text-xs leading-relaxed " + (changed ? "bg-emerald-500/[0.05]" : "")}>
                  {now}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VersionsCard({ a }: { a: AgentConfig }) {
  const versions = useAgentVersions();
  const script = useAgentScript();
  const save = useSaveAgentVersion();
  const restore = useRestoreAgentVersion();
  const [note, setNote] = useState("");
  const [viewing, setViewing] = useState<AgentVersion | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<AgentVersion | null>(null);

  async function onSave() {
    try {
      const v = await save.mutateAsync(note.trim());
      setNote("");
      toast.success(`Saved ${v.label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function onRestore() {
    if (!confirmRestore) return;
    try {
      await restore.mutateAsync(confirmRestore.id);
      toast.success(`Restored ${confirmRestore.label}`);
      setConfirmRestore(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    }
  }

  return (
    <SectionCard
      title="Versions"
      description="Every save is captured. Restore puts the agent back to that exact state."
      action={<History className="size-4 text-muted-foreground" />}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed?"
            className="flex-1"
          />
          <Button onClick={onSave} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save version"}
          </Button>
        </div>
        {versions.isLoading || !versions.data ? (
          <Skeleton className="h-32" />
        ) : versions.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved versions yet.</p>
        ) : (
          <ul className="divide-y">
            {versions.data.map((v) => (
              <VersionRow
                key={v.id}
                v={v}
                onView={() => setViewing(v)}
                onRestore={() => setConfirmRestore(v)}
                restoring={restore.isPending}
              />
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.label}</DialogTitle>
            <DialogDescription>
              {viewing ? `${formatStamp(viewing.createdAt)} · ${viewing.author}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing && script.data ? (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <DiffView version={viewing} current={a} currentScript={script.data} />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
            <Button
              onClick={() => {
                const v = viewing;
                setViewing(null);
                setConfirmRestore(v);
              }}
            >
              <RotateCcw className="size-4" />
              Restore this version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRestore} onOpenChange={(o) => !o && setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore {confirmRestore?.label}?</DialogTitle>
            <DialogDescription>
              This replaces the live agent configuration and script with this version. The current state will be saved as a new version first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRestore(null)}>Cancel</Button>
            <Button onClick={onRestore} disabled={restore.isPending}>
              {restore.isPending ? "Restoring…" : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

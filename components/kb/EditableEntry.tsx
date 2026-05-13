"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Field<T> = {
  key: keyof T;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  optional?: boolean;
};

type Props<T extends Record<string, string>> = {
  value: T;
  fields: Field<T>[];
  view: (v: T) => ReactNode;
  onSave: (next: T) => Promise<unknown> | void;
  onDelete: () => Promise<unknown> | void;
  className?: string;
  initiallyEditing?: boolean;
  onCancelNew?: () => void;
};

export function EditableEntry<T extends Record<string, string>>({
  value,
  fields,
  view,
  onSave,
  onDelete,
  className,
  initiallyEditing,
  onCancelNew,
}: Props<T>) {
  const [editing, setEditing] = useState(!!initiallyEditing);
  const [draft, setDraft] = useState<T>(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  async function save() {
    setBusy(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    if (initiallyEditing && onCancelNew) {
      onCancelNew();
      return;
    }
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={cn("rounded-xl border bg-card p-4", className)}>
        <div className="grid gap-3">
          {fields.map((f) => (
            <label key={String(f.key)} className="block">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {f.label}
                {f.optional ? <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">(optional)</span> : null}
              </span>
              {f.multiline ? (
                <textarea
                  value={(draft[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [f.key]: e.target.value }) as T)
                  }
                  rows={3}
                  placeholder={f.placeholder}
                  disabled={busy}
                  className="min-h-[88px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              ) : (
                <Input
                  value={(draft[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [f.key]: e.target.value }) as T)
                  }
                  placeholder={f.placeholder}
                  disabled={busy}
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative rounded-xl border bg-card p-4", className)}>
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setEditing(true)}
          aria-label="Edit"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={() => onDelete()}
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {view(value)}
    </div>
  );
}

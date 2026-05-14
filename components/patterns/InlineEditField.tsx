"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onSave: (next: string) => Promise<unknown> | void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
  ariaLabel?: string;
};

export function InlineEditField({
  value,
  onSave,
  placeholder = "-",
  multiline,
  className,
  inputClassName,
  displayClassName,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        {multiline ? (
          <textarea
            ref={(el) => { inputRef.current = el; }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            }}
            rows={4}
            aria-label={ariaLabel}
            className={cn(
              "min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              inputClassName,
            )}
            disabled={saving}
          />
        ) : (
          <Input
            ref={(el) => { inputRef.current = el; }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") commit();
            }}
            aria-label={ariaLabel}
            className={inputClassName}
            disabled={saving}
          />
        )}
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={commit}
            disabled={saving}
            aria-label="Save"
          >
            <Check className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={cancel}
            disabled={saving}
            aria-label="Cancel"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "group flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted/60 -mx-2",
        className,
      )}
      aria-label={ariaLabel ?? "Edit"}
    >
      <span className={cn("flex-1 whitespace-pre-wrap leading-relaxed", !value && "text-muted-foreground", displayClassName)}>
        {value || placeholder}
      </span>
      <Pencil className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/0 transition group-hover:text-muted-foreground" />
    </button>
  );
}

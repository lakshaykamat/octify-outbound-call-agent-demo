"use client";

import { Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props<T> = {
  open: boolean;
  loading: boolean;
  items: T[];
  render: (v: T) => React.ReactNode;
  onAccept: (v: T) => void;
  onDismiss: (i: number) => void;
  onClose: () => void;
};

export function SuggestionsPanel<T>({
  open, loading, items, render, onAccept, onDismiss, onClose,
}: Props<T>) {
  if (!open) return null;
  return (
    <div className="rounded-xl border border-dashed bg-primary/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className={cn("size-3.5 text-primary", loading && "animate-pulse")} />
          AI suggestions
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Drafting suggestions from your KB…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground">No more suggestions.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex-1 text-sm">{render(it)}</div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onAccept(it)}
                  aria-label="Accept"
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => onDismiss(i)}
                  aria-label="Dismiss"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

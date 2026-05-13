import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  id: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-4", className)}>
      {items.map((item, i) => (
        <li key={item.id} className="relative pl-8">
          <span
            className={cn(
              "absolute left-2.5 top-2 h-full w-px bg-border",
              i === items.length - 1 && "hidden",
            )}
            aria-hidden
          />
          <span className="absolute left-0 top-0 flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground">
            {item.icon ?? <span className="size-1.5 rounded-full bg-foreground/60" />}
          </span>
          <div className="space-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              {item.meta ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {item.meta}
                </span>
              ) : null}
            </div>
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

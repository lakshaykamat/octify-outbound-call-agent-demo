import type { ReactNode } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  noPadding,
  bare,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <section className={cn("flex flex-col gap-5", className)}>
        {(title || description || action) && (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? (
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </section>
    );
  }

  return (
    <Card className={className}>
      {(title || description || action) && (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      )}
      <CardContent className={cn(noPadding && "p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

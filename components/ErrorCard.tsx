import { AlertCircleIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function ErrorCard({
  message = "Something went wrong.",
  detail,
  className,
}: {
  message?: string;
  detail?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-3 px-4 py-6">
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {detail && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

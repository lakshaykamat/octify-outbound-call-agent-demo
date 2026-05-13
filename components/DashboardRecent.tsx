"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRightIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorCard } from "@/components/ErrorCard";
import { useCalls } from "@/hooks/queries";
import { formatDuration } from "@/lib/format";
import { outcomeBadgeVariant, outcomeLabel } from "@/lib/outcomes";

const PREVIEW = 6;

function RecentSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: PREVIEW }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function DashboardRecent() {
  const callsQuery = useCalls({ page: 1, limit: PREVIEW });

  if (callsQuery.isError) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Couldn't load recent calls."
          detail={callsQuery.error instanceof Error ? callsQuery.error.message : undefined}
        />
      </div>
    );
  }

  const calls = callsQuery.data?.calls ?? [];

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Recent calls</CardTitle>
              <CardDescription>Latest activity from the agent.</CardDescription>
            </div>
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/calls" />}>
              View all
              <ArrowRightIcon />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {callsQuery.isLoading ? (
            <RecentSkeleton />
          ) : calls.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No calls placed yet.
            </p>
          ) : (
            <ul className="divide-y">
              {calls.map((call) => {
                const startedAt = call.startedAt ?? call.createdAt;
                return (
                  <li
                    key={call._id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="w-28 shrink-0 text-xs text-muted-foreground tabular-nums">
                      {format(new Date(startedAt), "MMM d, HH:mm")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {call.prospectName || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">
                        {call.phone}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                      {formatDuration(call.durationSec)}
                    </span>
                    <div className="w-32 shrink-0 text-right">
                      {call.analysis?.outcome ? (
                        <Badge variant={outcomeBadgeVariant(call.analysis.outcome)}>
                          {outcomeLabel(call.analysis.outcome)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CallsFilters, type OutcomeFilter } from "@/components/CallsFilters";
import { CallsTable } from "@/components/CallsTable";
import { CallDrawer } from "@/components/CallDrawer";
import { ErrorCard } from "@/components/ErrorCard";
import { useCalls } from "@/hooks/queries";
import { useExportCalls } from "@/hooks/useExportCalls";
import type { Outcome } from "@/lib/mock";

const PAGE_SIZE = 25;

function toApiOutcome(filter: OutcomeFilter): Outcome | undefined {
  return filter === "all" ? undefined : filter;
}

function Pagination({
  page,
  pageCount,
  total,
  disabled,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 lg:px-6">
      <p className="text-sm text-muted-foreground tabular-nums">
        Page {page} of {pageCount} · {total} calls
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={disabled || page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={disabled || page >= pageCount}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function CallsPage() {
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const apiOutcome = toApiOutcome(outcome);
  const callsQuery = useCalls({ outcome: apiOutcome, page, limit: PAGE_SIZE });
  const { exportCsv, exporting } = useExportCalls();

  const total = callsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <CallsFilters
          outcome={outcome}
          onOutcomeChange={(next) => {
            setPage(1);
            setOutcome(next);
          }}
          onExport={() => exportCsv({ outcome: apiOutcome })}
          exporting={exporting}
        />

        {callsQuery.isError ? (
          <ErrorCard
            message="Couldn't load calls."
            detail={callsQuery.error instanceof Error ? callsQuery.error.message : undefined}
          />
        ) : (
          <CallsTable
            calls={callsQuery.data?.calls ?? []}
            isLoading={callsQuery.isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        disabled={callsQuery.isFetching}
        onChange={setPage}
      />

      <CallDrawer
        callId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

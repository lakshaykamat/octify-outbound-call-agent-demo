"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns";
import { PhoneOffIcon } from "lucide-react";
import type { XyloCall } from "@/lib/api/types";
import { formatDuration } from "@/lib/format";
import {
  outcomeBadgeVariant,
  outcomeLabel,
  sentimentLabel,
  sentimentTone,
} from "@/lib/outcomes";

function RecordingCell({ call }: { call: XyloCall }) {
  if (!call.recordingUrl) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <a
      href={call.recordingUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-mono text-xs text-primary underline-offset-2 hover:underline"
    >
      Open
    </a>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function CallsEmpty() {
  return (
    <EmptyState
      icon={<PhoneOffIcon className="size-5" />}
      title="No calls match these filters"
      description="Try clearing the outcome filter or widening the date range."
    />
  );
}

function useColumns(onSelect: (id: string) => void): ColumnDef<XyloCall>[] {
  return useMemo(
    () => [
      {
        id: "when",
        header: "When",
        accessorFn: (call) => call.startedAt ?? call.createdAt,
        sortingFn: "datetime",
        cell: ({ getValue }) => (
          <span className="tabular-nums whitespace-nowrap">
            {format(new Date(getValue<string>()), "MMM d, HH:mm")}
          </span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        accessorFn: (call) => call.prospectName || "Unknown",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.prospectName || "Unknown"}</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {row.original.phone}
            </div>
          </div>
        ),
      },
      {
        id: "outcome",
        header: "Outcome",
        accessorFn: (call) => call.analysis?.outcome ?? "",
        cell: ({ row }) => {
          const outcome = row.original.analysis?.outcome;
          return outcome ? (
            <Badge variant={outcomeBadgeVariant(outcome)}>
              {outcomeLabel(outcome)}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "sentiment",
        header: "Sentiment",
        accessorFn: (call) => call.analysis?.sentiment ?? "",
        cell: ({ row }) => (
          <span className={sentimentTone(row.original.analysis?.sentiment ?? null)}>
            {sentimentLabel(row.original.analysis?.sentiment ?? null)}
          </span>
        ),
      },
      {
        id: "duration",
        header: () => <span className="block text-right">Duration</span>,
        accessorFn: (call) => call.durationSec ?? 0,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {formatDuration(row.original.durationSec)}
          </div>
        ),
      },
      {
        id: "score",
        header: () => <span className="block text-right">Score</span>,
        accessorFn: (call) => call.analysis?.score ?? -1,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.analysis?.score ?? "—"}
          </div>
        ),
      },
      {
        id: "recording",
        header: "Recording",
        enableSorting: false,
        cell: ({ row }) => <RecordingCell call={row.original} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(row.original._id);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [onSelect],
  );
}

export function CallsTable({
  calls,
  isLoading,
  selectedId,
  onSelect,
}: {
  calls: XyloCall[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "when", desc: true },
  ]);
  const columns = useColumns(onSelect);

  const table = useReactTable({
    data: calls,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  if (isLoading) return <TableSkeleton />;
  if (calls.length === 0) return <CallsEmpty />;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={canSort ? "cursor-pointer select-none" : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDir === "asc" && <span aria-hidden>↑</span>}
                      {sortDir === "desc" && <span aria-hidden>↓</span>}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-selected={row.original._id === selectedId || undefined}
              className="cursor-pointer data-[selected=true]:bg-muted/60"
              onClick={() => onSelect(row.original._id)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

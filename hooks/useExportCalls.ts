"use client";

import { useMutation } from "@tanstack/react-query";
import { buildCallsCsv } from "@/lib/csv";
import type { CallsQuery } from "@/lib/mock";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function todayFilename() {
  return `motornexo-calls-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function useExportCalls() {
  const mutation = useMutation({
    mutationFn: (query: CallsQuery) => buildCallsCsv(query),
    onSuccess: (blob) => downloadBlob(blob, todayFilename()),
    onError: (err) => console.error("CSV export failed", err),
  });

  return {
    exportCsv: (query: CallsQuery) => mutation.mutate(query),
    exporting: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
  };
}

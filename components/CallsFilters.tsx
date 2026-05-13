"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUTCOME_OPTIONS } from "@/lib/outcomes";
import type { Outcome } from "@/lib/api/types";

export type OutcomeFilter = Outcome | "all";

export function CallsFilters({
  outcome,
  onOutcomeChange,
  onExport,
  exporting,
}: {
  outcome: OutcomeFilter;
  onOutcomeChange: (value: OutcomeFilter) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={outcome}
        onValueChange={(value) => onOutcomeChange(value as OutcomeFilter)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All outcomes</SelectItem>
          {OUTCOME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto">
        <Button variant="outline" onClick={onExport} disabled={exporting}>
          {exporting ? "Preparing…" : "Export CSV"}
        </Button>
      </div>
    </div>
  );
}

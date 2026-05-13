"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from "@/lib/leads";
import type { LeadSource, LeadStatus } from "@/lib/mock";

export type LeadsFilterState = {
  search: string;
  status: LeadStatus | "all";
  source: LeadSource | "all";
  view: "all" | "hot" | "never-contacted" | "imported-today";
};

const VIEWS: { value: LeadsFilterState["view"]; label: string }[] = [
  { value: "all", label: "All leads" },
  { value: "hot", label: "Hot (score > 80)" },
  { value: "never-contacted", label: "Never contacted" },
  { value: "imported-today", label: "Imported today" },
];

export function LeadsFilters({
  state,
  onChange,
  onReset,
  resultCount,
}: {
  state: LeadsFilterState;
  onChange: (next: LeadsFilterState) => void;
  onReset: () => void;
  resultCount: number;
}) {
  const set = <K extends keyof LeadsFilterState>(
    key: K,
    value: LeadsFilterState[K],
  ) => onChange({ ...state, [key]: value });

  const hasActiveFilter =
    state.search !== "" ||
    state.status !== "all" ||
    state.source !== "all" ||
    state.view !== "all";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {VIEWS.map((view) => {
        const active = state.view === view.value;
        return (
          <button
            key={view.value}
            type="button"
            onClick={() => set("view", view.value)}
            className={
              "h-8 rounded-md px-2.5 text-xs font-medium transition-colors " +
              (active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
            }
          >
            {view.label}
          </button>
        );
      })}

      <span className="mx-1 h-4 w-px bg-border" aria-hidden />

      <Select value={state.status} onValueChange={(v) => set("status", v as LeadStatus | "all")}>
        <SelectTrigger size="sm" className="h-8 w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {LEAD_STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.source} onValueChange={(v) => set("source", v as LeadSource | "all")}>
        <SelectTrigger size="sm" className="h-8 w-[150px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {LEAD_SOURCE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilter ? (
        <Button variant="ghost" size="xs" onClick={onReset} className="h-8 px-2 text-muted-foreground">
          <XIcon className="size-3.5" /> Reset
        </Button>
      ) : null}

      <span className="ml-auto text-[11px] font-mono tabular-nums text-muted-foreground">
        {resultCount.toLocaleString()} leads
      </span>
    </div>
  );
}

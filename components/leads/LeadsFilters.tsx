"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={state.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search name, company, email or phone"
            className="pl-8"
          />
        </div>

        <Select value={state.status} onValueChange={(v) => set("status", v as LeadStatus | "all")}>
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {LEAD_SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={onReset}>
          <XIcon className="size-3.5" /> Reset
        </Button>

        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {resultCount.toLocaleString()} leads
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {VIEWS.map((view) => {
          const active = state.view === view.value;
          return (
            <button
              key={view.value}
              type="button"
              onClick={() => set("view", view.value)}
              className={
                "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                (active
                  ? "border-foreground/30 bg-foreground/5 font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted")
              }
            >
              {view.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

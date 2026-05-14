"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns";
import { UsersIcon } from "lucide-react";
import type { Lead } from "@/lib/mock";
import { leadStatusLabel, leadStatusVariant } from "@/lib/leads";
import { LeadScoreBar } from "./LeadScoreBar";

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function LeadsTable({
  leads,
  isLoading,
  selectedId,
  selectedIds,
  onSelect,
  onToggle,
  onToggleAll,
  campaignNames,
}: {
  leads: Lead[];
  isLoading: boolean;
  selectedId: string | null;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  campaignNames: Map<string, string>;
}) {
  if (isLoading) return <TableSkeleton />;
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="size-5" />}
        title="No leads match these filters"
        description="Try clearing the search box or filters."
      />
    );
  }

  const allChecked =
    leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(c) => onToggleAll(c === true)}
              />
            </TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Last touched</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const checked = selectedIds.has(lead.id);
            const campaign = lead.campaignId
              ? campaignNames.get(lead.campaignId)
              : null;
            return (
              <TableRow
                key={lead.id}
                data-selected={lead.id === selectedId || undefined}
                className="cursor-pointer data-[selected=true]:bg-muted/60"
                onClick={() => onSelect(lead.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => onToggle(lead.id, c === true)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{lead.fullName}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{lead.company}</div>
                    {lead.title ? (
                      <div className="text-xs text-muted-foreground">{lead.title}</div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {lead.phone}
                </TableCell>
                <TableCell>
                  <Badge variant={leadStatusVariant(lead.status)}>
                    {leadStatusLabel(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {lead.source}
                </TableCell>
                <TableCell className="text-sm">
                  {campaign ? (
                    <span className="text-muted-foreground">{campaign}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <LeadScoreBar score={lead.score} />
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {lead.lastTouchedAt
                    ? format(new Date(lead.lastTouchedAt), "MMM d, HH:mm")
                    : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

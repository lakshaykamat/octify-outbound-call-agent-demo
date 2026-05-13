"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { UploadIcon, Trash2Icon, BanIcon, FolderInputIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/patterns";
import { LeadsFilters, type LeadsFilterState } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { ErrorCard } from "@/components/ErrorCard";
import {
  useLeads,
  useCampaigns,
  useBulkUpdateLeads,
  useDeleteLeads,
} from "@/hooks/queries";
import type { LeadsQuery } from "@/lib/mock";

const PAGE_SIZE = 50;

const INITIAL_FILTERS: LeadsFilterState = {
  search: "",
  status: "all",
  source: "all",
  view: "all",
};

function buildQuery(filters: LeadsFilterState, page: number): LeadsQuery {
  const base: LeadsQuery = {
    search: filters.search || undefined,
    status: filters.status,
    source: filters.source,
    page,
    limit: PAGE_SIZE,
  };
  if (filters.view === "hot") base.scoreMin = 81;
  return base;
}

export default function LeadsPage() {
  const [filters, setFilters] = useState<LeadsFilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCampaign, setBulkCampaign] = useState<string>("");

  const query = buildQuery(filters, page);
  const leadsQuery = useLeads(query);
  const campaignsQuery = useCampaigns();
  const bulkUpdate = useBulkUpdateLeads();
  const bulkDelete = useDeleteLeads();

  const total = leadsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  let leads = leadsQuery.data?.items ?? [];

  // Client-side view refinements not expressible in handler query
  if (filters.view === "never-contacted") {
    leads = leads.filter((l) => !l.lastTouchedAt);
  } else if (filters.view === "imported-today") {
    const dayAgo = Date.now() - 24 * 3600_000;
    leads = leads.filter(
      (l) => l.source === "CSV import" && new Date(l.createdAt).getTime() > dayAgo,
    );
  }

  const campaignNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of campaignsQuery.data ?? []) map.set(c.id, c.name);
    return map;
  }, [campaignsQuery.data]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const lead of leads) {
        if (checked) next.add(lead.id);
        else next.delete(lead.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const assignToCampaign = async () => {
    if (!bulkCampaign || selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({
      ids: Array.from(selectedIds),
      patch: { campaignId: bulkCampaign },
    });
    toast.success(`Assigned ${selectedIds.size} leads to campaign`);
    clearSelection();
  };

  const markDnc = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({
      ids: Array.from(selectedIds),
      patch: { status: "dnc" },
    });
    toast.success(`Marked ${selectedIds.size} leads as DNC`);
    clearSelection();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    await bulkDelete.mutateAsync(Array.from(selectedIds));
    toast.success(`Deleted ${selectedIds.size} leads`);
    clearSelection();
  };

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description={`${total.toLocaleString()} leads in CRM.`}
        actions={
          <Button render={<Link href="/leads/import" />}>
            <UploadIcon className="size-4" /> Import leads
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <LeadsFilters
          state={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
            clearSelection();
          }}
          onReset={() => {
            setFilters(INITIAL_FILTERS);
            setPage(1);
            clearSelection();
          }}
          resultCount={total}
        />

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-2 pl-3">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <span className="mx-2 h-4 w-px bg-border" />
            <Select value={bulkCampaign} onValueChange={(v) => setBulkCampaign(v ?? "")}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Assign to campaign…" />
              </SelectTrigger>
              <SelectContent>
                {(campaignsQuery.data ?? [])
                  .filter((c) => c.status !== "completed")
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={assignToCampaign}
              disabled={!bulkCampaign || bulkUpdate.isPending}
            >
              <FolderInputIcon className="size-3.5" /> Assign
            </Button>
            <Button size="sm" variant="outline" onClick={markDnc} disabled={bulkUpdate.isPending}>
              <BanIcon className="size-3.5" /> Mark DNC
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={deleteSelected}
              disabled={bulkDelete.isPending}
              className="text-rose-600 hover:text-rose-600"
            >
              <Trash2Icon className="size-3.5" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} className="ml-auto">
              Clear
            </Button>
          </div>
        )}

        {leadsQuery.isError ? (
          <ErrorCard
            message="Couldn't load leads."
            detail={leadsQuery.error instanceof Error ? leadsQuery.error.message : undefined}
          />
        ) : (
          <LeadsTable
            leads={leads}
            isLoading={leadsQuery.isLoading}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={setSelectedId}
            onToggle={handleToggle}
            onToggleAll={handleToggleAll}
            campaignNames={campaignNames}
          />
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 lg:px-6">
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {pageCount} · {total.toLocaleString()} leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={leadsQuery.isFetching || page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(pageCount, page + 1))}
              disabled={leadsQuery.isFetching || page >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LeadDrawer
        leadId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

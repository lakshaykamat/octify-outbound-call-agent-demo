"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, Building2, Check, ChevronDown, MessageSquareText,
  RefreshCw, Search, Server, User, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBulkUpdateInbox, useInbox, useMembers, useUpdateInboxItem,
} from "@/hooks/queries";
import type { InboxItem, InboxItemKind, InboxItemStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";

type KindMeta = {
  label: string;
  icon: typeof Server;
  rail: string;
  iconTone: string;
};

const KIND_META: Record<InboxItemKind, KindMeta> = {
  hot_reply: {
    label: "Hot reply",
    icon: MessageSquareText,
    rail: "bg-emerald-500/80",
    iconTone: "text-emerald-400",
  },
  crm_sync_failed: {
    label: "CRM sync",
    icon: Server,
    rail: "bg-amber-500/80",
    iconTone: "text-amber-400",
  },
  agent_error: {
    label: "Agent error",
    icon: AlertTriangle,
    rail: "bg-rose-500/80",
    iconTone: "text-rose-400",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

function initialsOf(email: string | null): string {
  if (!email) return "";
  const local = email.split("@")[0];
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string; count?: number }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border bg-card p-0.5">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition",
              active
                ? "bg-muted text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {typeof o.count === "number" && o.count > 0 ? (
              <span
                className={cn(
                  "rounded-sm px-1 font-mono text-[10px] tabular-nums",
                  active ? "bg-background/70 text-foreground" : "bg-muted/50 text-muted-foreground",
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AssigneePicker({
  item,
  members,
  onAssign,
}: {
  item: InboxItem;
  members: { _id: string; email: string }[];
  onAssign: (email: string | null) => void;
}) {
  const initials = initialsOf(item.assigneeEmail);
  return (
    <label className="group/assign relative inline-flex shrink-0 cursor-pointer items-center">
      <span
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-tight transition",
          item.assigneeEmail
            ? "border-transparent bg-primary/15 text-primary"
            : "border-dashed border-muted-foreground/40 text-muted-foreground group-hover/assign:border-muted-foreground/70 group-hover/assign:text-foreground",
        )}
        title={item.assigneeEmail ?? "Unassigned"}
      >
        {initials || "+"}
      </span>
      <ChevronDown className="ml-0.5 size-3 text-muted-foreground opacity-0 transition-opacity group-hover/assign:opacity-100" />
      <select
        value={item.assigneeEmail ?? ""}
        onChange={(e) => onAssign(e.target.value || null)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Assign"
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m._id} value={m.email}>
            {m.email}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InboxList() {
  const [kind, setKind] = useState<InboxItemKind | "all">("all");
  const [status, setStatus] = useState<InboxItemStatus | "all">("unread");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const items = useInbox({ kind, status });
  const members = useMembers();
  const updateOne = useUpdateInboxItem();
  const bulk = useBulkUpdateInbox();

  const memberList = members.data?.members ?? [];
  const list = useMemo(() => {
    const raw = items.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((it) => {
      const hay = [
        it.title,
        it.summary,
        it.meta.leadName,
        it.meta.company,
        it.meta.callId,
        it.meta.error,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items.data, query]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === list.length) setSelected(new Set());
    else setSelected(new Set(list.map((i) => i.id)));
  }
  async function bulkResolve() {
    if (selected.size === 0) return;
    await bulk.mutateAsync({ ids: Array.from(selected), patch: { status: "resolved" } });
    toast.success(`Resolved ${selected.size}`);
    setSelected(new Set());
  }
  async function bulkMarkRead() {
    if (selected.size === 0) return;
    await bulk.mutateAsync({ ids: Array.from(selected), patch: { status: "read" } });
    toast.success(`Marked ${selected.size} read`);
    setSelected(new Set());
  }
  async function assignTo(item: InboxItem, email: string | null) {
    await updateOne.mutateAsync({
      id: item.id,
      patch: { assigneeEmail: email, status: item.status === "unread" ? "read" : item.status },
    });
    toast.success(email ? `Assigned to ${email}` : "Unassigned");
  }
  async function resolve(item: InboxItem) {
    await updateOne.mutateAsync({ id: item.id, patch: { status: "resolved" } });
    toast.success("Resolved");
  }
  async function reopen(item: InboxItem) {
    await updateOne.mutateAsync({ id: item.id, patch: { status: "unread" } });
  }

  const allSelected = list.length > 0 && selected.size === list.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar — lives above the list card */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            options={[
              { key: "all", label: "All" },
              { key: "hot_reply", label: "Hot replies" },
              { key: "crm_sync_failed", label: "CRM sync" },
              { key: "agent_error", label: "Agent errors" },
            ]}
            value={kind}
            onChange={setKind}
          />
          <span className="h-4 w-px bg-border" aria-hidden />
          <Segmented
            options={[
              { key: "unread", label: "Unread" },
              { key: "read", label: "Read" },
              { key: "resolved", label: "Resolved" },
              { key: "all", label: "All" },
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 ? (
            <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-xs">
              <span className="font-mono tabular-nums">{selected.size} selected</span>
              <span className="h-3 w-px bg-border" aria-hidden />
              <Button variant="ghost" size="xs" onClick={bulkMarkRead} disabled={bulk.isPending}>
                Mark read
              </Button>
              <Button size="xs" onClick={bulkResolve} disabled={bulk.isPending}>
                <Check className="size-3" />
                Resolve
              </Button>
            </div>
          ) : null}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, lead, company, error…"
              className="h-8 w-full rounded-md border bg-card pl-7 pr-7 text-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Select-all strip */}
        {list.length > 0 ? (
          <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              className="size-3.5 rounded border-input"
              aria-label="Select all"
            />
            <span className="font-mono">
              {list.length} {list.length === 1 ? "item" : "items"}
            </span>
          </div>
        ) : null}

        {/* List */}
        {items.isLoading ? (
          <div className="flex flex-col divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="size-7 rounded-full" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="p-8">
            <EmptyState title="All caught up" description="Nothing waiting on a human right now." />
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {list.map((item) => {
              const meta = KIND_META[item.kind];
              const KindIcon = meta.icon;
              const isSelected = selected.has(item.id);
              const isUnread = item.status === "unread";
              const isResolved = item.status === "resolved";

              return (
                <li
                  key={item.id}
                  className={cn(
                    "group relative flex items-center gap-3 pl-4 pr-3 py-2.5 transition-colors",
                    isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/30",
                    isResolved && "opacity-65",
                  )}
                >
                  {/* Type rail */}
                  <span
                    aria-hidden
                    className={cn("absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-sm", meta.rail)}
                  />

                  {/* Checkbox — visible on hover or when selected */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(item.id)}
                    className={cn(
                      "size-3.5 shrink-0 rounded border-input transition-opacity",
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    )}
                    aria-label={`Select ${item.title}`}
                  />

                  {/* Kind icon */}
                  <KindIcon
                    className={cn("size-3.5 shrink-0", meta.iconTone)}
                    aria-label={meta.label}
                  />

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                        — {item.summary}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono uppercase tracking-wider opacity-70">
                        {meta.label}
                      </span>
                      {item.meta.leadName ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="size-3 opacity-60" />
                          {item.meta.leadName}
                        </span>
                      ) : null}
                      {item.meta.company ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3 opacity-60" />
                          {item.meta.company}
                        </span>
                      ) : null}
                      {item.meta.callId ? (
                        <span className="font-mono opacity-70">{item.meta.callId}</span>
                      ) : null}
                      {item.meta.error ? (
                        <span className="font-mono text-rose-400/90">{item.meta.error}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Right cluster */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Hover actions */}
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      {isResolved ? (
                        <Button variant="ghost" size="xs" onClick={() => reopen(item)}>
                          <RefreshCw className="size-3" />
                          Reopen
                        </Button>
                      ) : (
                        <Button variant="ghost" size="xs" onClick={() => resolve(item)}>
                          <Check className="size-3" />
                          Resolve
                        </Button>
                      )}
                    </div>

                    {/* Time */}
                    <span className="w-9 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                      {timeAgo(item.createdAt)}
                    </span>

                    {/* Assignee */}
                    <AssigneePicker
                      item={item}
                      members={memberList}
                      onAssign={(email) => assignTo(item, email)}
                    />
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

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, Building2, Check, MessageSquareText, RefreshCw, Server, User,
} from "lucide-react";
import { SectionCard, EmptyState } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBulkUpdateInbox, useInbox, useMembers, useUpdateInboxItem,
} from "@/hooks/queries";
import type { InboxItem, InboxItemKind, InboxItemStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<InboxItemKind, { label: string; icon: typeof Server; tone: string }> = {
  hot_reply:        { label: "Hot reply",       icon: MessageSquareText, tone: "border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300" },
  crm_sync_failed:  { label: "CRM sync failed", icon: Server,             tone: "border-amber-500/40 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300" },
  agent_error:      { label: "Agent error",     icon: AlertTriangle,      tone: "border-rose-500/40 bg-rose-500/[0.07] text-rose-700 dark:text-rose-300" },
};

const STATUS_LABEL: Record<InboxItemStatus, string> = {
  unread:   "Unread",
  read:     "Read",
  resolved: "Resolved",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function KindChip({ kind }: { kind: InboxItemKind }) {
  const k = KIND_LABEL[kind];
  const Icon = k.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]", k.tone)}>
      <Icon className="size-3" />
      {k.label}
    </span>
  );
}

function FilterChips<T extends string>({
  options, value, onChange,
}: { options: Array<{ key: T; label: string; count?: number }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition",
            value === o.key
              ? "border-primary bg-primary/10 text-foreground"
              : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          {o.label}
          {typeof o.count === "number" ? (
            <span className="ml-1.5 font-mono tabular-nums opacity-60">{o.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function InboxList() {
  const [kind, setKind] = useState<InboxItemKind | "all">("all");
  const [status, setStatus] = useState<InboxItemStatus | "all">("unread");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const items = useInbox({ kind, status });
  const members = useMembers();
  const updateOne = useUpdateInboxItem();
  const bulk = useBulkUpdateInbox();

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!items.data) return;
    if (selected.size === items.data.length) setSelected(new Set());
    else setSelected(new Set(items.data.map((i) => i.id)));
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

  return (
    <SectionCard
      title="Inbox"
      description="What needs a human. Hot replies, failed CRM writebacks, and agent errors land here."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <FilterChips
              options={[
                { key: "all", label: "All" },
                { key: "hot_reply", label: "Hot replies" },
                { key: "crm_sync_failed", label: "CRM sync" },
                { key: "agent_error", label: "Agent errors" },
              ]}
              value={kind}
              onChange={setKind}
            />
            <span className="text-xs text-muted-foreground">·</span>
            <FilterChips
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
          {selected.size > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs">
              <span className="font-medium">{selected.size} selected</span>
              <Button variant="ghost" size="sm" onClick={bulkMarkRead} disabled={bulk.isPending}>
                Mark read
              </Button>
              <Button size="sm" onClick={bulkResolve} disabled={bulk.isPending}>
                <Check className="size-3.5" />
                Resolve
              </Button>
            </div>
          ) : null}
        </div>

        {items.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (items.data ?? []).length === 0 ? (
          <EmptyState
            title="All caught up"
            description="Nothing waiting on a human right now."
          />
        ) : (
          <>
            <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={!!items.data && selected.size === items.data.length}
                onChange={toggleAll}
                className="size-3.5 rounded border-input"
              />
              Select all
            </label>
            <ul className="flex flex-col gap-2">
              {(items.data ?? []).map((item) => {
                const isSelected = selected.has(item.id);
                const isUnread = item.status === "unread";
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "group grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border bg-card px-3 py-3 transition",
                      isSelected && "ring-1 ring-primary/40",
                      isUnread && "border-l-2 border-l-primary",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(item.id)}
                      className="mt-1 size-3.5 rounded border-input"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <KindChip kind={item.kind} />
                        <span className="text-[11px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
                        {item.status !== "unread" ? (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {STATUS_LABEL[item.status]}
                          </Badge>
                        ) : null}
                      </div>
                      <div className={cn("mt-1 text-sm", isUnread ? "font-semibold" : "font-medium")}>
                        {item.title}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {item.meta.leadName ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3" /> {item.meta.leadName}
                          </span>
                        ) : null}
                        {item.meta.company ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="size-3" /> {item.meta.company}
                          </span>
                        ) : null}
                        {item.meta.callId ? (
                          <span className="font-mono">{item.meta.callId}</span>
                        ) : null}
                        {item.meta.error ? (
                          <span className="font-mono text-rose-500/80">{item.meta.error}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <select
                        value={item.assigneeEmail ?? ""}
                        onChange={(e) => assignTo(item, e.target.value || null)}
                        className="rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <option value="">Unassigned</option>
                        {(members.data?.members ?? []).map((m) => (
                          <option key={m._id} value={m.email}>{m.email}</option>
                        ))}
                      </select>
                      {item.status === "resolved" ? (
                        <Button variant="ghost" size="sm" onClick={() => reopen(item)}>
                          <RefreshCw className="size-3.5" />
                          Reopen
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => resolve(item)}>
                          <Check className="size-3.5" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </SectionCard>
  );
}

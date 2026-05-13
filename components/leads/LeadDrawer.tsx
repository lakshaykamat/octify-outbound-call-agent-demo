"use client";

import { format } from "date-fns";
import { XIcon, Building2Icon, MapPinIcon, MailIcon, PhoneIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Timeline, type TimelineItem } from "@/components/patterns";
import { LeadScoreBar } from "./LeadScoreBar";
import { leadStatusLabel, leadStatusVariant } from "@/lib/leads";
import { useLead } from "@/hooks/queries";
import type { Lead } from "@/lib/mock";

function CloseButton() {
  return (
    <DrawerClose
      aria-label="Close"
      className="-mr-1.5 -mt-1.5 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <XIcon className="size-4" />
    </DrawerClose>
  );
}

function MetaRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ProfileTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Contact
        </h3>
        <div className="space-y-2">
          <MetaRow icon={<MailIcon className="size-3.5" />} value={lead.email} />
          <MetaRow icon={<PhoneIcon className="size-3.5" />} value={lead.phone} />
          <MetaRow icon={<Building2Icon className="size-3.5" />} value={`${lead.company} · ${lead.title || "—"}`} />
          <MetaRow icon={<MapPinIcon className="size-3.5" />} value={`${lead.city || "—"}${lead.region ? ", " + lead.region : ""}`} />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Qualification
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Industry</span>
            <span>{lead.industry || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Score</span>
            <LeadScoreBar score={lead.score} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source</span>
            <span>{lead.source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="tabular-nums">
              {format(new Date(lead.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ lead }: { lead: Lead }) {
  const items: TimelineItem[] = [];
  items.push({
    id: "created",
    title: "Lead created",
    description: `Imported from ${lead.source}`,
    meta: format(new Date(lead.createdAt), "MMM d, HH:mm"),
  });
  if (lead.lastTouchedAt) {
    items.push({
      id: "last",
      title: "Last call placed",
      description: `Status: ${leadStatusLabel(lead.status)}`,
      meta: format(new Date(lead.lastTouchedAt), "MMM d, HH:mm"),
    });
  }
  if (lead.status === "completed") {
    items.push({
      id: "synced",
      title: "Synced to CRM",
      description: "HubSpot · contact updated",
      meta: lead.lastTouchedAt
        ? format(new Date(lead.lastTouchedAt), "MMM d, HH:mm")
        : "",
    });
  }
  return (
    <div className="p-4">
      <Timeline items={items} />
    </div>
  );
}

function NotesTab({ lead }: { lead: Lead }) {
  return (
    <div className="p-4">
      <div className="rounded-lg border bg-card p-4 text-sm">
        {lead.notes ? (
          <p>{lead.notes}</p>
        ) : (
          <p className="text-muted-foreground">No notes yet.</p>
        )}
      </div>
    </div>
  );
}

function RawTab({ lead }: { lead: Lead }) {
  return (
    <pre className="m-4 max-h-[60vh] overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[11px]">
      {JSON.stringify(lead, null, 2)}
    </pre>
  );
}

export function LeadDrawer({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: lead, isLoading } = useLead(leadId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full flex-col data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:w-[40vw] data-[vaul-drawer-direction=right]:sm:max-w-none">
        {lead ? (
          <>
            <DrawerHeader className="gap-3 border-b p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Lead
                </span>
                <CloseButton />
              </div>
              <div className="space-y-1">
                <DrawerTitle className="text-2xl font-semibold tracking-tight">
                  {lead.fullName}
                </DrawerTitle>
                <DrawerDescription className="text-sm">
                  {lead.title ? `${lead.title} · ` : ""}{lead.company}
                </DrawerDescription>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge variant={leadStatusVariant(lead.status)}>
                  {leadStatusLabel(lead.status)}
                </Badge>
                <Badge variant="outline">{lead.source}</Badge>
                <span className="ml-1 text-xs text-muted-foreground">Score</span>
                <LeadScoreBar score={lead.score} />
              </div>
            </DrawerHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="profile" className="gap-0">
                <div className="border-b px-4 pt-3">
                  <TabsList variant="line">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="profile"><ProfileTab lead={lead} /></TabsContent>
                <TabsContent value="activity"><ActivityTab lead={lead} /></TabsContent>
                <TabsContent value="notes"><NotesTab lead={lead} /></TabsContent>
                <TabsContent value="raw"><RawTab lead={lead} /></TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <>
            <DrawerHeader className="gap-3 border-b p-6">
              <div className="flex items-start justify-between gap-3">
                <DrawerTitle>{isLoading ? "Loading…" : "Lead"}</DrawerTitle>
                <CloseButton />
              </div>
              <DrawerDescription>&nbsp;</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 p-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

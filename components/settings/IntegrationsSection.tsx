"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

type Integration = {
  id: string;
  name: string;
  category: "CRM" | "Calendar" | "Messaging" | "Data";
  description: string;
  icon: string;
  connected: boolean;
};

const SEED: Integration[] = [
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Bi-directional contact and deal sync.", icon: "HS", connected: true },
  { id: "salesforce", name: "Salesforce", category: "CRM", description: "Write call activity to Salesforce.", icon: "SF", connected: false },
  { id: "pipedrive", name: "Pipedrive", category: "CRM", description: "Sync leads and pipeline stages.", icon: "PD", connected: false },
  { id: "google-cal", name: "Google Calendar", category: "Calendar", description: "Book meetings on agents' calendars.", icon: "GC", connected: true },
  { id: "outlook", name: "Outlook", category: "Calendar", description: "Microsoft 365 calendar booking.", icon: "MS", connected: false },
  { id: "slack", name: "Slack", category: "Messaging", description: "Hot replies and incidents post here.", icon: "SL", connected: true },
  { id: "apollo", name: "Apollo", category: "Data", description: "Enrich missing company and title.", icon: "AP", connected: false },
  { id: "zoominfo", name: "ZoomInfo", category: "Data", description: "Account-level enrichment.", icon: "ZI", connected: false },
];

export function IntegrationsSection() {
  const [items, setItems] = useState<Integration[]>(SEED);
  const [pending, setPending] = useState<string | null>(null);

  function toggle(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    if (it.connected) {
      setItems((arr) => arr.map((x) => (x.id === id ? { ...x, connected: false } : x)));
      toast.message(`${it.name} disconnected`);
      return;
    }
    setPending(id);
    setTimeout(() => {
      setItems((arr) => arr.map((x) => (x.id === id ? { ...x, connected: true } : x)));
      setPending(null);
      toast.success(`${it.name} connected`);
    }, 900);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect Xylo to the rest of your sales stack.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const isPending = pending === it.id;
            return (
              <div
                key={it.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted font-mono text-xs font-medium">
                    {it.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      {it.connected && <Check className="size-3.5 text-emerald-500" />}
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{it.category}</p>
                  </div>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{it.description}</p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  {it.connected ? (
                    <Badge variant="secondary">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not connected</Badge>
                  )}
                  <Button
                    size="sm"
                    variant={it.connected ? "outline" : "default"}
                    onClick={() => toggle(it.id)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {it.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

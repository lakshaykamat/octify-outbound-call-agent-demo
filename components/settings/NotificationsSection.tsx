"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Channel = "email" | "slack" | "inApp";
type Row = { id: string; label: string; description: string; defaults: Record<Channel, boolean> };

const ROWS: Row[] = [
  { id: "hot_reply", label: "Hot reply received", description: "Lead replied to a post-call email or SMS.", defaults: { email: true, slack: true, inApp: true } },
  { id: "meeting_booked", label: "Meeting booked", description: "Agent confirmed a meeting on calendar.", defaults: { email: true, slack: true, inApp: true } },
  { id: "campaign_finished", label: "Campaign finished", description: "Audience exhausted or end date reached.", defaults: { email: true, slack: false, inApp: true } },
  { id: "crm_sync_failed", label: "CRM sync failed", description: "Writeback to HubSpot/Salesforce errored.", defaults: { email: true, slack: true, inApp: true } },
  { id: "agent_error", label: "Agent error mid-call", description: "Agent paused or fell back to fallback script.", defaults: { email: false, slack: true, inApp: true } },
  { id: "daily_digest", label: "Daily digest", description: "Yesterday's KPIs in your inbox at 8am.", defaults: { email: true, slack: false, inApp: false } },
  { id: "weekly_report", label: "Weekly report", description: "Monday performance summary.", defaults: { email: true, slack: false, inApp: false } },
];

export function NotificationsSection() {
  const [state, setState] = useState<Record<string, Record<Channel, boolean>>>(() =>
    Object.fromEntries(ROWS.map((r) => [r.id, { ...r.defaults }])),
  );

  function toggle(rowId: string, channel: Channel) {
    setState((s) => ({ ...s, [rowId]: { ...s[rowId], [channel]: !s[rowId][channel] } }));
    toast.message("Notification preference saved", { duration: 1200 });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what we ping you about and where.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-6 py-3 text-left">Event</th>
                <th className="w-24 px-3 py-3 text-center">Email</th>
                <th className="w-24 px-3 py-3 text-center">Slack</th>
                <th className="w-24 px-3 py-3 text-center">In-app</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="font-medium">{r.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{r.description}</div>
                  </td>
                  {(["email", "slack", "inApp"] as Channel[]).map((ch) => (
                    <td key={ch} className="px-3 py-4 text-center">
                      <Checkbox
                        checked={state[r.id][ch]}
                        onCheckedChange={() => toggle(r.id, ch)}
                        aria-label={`${r.label} · ${ch}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

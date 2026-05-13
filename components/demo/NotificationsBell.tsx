"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";

type Notif = {
  id: string;
  kind: "hot-reply" | "meeting" | "crm" | "campaign";
  title: string;
  body: string;
  at: string;
  read: boolean;
};

const SEED: Notif[] = [
  { id: "n1", kind: "hot-reply", title: "Hot reply · Renata Vargas", body: "Asked for an annual quote on the Scale plan.", at: "12m", read: false },
  { id: "n2", kind: "meeting", title: "Meeting booked · Marcus Lee", body: "Driftwood Auto · Tue 2pm.", at: "42m", read: false },
  { id: "n3", kind: "crm", title: "HubSpot writeback failed", body: "3 calls queued for retry.", at: "1h", read: false },
  { id: "n4", kind: "campaign", title: "Campaign launched", body: "Q2 SDR Outbound · 1,240 leads.", at: "3h", read: true },
];

const DOT: Record<Notif["kind"], string> = {
  "hot-reply": "bg-emerald-500",
  meeting: "bg-blue-500",
  crm: "bg-amber-500",
  campaign: "bg-violet-500",
};

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>(SEED);
  const unread = items.filter((i) => !i.read).length;

  // Trickle a fabricated notification every ~45s while open.
  useEffect(() => {
    const t = setInterval(() => {
      setItems((arr) => {
        if (arr.length > 24) return arr;
        const pool: Notif[] = [
          { id: `n_${Date.now()}`, kind: "hot-reply", title: "Hot reply · Priya Shah", body: "Wants pricing for 25 seats.", at: "now", read: false },
          { id: `n_${Date.now()}`, kind: "meeting", title: "Meeting booked · Hugo Martin", body: "Velocita · Wed 11am.", at: "now", read: false },
        ];
        const next = pool[Math.floor(Math.random() * pool.length)];
        return [next, ...arr];
      });
    }, 45_000);
    return () => clearInterval(t);
  }, []);

  function markAll() {
    setItems((arr) => arr.map((i) => ({ ...i, read: true })));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive font-mono text-[9px] font-medium text-destructive-foreground">
                {unread}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <div>
            <div className="text-sm font-medium">Notifications</div>
            <div className="text-[11px] text-muted-foreground">
              {unread === 0 ? "All caught up" : `${unread} unread`}
            </div>
          </div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={markAll}>
              <Check className="size-3" /> Mark all read
            </Button>
          )}
        </div>
        <ul className="max-h-[340px] overflow-y-auto">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 border-b px-3 py-2.5 last:border-b-0 ${
                n.read ? "" : "bg-muted/40"
              }`}
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT[n.kind]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{n.at}</span>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

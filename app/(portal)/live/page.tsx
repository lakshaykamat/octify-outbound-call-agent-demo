"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, StatTile } from "@/components/patterns";
import { LiveMap, type LivePing } from "@/components/live/LiveMap";
import { LiveFeed, type LiveEvent } from "@/components/live/LiveFeed";
import { LiveCallDrawer } from "@/components/live/LiveCallDrawer";
import {
  PhoneCallIcon,
  CalendarCheck2Icon,
  ClockIcon,
  ActivityIcon,
} from "lucide-react";
import { useLeads } from "@/hooks/queries";

const REGIONS: Array<{ code: string; x: number; y: number; label: string }> = [
  { code: "LA", x: 0.18, y: 0.66, label: "Los Angeles, CA" },
  { code: "SD", x: 0.2, y: 0.74, label: "San Diego, CA" },
  { code: "SF", x: 0.12, y: 0.5, label: "San Francisco, CA" },
  { code: "SEA", x: 0.18, y: 0.28, label: "Seattle, WA" },
  { code: "DEN", x: 0.42, y: 0.52, label: "Denver, CO" },
  { code: "AUS", x: 0.55, y: 0.78, label: "Austin, TX" },
  { code: "DAL", x: 0.55, y: 0.7, label: "Dallas, TX" },
  { code: "CHI", x: 0.66, y: 0.42, label: "Chicago, IL" },
  { code: "NYC", x: 0.86, y: 0.36, label: "New York, NY" },
  { code: "BOS", x: 0.9, y: 0.3, label: "Boston, MA" },
  { code: "ATL", x: 0.76, y: 0.62, label: "Atlanta, GA" },
  { code: "MIA", x: 0.82, y: 0.82, label: "Miami, FL" },
];

const OUTCOME_WEIGHTS: Array<[LiveEvent["outcome"], number]> = [
  ["connected", 28],
  ["voicemail", 38],
  ["no-answer", 22],
  ["booked", 6],
];

function pickOutcome(): LiveEvent["outcome"] {
  const total = OUTCOME_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [o, w] of OUTCOME_WEIGHTS) {
    r -= w;
    if (r <= 0) return o;
  }
  return "no-answer";
}

export default function LivePage() {
  const leadsQuery = useLeads({ limit: 200 });
  const leads = leadsQuery.data?.items ?? [];

  const [feed, setFeed] = useState<LiveEvent[]>([]);
  const [pings, setPings] = useState<LivePing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [callsInFlight, setCallsInFlight] = useState(7);
  const [callsToday, setCallsToday] = useState(412);
  const [meetingsToday, setMeetingsToday] = useState(23);
  const seedRef = useRef(0);

  // Generate events at a believable cadence (~one every 1.4s in demo time).
  useEffect(() => {
    if (leads.length === 0) return;
    const interval = setInterval(() => {
      const lead = leads[Math.floor(Math.random() * leads.length)];
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const outcome = pickOutcome();
      const ts = Date.now();
      seedRef.current++;
      const id = `live_${ts}_${seedRef.current}`;

      const event: LiveEvent = {
        id,
        prospectName: lead.fullName,
        company: lead.company,
        region: region.label,
        outcome,
        ts,
        durationSec:
          outcome === "booked"
            ? 240 + Math.floor(Math.random() * 60)
            : outcome === "connected"
              ? 45 + Math.floor(Math.random() * 60)
              : outcome === "voicemail"
                ? 18 + Math.floor(Math.random() * 12)
                : 8 + Math.floor(Math.random() * 8),
      };

      setFeed((prev) => [event, ...prev].slice(0, 30));
      setPings((prev) =>
        [
          ...prev.filter((p) => Date.now() - p.ts < 6000),
          {
            id,
            x: region.x + (Math.random() - 0.5) * 0.05,
            y: region.y + (Math.random() - 0.5) * 0.05,
            region: region.code,
            outcome,
            ts,
          },
        ].slice(-40),
      );

      setCallsToday((n) => n + 1);
      if (outcome === "booked") setMeetingsToday((n) => n + 1);
      setCallsInFlight(() => 5 + Math.floor(Math.random() * 6));
    }, 1400);
    return () => clearInterval(interval);
  }, [leads]);

  const selected = useMemo(
    () => feed.find((e) => e.id === selectedId) ?? null,
    [feed, selectedId],
  );

  const recentDur =
    feed.slice(0, 20).reduce((s, e) => s + (e.durationSec ?? 0), 0) /
    Math.max(1, Math.min(20, feed.length));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Live"
        description="Real-time view of every dial happening right now across your campaigns."
      />

      <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-6">
        <StatTile
          label="Calls in flight"
          icon={<ActivityIcon className="size-3.5" />}
          value={callsInFlight.toString()}
          hint="active dials right now"
        />
        <StatTile
          label="Calls today"
          icon={<PhoneCallIcon className="size-3.5" />}
          value={callsToday.toLocaleString()}
          hint="across all campaigns"
        />
        <StatTile
          label="Meetings today"
          icon={<CalendarCheck2Icon className="size-3.5" />}
          value={meetingsToday.toString()}
          hint="booked"
        />
        <StatTile
          label="Avg duration"
          icon={<ClockIcon className="size-3.5" />}
          value={`${Math.floor(recentDur / 60)}:${String(Math.floor(recentDur % 60)).padStart(2, "0")}`}
          hint="rolling 20 calls"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="lg:col-span-2">
          <LiveMap pings={pings} />
        </div>
        <div className="h-[480px]">
          <LiveFeed events={feed} onSelect={setSelectedId} />
        </div>
      </div>

      <LiveCallDrawer
        event={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

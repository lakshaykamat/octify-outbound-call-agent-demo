"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StatTile } from "@/components/patterns";
import { LiveMap, type LivePing } from "@/components/live/LiveMap";
import { LiveFeed, type LiveEvent } from "@/components/live/LiveFeed";
import { LiveCallDrawer } from "@/components/live/LiveCallDrawer";
import {
  PhoneCallIcon,
  CalendarCheck2Icon,
  ClockIcon,
  ActivityIcon,
} from "lucide-react";
import { useLeads, useLiveSnapshot } from "@/hooks/queries";

const REGIONS: Array<{ code: string; lng: number; lat: number; label: string }> = [
  { code: "LA",  lng: -118.24, lat: 34.05, label: "Los Angeles, CA" },
  { code: "SD",  lng: -117.16, lat: 32.72, label: "San Diego, CA" },
  { code: "SF",  lng: -122.42, lat: 37.77, label: "San Francisco, CA" },
  { code: "SEA", lng: -122.33, lat: 47.61, label: "Seattle, WA" },
  { code: "DEN", lng: -104.99, lat: 39.74, label: "Denver, CO" },
  { code: "AUS", lng:  -97.74, lat: 30.27, label: "Austin, TX" },
  { code: "DAL", lng:  -96.80, lat: 32.78, label: "Dallas, TX" },
  { code: "CHI", lng:  -87.65, lat: 41.88, label: "Chicago, IL" },
  { code: "NYC", lng:  -74.01, lat: 40.71, label: "New York, NY" },
  { code: "BOS", lng:  -71.06, lat: 42.36, label: "Boston, MA" },
  { code: "ATL", lng:  -84.39, lat: 33.75, label: "Atlanta, GA" },
  { code: "MIA", lng:  -80.19, lat: 25.76, label: "Miami, FL" },
  { code: "PHX", lng: -112.07, lat: 33.45, label: "Phoenix, AZ" },
  { code: "DC",  lng:  -77.04, lat: 38.91, label: "Washington, DC" },
  { code: "MSP", lng:  -93.27, lat: 44.98, label: "Minneapolis, MN" },
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
  const snapshot = useLiveSnapshot();

  const [feed, setFeed] = useState<LiveEvent[]>([]);
  const [pings, setPings] = useState<LivePing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [callsInFlight, setCallsInFlight] = useState(0);
  const [callsToday, setCallsToday] = useState(0);
  const [meetingsToday, setMeetingsToday] = useState(0);
  const [seedDurSec, setSeedDurSec] = useState(0);
  const seedRef = useRef(0);
  const seededRef = useRef(false);

  // Seed counters from the same store the dashboard reads so Live opens
  // mid-day, not at zero.
  useEffect(() => {
    if (seededRef.current) return;
    if (!snapshot.data) return;
    setCallsToday(snapshot.data.callsToday);
    setMeetingsToday(snapshot.data.meetingsToday);
    setCallsInFlight(snapshot.data.callsInFlight);
    setSeedDurSec(snapshot.data.avgDurationSec);
    seededRef.current = true;
  }, [snapshot.data]);

  // Generate events as a Poisson process so arrivals cluster and stretch
  // the way real outbound traffic does, no metronome, no uniform spacing.
  useEffect(() => {
    if (leads.length === 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
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
            // Small lng/lat jitter so repeat events on the same city
            // don't stack on the exact same pixel.
            lng: region.lng + (Math.random() - 0.5) * 0.6,
            lat: region.lat + (Math.random() - 0.5) * 0.4,
            region: region.code,
            outcome,
            ts,
          },
        ].slice(-40),
      );

      setCallsToday((n) => n + 1);
      if (outcome === "booked") setMeetingsToday((n) => n + 1);
      setCallsInFlight((n) => {
        // Random walk ±1 around a mean of 5, clamped to [2, 9]. Smooth drift
        // instead of a slot-machine reroll on every event.
        const drift = Math.random() < 0.5 ? -1 : 1;
        const next = n + drift;
        if (next < 2) return 2;
        if (next > 9) return 9;
        return next;
      });

      if (!cancelled) schedule();
    };

    const schedule = (firstTick = false) => {
      if (firstTick) {
        timer = setTimeout(tick, 250);
        return;
      }
      // Exponential inter-arrival time with mean 1.5s, keeps the feed
      // visibly active without losing the bursty arrival feel.
      const u = Math.random();
      const delayMs = Math.max(200, Math.min(6000, -Math.log(1 - u) * 1500));
      timer = setTimeout(tick, delayMs);
    };

    schedule(true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [leads]);

  const selected = useMemo(
    () => feed.find((e) => e.id === selectedId) ?? null,
    [feed, selectedId],
  );

  const recentDur =
    feed.length > 0
      ? feed.slice(0, 20).reduce((s, e) => s + (e.durationSec ?? 0), 0) /
        Math.min(20, feed.length)
      : seedDurSec;

  return (
    <>
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

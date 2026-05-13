"use client";

import {
  PhoneCallIcon,
  AlertCircleIcon,
  CalendarCheck2Icon,
  HandshakeIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { Timeline, type TimelineItem } from "@/components/patterns";
import { formatDuration } from "@/lib/format";
import type { XyloCall } from "@/lib/mock";

export function CallTimeline({ call }: { call: XyloCall }) {
  const items: TimelineItem[] = [];
  const dur = call.durationSec ?? 0;

  items.push({
    id: "greeting",
    icon: <PhoneCallIcon className="size-3" />,
    title: "Greeting & qualification",
    description: "Agent confirmed the prospect and stated the purpose of the call.",
    meta: "0:00",
  });

  if (dur > 30) {
    items.push({
      id: "discovery",
      icon: <MessageSquareTextIcon className="size-3" />,
      title: "Discovery questions",
      description: "Agent asked about current inventory aging and parts sourcing process.",
      meta: formatDuration(Math.round(dur * 0.25)),
    });
  }

  if (call.analysis?.objectionsRaised.length) {
    items.push({
      id: "objection",
      icon: <AlertCircleIcon className="size-3 text-amber-500" />,
      title: `Objection raised`,
      description: call.analysis.objectionsRaised[0],
      meta: formatDuration(Math.round(dur * 0.55)),
    });
  }

  if (dur > 90) {
    items.push({
      id: "pitch",
      icon: <HandshakeIcon className="size-3" />,
      title: "Value proposition",
      description: "Agent explained inventory monetization for aged SKUs.",
      meta: formatDuration(Math.round(dur * 0.7)),
    });
  }

  if (call.analysis?.outcome === "meeting_booked") {
    items.push({
      id: "booked",
      icon: <CalendarCheck2Icon className="size-3 text-emerald-500" />,
      title: "Meeting booked",
      description: call.analysis.followUpAction ?? "Demo scheduled.",
      meta: formatDuration(dur),
    });
  } else if (dur > 0) {
    items.push({
      id: "ended",
      icon: <PhoneCallIcon className="size-3" />,
      title: "Call ended",
      description: call.analysis?.summary?.slice(0, 80) ?? "",
      meta: formatDuration(dur),
    });
  }

  return <Timeline items={items} />;
}

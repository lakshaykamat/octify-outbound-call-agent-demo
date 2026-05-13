"use client";

import {
  PhoneCallIcon, PhoneIncomingIcon, CalendarCheckIcon, ClockIcon,
} from "lucide-react";

import { StatTile } from "@/components/patterns";
import { ErrorCard } from "@/components/ErrorCard";
import { useAnalytics } from "@/hooks/queries";
import { formatDuration } from "@/lib/format";
import type { Analytics } from "@/lib/api/types";

const numberFmt = new Intl.NumberFormat("en-US");
const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function answerRate(a: Analytics) {
  if (!a.totalCalls) return 0;
  return a.answered / a.totalCalls;
}

export function DashboardKpis() {
  const analytics = useAnalytics();

  if (analytics.isError) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Couldn't load analytics."
          detail={analytics.error instanceof Error ? analytics.error.message : undefined}
        />
      </div>
    );
  }

  const loading = analytics.isLoading || !analytics.data;

  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {loading ? (
        <>
          <StatTile label="Total calls" value="" loading />
          <StatTile label="Connect rate" value="" loading />
          <StatTile label="Meetings booked" value="" loading />
          <StatTile label="Avg duration" value="" loading />
        </>
      ) : (
        <>
          <StatTile
            label="Total calls"
            value={numberFmt.format(analytics.data!.totalCalls)}
            hint={`${numberFmt.format(analytics.data!.answered)} connected`}
            icon={<PhoneCallIcon className="size-4" />}
            delta={{ value: 6.4, suffix: "%" }}
          />
          <StatTile
            label="Connect rate"
            value={pctFmt.format(answerRate(analytics.data!))}
            hint={`${numberFmt.format(analytics.data!.answered)} of ${numberFmt.format(analytics.data!.totalCalls)}`}
            icon={<PhoneIncomingIcon className="size-4" />}
            delta={{ value: 1.2, suffix: "pp" }}
          />
          <StatTile
            label="Meetings booked"
            value={numberFmt.format(analytics.data!.meetingsBooked)}
            hint={pctFmt.format(analytics.data!.conversionRate) + " book rate"}
            icon={<CalendarCheckIcon className="size-4" />}
            delta={{ value: 8.7, suffix: "%" }}
          />
          <StatTile
            label="Avg duration"
            value={formatDuration(analytics.data!.avgDurationSec)}
            hint="per call"
            icon={<ClockIcon className="size-4" />}
            delta={{ value: -2.1, suffix: "%" }}
          />
        </>
      )}
    </div>
  );
}

import type { Rng } from "../rng";
import type { Campaign, CampaignStatus } from "../types";

const NAME_PREFIXES = [
  "Q2 Inbound", "Enterprise Outbound", "SMB Re-engagement", "Lapsed Trial",
  "Webinar Follow-up", "AE Booked Demos", "Cold West Coast", "ICP Tier 1",
  "Apollo Tech Pull", "LinkedIn Inbound", "Renewal Risk Q3", "Net-new EMEA",
];

const STATUS_WEIGHTS: [CampaignStatus, number][] = [
  ["active", 4],
  ["paused", 4],
  ["completed", 2],
  ["draft", 2],
];

const SCHEDULE_SUMMARIES = [
  "Mon–Fri · 9am–6pm PT",
  "Tue–Thu · 10am–4pm ET",
  "Mon–Fri · 8am–7pm local",
  "Mon–Fri · 9am–5pm PT · cap 80/day",
];

export function makeCampaign(
  rng: Rng,
  orgId: string,
  agentIds: string[],
  totalLeads: number,
  index: number,
  now: Date,
): Campaign {
  const status = index < 4 ? "active" : rng.weighted(STATUS_WEIGHTS);
  const name = `${NAME_PREFIXES[index % NAME_PREFIXES.length]}${index >= NAME_PREFIXES.length ? ` ${Math.floor(index / NAME_PREFIXES.length) + 1}` : ""}`;
  const audienceSize = rng.int(80, Math.min(900, Math.floor(totalLeads / 4)));
  const callsMade = status === "draft" ? 0 : rng.int(Math.floor(audienceSize * 0.2), Math.floor(audienceSize * 1.5));
  // Per-campaign book rate variance: 2–11%.
  const bookRate = rng.float(0.02, 0.11);
  const meetingsBooked = Math.round(callsMade * bookRate);
  const createdAt = new Date(now.getTime() - rng.int(7, 60) * 24 * 3600_000);
  const startedAt = status === "draft" ? null : new Date(createdAt.getTime() + rng.int(1, 4) * 24 * 3600_000);

  return {
    id: `cmp_${rng.uuid().slice(0, 14)}`,
    orgId,
    name,
    status,
    agentId: rng.pick(agentIds),
    audienceSize,
    callsMade,
    meetingsBooked,
    conversionRate: callsMade > 0 ? meetingsBooked / callsMade : 0,
    scheduleSummary: rng.pick(SCHEDULE_SUMMARIES),
    startedAt: startedAt ? startedAt.toISOString() : null,
    createdAt: createdAt.toISOString(),
  };
}

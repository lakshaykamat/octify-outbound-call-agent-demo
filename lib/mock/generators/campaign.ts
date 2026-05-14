import type { Rng } from "../rng";
import type { Campaign, CampaignStatus } from "../types";
import campaignsJson from "../data/campaigns.json";

// Editable in data/campaigns.json: campaign names, status mix, and
// schedule labels. Meetings/conversion are reconciled in seed.ts from
// the actual call set, so this generator does not seed them.
const NAME_PREFIXES = campaignsJson.namePrefixes;
const STATUS_WEIGHTS = campaignsJson.statusWeights as [CampaignStatus, number][];
const SCHEDULE_SUMMARIES = campaignsJson.scheduleSummaries;

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
    meetingsBooked: 0,
    conversionRate: 0,
    scheduleSummary: rng.pick(SCHEDULE_SUMMARIES),
    startedAt: startedAt ? startedAt.toISOString() : null,
    createdAt: createdAt.toISOString(),
  };
}

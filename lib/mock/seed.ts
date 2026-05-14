import { createRng } from "./rng";
import type {
  AgentConfig, AgentScript, AgentVersion, Agent, Campaign,
  CrmMappingRule, InboxItem, KnowledgeBase, Lead, Member,
  Organization, RetryPolicyRule, SegmentScheduleRule, SessionResponse, VoiceOption, XyloCall,
} from "./types";
import { makeLead, makeLeadFromBusiness, type SeedBusiness } from "./generators/lead";
import { makeCall } from "./generators/call";
import { makeCampaign } from "./generators/campaign";
import { activityMultiplier, dailyAnomaly, weekModifier } from "./distributions";
import {
  staticAgentConfig, staticAgentScript, staticAgentVersions,
  staticKnowledgeBase, staticVoiceOptions,
} from "./static-data";
import orgJson from "./data/org.json";
import teamJson from "./data/team.json";
import scenariosJson from "./data/scenarios.json";
// Real prospect businesses — edit lib/mock/data/leads.json directly to add,
// remove, or tweak entries. Each row hydrates one Lead with a synthesized
// contact person on top.
import seededLeads from "./data/leads.json";

const team = teamJson as {
  membersCreatedAt: string;
  members: Omit<Member, "organizationId" | "createdAt" | "updatedAt">[];
  agents: Omit<Agent, "orgId">[];
  crmRules: CrmMappingRule[];
  segmentSchedules: SegmentScheduleRule[];
  retryPolicies: RetryPolicyRule[];
  inbox: (Omit<InboxItem, "createdAt"> & { minutesAgo: number })[];
};

export type Scenario = "happy-path" | "first-day" | "power-user" | "investor-pitch";

export type SeededStore = {
  scenario: Scenario;
  seededAt: string;
  org: Organization;
  session: SessionResponse;
  members: Member[];
  agents: Agent[];
  agentConfig: AgentConfig;
  agentScript: AgentScript;
  agentVersions: AgentVersion[];
  voiceOptions: VoiceOption[];
  knowledgeBase: KnowledgeBase;
  crmRules: CrmMappingRule[];
  segmentSchedules: SegmentScheduleRule[];
  retryPolicies: RetryPolicyRule[];
  inbox: InboxItem[];
  leads: Lead[];
  campaigns: Campaign[];
  calls: XyloCall[];
};

const ORG_ID = (orgJson as { id: string }).id;

// Per-scenario volume targets live in data/scenarios.json so a non-engineer
// can tune the demo size without touching code. callsPerWeekday is the
// *Tue–Thu* target — Mon/Fri come in lower and weekends are dark, so the
// daily mean lands at roughly 65–75% of that number.
const SCENARIO_VOLUME = scenariosJson as Record<Scenario, { leads: number; days: number; callsPerWeekday: number }>;

function makeOrg(): Organization {
  return orgJson as Organization;
}

function makeMembers(): Member[] {
  const base = team.membersCreatedAt;
  return team.members.map((m) => ({
    ...m,
    organizationId: ORG_ID,
    createdAt: base,
    updatedAt: base,
  }));
}

function makeCrmRules(): CrmMappingRule[] {
  return team.crmRules;
}

function makeSegmentSchedules(): SegmentScheduleRule[] {
  return team.segmentSchedules;
}

function makeRetryPolicies(): RetryPolicyRule[] {
  return team.retryPolicies;
}

function makeInbox(now: Date): InboxItem[] {
  return team.inbox.map((item) => {
    const { minutesAgo, ...rest } = item;
    return {
      ...rest,
      createdAt: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
    } as InboxItem;
  });
}

function makeAgents(): Agent[] {
  return team.agents.map((a) => ({ ...a, orgId: ORG_ID }));
}

export function seedStore(scenario: Scenario = "happy-path"): SeededStore {
  const rng = createRng(0xC0FFEE ^ scenario.length);
  const volume = SCENARIO_VOLUME[scenario];
  const now = new Date();

  const org = makeOrg();
  const members = makeMembers();
  const agents = makeAgents();

  // Leads: real prospect businesses imported from MotorNexo's Google-Maps
  // pull come first (verified company + phone + ICP score), in a shuffled
  // order. If the scenario calls for more leads than the import provides,
  // top up with fully synthetic ones so volumes still hit their targets.
  const seedPool = seededLeads as SeedBusiness[];
  // Fisher–Yates: produces a uniform permutation off the seeded rng so the
  // real-business slot order is reproducible run to run.
  const shuffledSeeds = [...seedPool];
  for (let i = shuffledSeeds.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [shuffledSeeds[i], shuffledSeeds[j]] = [shuffledSeeds[j], shuffledSeeds[i]];
  }
  const leads: Lead[] = [];
  for (let i = 0; i < volume.leads; i++) {
    const daysAgo = Math.floor(Math.pow(rng.next(), 1.6) * volume.days);
    const created = new Date(now.getTime() - daysAgo * 24 * 3600_000);
    if (i < shuffledSeeds.length) {
      leads.push(makeLeadFromBusiness(rng, ORG_ID, created, shuffledSeeds[i]));
    } else {
      leads.push(makeLead(rng, ORG_ID, created));
    }
  }

  // Campaigns: 12.
  const campaigns: Campaign[] = [];
  for (let i = 0; i < 12; i++) {
    campaigns.push(makeCampaign(rng, ORG_ID, agents.map((a) => a.id), leads.length, i, now));
  }

  // Assign ~70% of leads to a random campaign.
  for (const lead of leads) {
    if (rng.bool(0.7)) lead.campaignId = rng.pick(campaigns).id;
  }

  // Agent attribution: only enabled agents take calls, and one carries the
  // majority of the load — typical of pilot deployments where a primary AI
  // SDR handles most volume and a secondary one specializes (enterprise,
  // renewals, etc). Weighted so totals are visibly uneven on the dashboard.
  const dialingAgents = agents.filter((a) => a.enabled);
  const agentWeights: [string, number][] =
    dialingAgents.length >= 2
      ? [
          [dialingAgents[0].id, 72],
          [dialingAgents[1].id, 28],
          ...dialingAgents.slice(2).map((a) => [a.id, 10] as [string, number]),
        ]
      : dialingAgents.map((a) => [a.id, 1] as [string, number]);

  // Calls: walk each day of the window, scale by weekModifier × dailyAnomaly
  // × activityMultiplier. Per-day noise is high enough that no two weekdays
  // come out identical, which matches what real call logs look like.
  const calls: XyloCall[] = [];
  for (let d = 0; d < volume.days; d++) {
    const day = new Date(now.getTime() - d * 24 * 3600_000);
    const dow = day.getDay();
    const weekIdx = Math.floor(d / 7);
    // Each day gets a small persistent shock (a particular Wed just runs hot,
    // a particular Thu runs cool) layered on top of the weekly anomaly list.
    const dayShock = 1 + rng.gaussian(0, 0.18);
    const dayTarget =
      volume.callsPerWeekday *
      weekModifier(weekIdx) *
      dailyAnomaly(d) *
      Math.max(0.3, dayShock);
    // Distribute across business hours.
    for (let hour = 8; hour < 19; hour++) {
      const mult = activityMultiplier(dow, hour);
      const expected = (dayTarget / 11) * mult;
      const n = Math.max(0, Math.round(expected + rng.gaussian(0, expected * 0.35)));
      for (let k = 0; k < n; k++) {
        const minute = rng.int(0, 59);
        const sec = rng.int(0, 59);
        const startedAt = new Date(day);
        startedAt.setHours(hour, minute, sec, 0);
        const lead = leads[rng.int(0, leads.length - 1)];
        const agentId = rng.weighted(agentWeights);
        calls.push(makeCall(rng, ORG_ID, lead, agentId, startedAt));
        if (!lead.lastTouchedAt || lead.lastTouchedAt < startedAt.toISOString()) {
          lead.lastTouchedAt = startedAt.toISOString();
        }
      }
    }
  }

  // Patch agent totals + average quality from the actual call set so the
  // agent roster page reflects what the calls table shows.
  const agentCounts = new Map<string, number>();
  const agentQualitySum = new Map<string, number>();
  const agentQualityN = new Map<string, number>();
  for (const c of calls) {
    if (!c.agentId) continue;
    agentCounts.set(c.agentId, (agentCounts.get(c.agentId) ?? 0) + 1);
    const score = c.analysis?.score;
    if (score !== undefined) {
      agentQualitySum.set(c.agentId, (agentQualitySum.get(c.agentId) ?? 0) + score);
      agentQualityN.set(c.agentId, (agentQualityN.get(c.agentId) ?? 0) + 1);
    }
  }
  agents.forEach((a) => {
    a.totalCalls = agentCounts.get(a.id) ?? 0;
    const n = agentQualityN.get(a.id) ?? 0;
    if (n > 0) {
      a.avgQuality = Math.round((agentQualitySum.get(a.id)! / n) * 10) / 10;
    }
  });

  // Patch campaign counters from the actual call set so the funnel ties out:
  // audienceSize = distinct leads attached, callsMade = calls on those leads,
  // meetingsBooked = booked outcomes from that same call set. This is the
  // only way the dashboard funnel and the per-campaign drill-downs agree.
  const campaignLeadCount = new Map<string, number>();
  for (const lead of leads) {
    if (!lead.campaignId) continue;
    campaignLeadCount.set(lead.campaignId, (campaignLeadCount.get(lead.campaignId) ?? 0) + 1);
  }
  const campaignCalls = new Map<string, number>();
  const campaignMeetings = new Map<string, number>();
  for (const c of calls) {
    if (!c.campaignId) continue;
    campaignCalls.set(c.campaignId, (campaignCalls.get(c.campaignId) ?? 0) + 1);
    if (c.analysis?.outcome === "meeting_booked") {
      campaignMeetings.set(c.campaignId, (campaignMeetings.get(c.campaignId) ?? 0) + 1);
    }
  }
  for (const cmp of campaigns) {
    if (cmp.status === "draft") {
      cmp.callsMade = 0;
      cmp.meetingsBooked = 0;
      cmp.conversionRate = 0;
      continue;
    }
    const made = campaignCalls.get(cmp.id) ?? 0;
    const booked = campaignMeetings.get(cmp.id) ?? 0;
    const attachedLeads = campaignLeadCount.get(cmp.id) ?? 0;
    // Real audience must accommodate the dial set: 1.0–1.4× as many leads
    // as calls (some leads dialed more than once, others not yet reached).
    cmp.audienceSize = Math.max(attachedLeads, Math.ceil(made * 1.15));
    cmp.callsMade = made;
    cmp.meetingsBooked = booked;
    cmp.conversionRate = made > 0 ? booked / made : 0;
  }

  const session: SessionResponse = {
    user: {
      id: members[0]._id,
      email: members[0].email,
      credits: members[0].credits,
      organizationId: ORG_ID,
      role: members[0].role,
      organization: org,
    },
    issued_at: Math.floor(now.getTime() / 1000),
    expires_at: Math.floor(now.getTime() / 1000) + 60 * 60 * 24 * 30,
  };

  return {
    scenario,
    seededAt: now.toISOString(),
    org,
    session,
    members,
    agents,
    agentConfig: staticAgentConfig(ORG_ID),
    agentScript: staticAgentScript(),
    agentVersions: staticAgentVersions(),
    voiceOptions: staticVoiceOptions(),
    knowledgeBase: staticKnowledgeBase(ORG_ID),
    crmRules: makeCrmRules(),
    segmentSchedules: makeSegmentSchedules(),
    retryPolicies: makeRetryPolicies(),
    inbox: makeInbox(now),
    leads,
    campaigns,
    calls: calls.sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? "")),
  };
}

import { createRng } from "./rng";
import type {
  AgentConfig, AgentScript, AgentVersion, Agent, Campaign,
  CrmMappingRule, InboxItem, KnowledgeBase, Lead, Member,
  Organization, RetryPolicyRule, SegmentScheduleRule, SessionResponse, VoiceOption, XyloCall,
} from "./types";
import { makeLead } from "./generators/lead";
import { makeCall } from "./generators/call";
import { makeCampaign } from "./generators/campaign";
import { activityMultiplier, weekModifier } from "./distributions";
import {
  staticAgentConfig, staticAgentScript, staticAgentVersions,
  staticKnowledgeBase, staticVoiceOptions,
} from "./static-data";
import orgJson from "./data/org.json";
import teamJson from "./data/team.json";

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

// Per-scenario volume targets. happy-path lands the prominent 30-day Calls
// KPI at ~500 dials — realistic pilot-deployment volume for a single AI SDR
// running ~23 dials/weekday into a curated B2B list.
const SCENARIO_VOLUME: Record<Scenario, { leads: number; days: number; callsPerWeekday: number }> = {
  "happy-path":     { leads: 900,  days: 90, callsPerWeekday: 23 },
  "first-day":      { leads: 30,   days: 7,  callsPerWeekday: 4 },
  "power-user":     { leads: 1800, days: 90, callsPerWeekday: 50 },
  "investor-pitch": { leads: 1300, days: 90, callsPerWeekday: 35 },
};

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

  // Leads: spread creation across the window with a bias toward recent.
  const leads: Lead[] = [];
  for (let i = 0; i < volume.leads; i++) {
    const daysAgo = Math.floor(Math.pow(rng.next(), 1.6) * volume.days);
    const created = new Date(now.getTime() - daysAgo * 24 * 3600_000);
    leads.push(makeLead(rng, ORG_ID, created));
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

  // Calls: walk each day of the window, scale by weekModifier × activityMultiplier.
  const calls: XyloCall[] = [];
  for (let d = 0; d < volume.days; d++) {
    const day = new Date(now.getTime() - d * 24 * 3600_000);
    const dow = day.getDay();
    const weekIdx = Math.floor(d / 7);
    const dayTarget = volume.callsPerWeekday * weekModifier(weekIdx);
    // Distribute across business hours.
    for (let hour = 8; hour < 19; hour++) {
      const mult = activityMultiplier(dow, hour);
      const expected = (dayTarget / 11) * mult;
      const n = Math.max(0, Math.round(expected + rng.gaussian(0, expected * 0.2)));
      for (let k = 0; k < n; k++) {
        const minute = rng.int(0, 59);
        const sec = rng.int(0, 59);
        const startedAt = new Date(day);
        startedAt.setHours(hour, minute, sec, 0);
        const lead = leads[rng.int(0, leads.length - 1)];
        const agentId = rng.pick(agents).id;
        calls.push(makeCall(rng, ORG_ID, lead, agentId, startedAt));
        if (!lead.lastTouchedAt || lead.lastTouchedAt < startedAt.toISOString()) {
          lead.lastTouchedAt = startedAt.toISOString();
        }
      }
    }
  }

  // Patch up agent totalCalls.
  const agentCounts = new Map<string, number>();
  for (const c of calls) {
    void c;
  }
  agents.forEach((a) => { a.totalCalls = agentCounts.get(a.id) ?? Math.floor(calls.length / agents.length); });

  // Patch campaign counters from the actual call set, scaled to audienceSize so
  // the dashboard funnel reads consistently regardless of total volume.
  for (const cmp of campaigns) {
    // Already populated by generator; trust it. Only zero out drafts.
    if (cmp.status === "draft") { cmp.callsMade = 0; cmp.meetingsBooked = 0; cmp.conversionRate = 0; }
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

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

const ORG_ID = "org_xylo_demo_001";

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
  return {
    id: ORG_ID,
    _id: ORG_ID,
    name: "MotorNexo",
    website: "https://motornexo.com",
    industry: "Automotive — B2B Auto Parts Marketplace",
    description:
      "MotorNexo is a verified B2B auto parts marketplace built for the automotive repair ecosystem. It helps franchised dealerships, collision centers, and independent repair shops do two things at once: move aged or excess parts inventory (turning frozen capital into cash) and find hard-to-source parts faster across a broader verified network — so fewer bays go cold waiting on a part.",
    customerSegment: "b2b",
    icps: [
      "SELLER — Franchised dealerships (1–15 rooftops) with aged/excess parts inventory to monetize",
      "BUYER — Body shops and collision centers (1–20 locations) needing fast OEM parts sourcing",
      "BUYER — Independent service centers (3–25 bays, 2+ locations) chasing hard-to-find parts",
      "SELLER + BUYER — Multi-rooftop dealer groups who both offload excess stock and source scarce parts",
    ],
    icpLocations: ["Los Angeles, California", "San Diego, California"],
    ownerRole: "Dealer Principal / GM / Owner / Fixed Ops Director / Controller",
    productOrServiceSummary:
      "A verified B2B auto parts marketplace with four core workflows: (1) Inventory — upload, manage, and monitor aged/obsolete parts with velocity and risk scoring; (2) Marketplace — search supplier inventory, compare availability, and purchase directly from verified network members; (3) Orders — track purchases and sales with full transaction history; (4) Backorders — create and monitor demand for unavailable SKUs until fulfilled. Free to use for buyers and sellers.",
    salesMotion:
      "Outbound demo-booking via AI voice. Seller pitch to parts managers and fixed ops directors (move aged inventory into cash). Buyer pitch to service managers, shop owners, and production managers (find hard-to-source parts faster). Dealer groups get both angles. Goal every call: book a 15–20 min demo.",
    salesChannel: "Outbound AI voice calling (direct sales)",
    pricingNote:
      "Free to use. Do not discuss commissions, transaction economics, or internal pricing details on calls — defer to the demo.",
    contactInfo: {
      phone: "+16193042264",
      email: "info@motornexo.com",
      bookingUrl: "",
      socialLinks: {},
    },
    businessHours: {
      timezone: "America/Los_Angeles",
      is24x7: false,
      schedule: [
        { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "10:00", close: "12:00" },
        { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "14:00", close: "17:00" },
      ],
    },
    location: {
      address: "",
      city: "",
      country: "Mexico",
      mapsUrl: "",
      facilities: [],
    },
    enabledProducts: { revpilot: { enabled: true }, xylo: { enabled: true } },
  };
}

function makeMembers(): Member[] {
  const base = "2026-03-01T12:00:00.000Z";
  return [
    { _id: "u_owner_001", email: "owner@motornexo.com",   role: "owner",  organizationId: ORG_ID, credits: 240, isEmailVerified: true,  isOrganizationEmailVerified: true,  createdAt: base, updatedAt: base },
    { _id: "u_admin_001", email: "noor@motornexo.com",    role: "admin",  organizationId: ORG_ID, credits: 80,  isEmailVerified: true,  isOrganizationEmailVerified: true,  createdAt: base, updatedAt: base },
    { _id: "u_admin_002", email: "ravi@motornexo.com",    role: "admin",  organizationId: ORG_ID, credits: 60,  isEmailVerified: true,  isOrganizationEmailVerified: true,  createdAt: base, updatedAt: base },
    { _id: "u_mem_001",   email: "ji-ho@motornexo.com",   role: "member", organizationId: ORG_ID, credits: 20,  isEmailVerified: true,  isOrganizationEmailVerified: true,  createdAt: base, updatedAt: base },
    { _id: "u_mem_002",   email: "amina@motornexo.com",   role: "member", organizationId: ORG_ID, credits: 10,  isEmailVerified: true,  isOrganizationEmailVerified: false, createdAt: base, updatedAt: base },
    { _id: "u_view_001",  email: "viewer@motornexo.com",  role: "viewer", organizationId: ORG_ID, credits: 0,   isEmailVerified: false, isOrganizationEmailVerified: false, createdAt: base, updatedAt: base },
  ];
}

function makeCrmRules(): CrmMappingRule[] {
  return [
    { id: "crm_01", when: { outcome: "meeting_booked" },     then: { stage: "Meeting Booked",  notifyOwner: true,  addTag: "xylo-booked" }, enabled: true },
    { id: "crm_02", when: { outcome: "callback_requested" }, then: { stage: "Follow Up",       notifyOwner: false, addTag: "callback" },    enabled: true },
    { id: "crm_03", when: { outcome: "not_interested" },     then: { stage: "Closed Lost",     notifyOwner: false, addTag: null },          enabled: true },
    { id: "crm_04", when: { outcome: "voicemail" },          then: { stage: "Attempting Contact", notifyOwner: false, addTag: null },       enabled: true },
    { id: "crm_05", when: { outcome: "opted_out" },          then: { stage: "Do Not Contact",  notifyOwner: true,  addTag: "dnc" },         enabled: true },
    { id: "crm_06", when: { outcome: "wrong_number" },       then: { stage: "Invalid Contact", notifyOwner: false, addTag: null },          enabled: false },
  ];
}

function makeSegmentSchedules(): SegmentScheduleRule[] {
  const tz = "America/Los_Angeles";
  return [
    { id: "seg_01", segment: "Enterprise",      days: ["tue", "wed", "thu"],          open: "10:00", close: "16:00", timezone: tz, enabled: true },
    { id: "seg_02", segment: "Mid-Market",      days: ["mon", "tue", "wed", "thu"],   open: "09:00", close: "17:00", timezone: tz, enabled: true },
    { id: "seg_03", segment: "SMB",             days: ["mon", "tue", "wed", "thu", "fri"], open: "08:00", close: "18:00", timezone: tz, enabled: true },
    { id: "seg_04", segment: "Renewals",        days: ["tue", "thu"],                 open: "10:00", close: "14:00", timezone: tz, enabled: true },
  ];
}

function makeRetryPolicies(): RetryPolicyRule[] {
  return [
    { id: "ret_01", outcome: "no_answer",         delayHours: 18, maxAttempts: 4, enabled: true },
    { id: "ret_02", outcome: "voicemail",         delayHours: 24, maxAttempts: 2, enabled: true },
    { id: "ret_03", outcome: "callback_requested", delayHours: 48, maxAttempts: 3, enabled: true },
    { id: "ret_04", outcome: "wrong_number",      delayHours: 0,  maxAttempts: 0, enabled: false },
  ];
}

function makeInbox(now: Date): InboxItem[] {
  const iso = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();
  return [
    { id: "ibx_01", kind: "hot_reply", status: "unread", assigneeEmail: null,                  createdAt: iso(14),
      title: "Renata at Cordova Logistics wants pricing", summary: "Asked for an annual quote on the Scale plan after the demo call. Reply via WhatsApp expected.",
      meta: { leadName: "Renata Vargas", company: "Cordova Logistics", callId: "call_seed_01" } },
    { id: "ibx_02", kind: "hot_reply", status: "unread", assigneeEmail: null,                  createdAt: iso(42),
      title: "Marcus at Driftwood Auto re-engaged", summary: "Replied to the post-call email: \"Tuesday 2pm works on my side — please send the invite.\"",
      meta: { leadName: "Marcus Lee", company: "Driftwood Auto", callId: "call_seed_02" } },
    { id: "ibx_03", kind: "crm_sync_failed", status: "unread", assigneeEmail: null,            createdAt: iso(67),
      title: "HubSpot writeback failed · 3 calls", summary: "HubSpot rate-limit hit during the 11am burst. Calls queued for retry — manual nudge recommended.",
      meta: { error: "429 Too Many Requests · pipeline_inbound_2026" } },
    { id: "ibx_04", kind: "agent_error", status: "unread", assigneeEmail: null,                createdAt: iso(95),
      title: "Agent paused mid-call · call_seed_03", summary: "Knowledge base lookup timed out after 4s. Agent fell back to the generic objection response.",
      meta: { error: "kb_timeout", callId: "call_seed_03" } },
    { id: "ibx_05", kind: "hot_reply", status: "read", assigneeEmail: "noor@motornexo.com",    createdAt: iso(220),
      title: "Priya at Northstar wants a security packet", summary: "Compliance review before any next step. Trust packet sent already; follow-up Thursday.",
      meta: { leadName: "Priya Anand", company: "Northstar Health" } },
    { id: "ibx_06", kind: "crm_sync_failed", status: "read", assigneeEmail: "ravi@motornexo.com", createdAt: iso(310),
      title: "Salesforce field mapping rejected one record", summary: "Custom field 'lifecycle_stage_v2' missing on the Leads object. Owner notified to add the field.",
      meta: { error: "Salesforce 400 · Unknown field" } },
    { id: "ibx_07", kind: "hot_reply", status: "resolved", assigneeEmail: "ravi@motornexo.com", createdAt: iso(720),
      title: "Anil at Pinpoint booked via WhatsApp",     summary: "Booked Thursday 10am Pacific. Invite confirmed. Closed the loop in CRM.",
      meta: { leadName: "Anil K", company: "Pinpoint" } },
    { id: "ibx_08", kind: "agent_error", status: "resolved", assigneeEmail: "owner@motornexo.com", createdAt: iso(1380),
      title: "Voice connection dropped twice on call_seed_08", summary: "Twilio reported codec mismatch. Routing changed to fallback carrier.",
      meta: { error: "rtp_codec_mismatch", callId: "call_seed_08" } },
  ];
}

function makeAgents(): Agent[] {
  return [
    { id: "agent_001", orgId: ORG_ID, name: "Xylo · Octify SDR",    persona: "Warm, brief, decisive", voice: "11labs-clara",   enabled: true,  avgQuality: 7.6, totalCalls: 0 },
    { id: "agent_002", orgId: ORG_ID, name: "Xylo · Enterprise BDR", persona: "Polished, formal",      voice: "11labs-marcus",  enabled: true,  avgQuality: 7.2, totalCalls: 0 },
    { id: "agent_003", orgId: ORG_ID, name: "Xylo · Renewals",      persona: "Familiar, casual",      voice: "11labs-sienna",  enabled: false, avgQuality: 6.9, totalCalls: 0 },
  ];
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

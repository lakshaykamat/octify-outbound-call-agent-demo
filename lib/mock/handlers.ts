// API-shaped accessors over the in-memory store. All hooks talk to these.
// Each adds latency jitter so loading states and skeletons get exercised.

import type {
  AgentConfig, AgentScript, AgentVersion, Analytics, BusinessHours,
  CallsListResponse, CrmMappingRule, InboxItem, InboxItemStatus,
  KbCaseStudy, KbFaq, KbObjection, KbProduct, KnowledgeBase, MembersResponse,
  Organization, Outcome, RecordingResponse, RetryPolicyRule, ScriptSectionKey,
  SegmentScheduleRule, SessionResponse, TestCallEvent, VoiceOption, XyloCall,
  Lead, Campaign,
} from "./types";
import { getStore } from "./store";

async function simulate<T>(value: T, min = 80, max = 240): Promise<T> {
  const delay = min + Math.random() * (max - min);
  await new Promise((r) => setTimeout(r, delay));
  return value;
}

export type CallsQuery = {
  page?: number;
  limit?: number;
  outcome?: Outcome;
  from?: string;
  to?: string;
};

export async function listCalls(q: CallsQuery): Promise<CallsListResponse> {
  const store = getStore();
  const page = Math.max(1, q.page ?? 1);
  const limit = Math.min(5000, Math.max(1, q.limit ?? 25));
  let calls = store.calls;
  if (q.outcome) calls = calls.filter((c) => c.analysis?.outcome === q.outcome);
  if (q.from) calls = calls.filter((c) => (c.startedAt ?? c.createdAt) >= q.from!);
  if (q.to) calls = calls.filter((c) => (c.startedAt ?? c.createdAt) <= q.to!);
  const total = calls.length;
  const start = (page - 1) * limit;
  return simulate({ calls: calls.slice(start, start + limit), total, page, limit });
}

export async function getCall(id: string): Promise<XyloCall> {
  const store = getStore();
  const call = store.calls.find((c) => c._id === id);
  if (!call) throw new Error(`Call ${id} not found`);
  return simulate(call);
}

export async function getRecordingUrl(_id: string): Promise<RecordingResponse> {
  // No real audio in Phase 1. Phase 3 will wire wavesurfer to a placeholder.
  return simulate({ url: "https://example.com/demo-recording.mp3", durationSec: 180 });
}

export async function getAnalytics(): Promise<Analytics> {
  const store = getStore();
  const calls = store.calls;
  const totalCalls = calls.length;
  const answered = calls.filter((c) => (c.durationSec ?? 0) > 25 && c.analysis).length;
  const meetingsBooked = calls.filter((c) => c.analysis?.outcome === "meeting_booked").length;
  const totalDuration = calls.reduce((s, c) => s + (c.durationSec ?? 0), 0);
  const avgDurationSec = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const conversionRate = totalCalls > 0 ? meetingsBooked / totalCalls : 0;
  return simulate({ totalCalls, answered, meetingsBooked, avgDurationSec, conversionRate });
}

export async function getSession(): Promise<SessionResponse> {
  return simulate(getStore().session);
}

export async function getAgentConfig(): Promise<AgentConfig> {
  return simulate(getStore().agentConfig);
}

export async function getKnowledgeBase(_orgId: string): Promise<KnowledgeBase> {
  return simulate(getStore().knowledgeBase);
}

export async function getOrganization(_orgId: string): Promise<Organization> {
  return simulate(getStore().org);
}

export async function listMembers(): Promise<MembersResponse> {
  const members = getStore().members;
  return simulate({ members, total: members.length });
}

// Phase 2 surfaces. Phase 1 ships the handlers so the fabric is complete and
// later PRs only need to add UI.

export type LeadsQuery = {
  search?: string;
  status?: Lead["status"] | "all";
  source?: Lead["source"] | "all";
  campaignId?: string | "all" | "none";
  scoreMin?: number;
  scoreMax?: number;
  page?: number;
  limit?: number;
};

export type LeadsListResponse = {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
};

function filterLeads(leads: Lead[], q: LeadsQuery): Lead[] {
  let out = leads;
  if (q.search) {
    const s = q.search.toLowerCase();
    out = out.filter(
      (l) =>
        l.fullName.toLowerCase().includes(s) ||
        l.company.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        l.phone.includes(s),
    );
  }
  if (q.status && q.status !== "all") out = out.filter((l) => l.status === q.status);
  if (q.source && q.source !== "all") out = out.filter((l) => l.source === q.source);
  if (q.campaignId && q.campaignId !== "all") {
    if (q.campaignId === "none") out = out.filter((l) => !l.campaignId);
    else out = out.filter((l) => l.campaignId === q.campaignId);
  }
  if (typeof q.scoreMin === "number") out = out.filter((l) => l.score >= q.scoreMin!);
  if (typeof q.scoreMax === "number") out = out.filter((l) => l.score <= q.scoreMax!);
  return out;
}

export async function listLeads(q: LeadsQuery = {}): Promise<LeadsListResponse> {
  const store = getStore();
  const page = Math.max(1, q.page ?? 1);
  const limit = Math.min(500, Math.max(1, q.limit ?? 50));
  const filtered = filterLeads(store.leads, q);
  const start = (page - 1) * limit;
  return simulate({
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  });
}

export async function getLead(id: string): Promise<Lead> {
  const lead = getStore().leads.find((l) => l.id === id);
  if (!lead) throw new Error(`Lead ${id} not found`);
  return simulate(lead);
}

export async function bulkUpdateLeads(
  ids: string[],
  patch: Partial<Pick<Lead, "campaignId" | "status" | "notes">>,
): Promise<{ updated: number }> {
  const store = getStore();
  let updated = 0;
  for (const lead of store.leads) {
    if (ids.includes(lead.id)) {
      Object.assign(lead, patch);
      updated++;
    }
  }
  return simulate({ updated });
}

export async function deleteLeads(ids: string[]): Promise<{ deleted: number }> {
  const store = getStore();
  const before = store.leads.length;
  store.leads = store.leads.filter((l) => !ids.includes(l.id));
  return simulate({ deleted: before - store.leads.length });
}

export type ImportPreview = {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  sample: Array<Record<string, string>>;
  columns: string[];
};

export type ImportOptions = {
  skipDuplicates: boolean;
  enrich: boolean;
  campaignId: string | null;
};

export async function importLeads(
  rows: Array<Record<string, string>>,
  mapping: Record<string, string>,
  options: ImportOptions,
): Promise<{ imported: number; skipped: number; ids: string[] }> {
  const store = getStore();
  const existingPhones = new Set(store.leads.map((l) => l.phone));
  const existingEmails = new Set(store.leads.map((l) => l.email.toLowerCase()));
  const ids: string[] = [];
  let skipped = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const phone = row[mapping.phone] ?? "";
    const email = (row[mapping.email] ?? "").toLowerCase();
    if (!phone) {
      skipped++;
      continue;
    }
    const dup =
      existingPhones.has(phone) || (email && existingEmails.has(email));
    if (dup && options.skipDuplicates) {
      skipped++;
      continue;
    }
    const firstName = row[mapping.firstName] ?? row[mapping.fullName]?.split(" ")[0] ?? "";
    const lastName =
      row[mapping.lastName] ?? row[mapping.fullName]?.split(" ").slice(1).join(" ") ?? "";
    const id = `lead_imp_${Math.random().toString(36).slice(2, 14)}`;
    const lead: Lead = {
      id,
      orgId: store.org.id,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim() || email || phone,
      email: email || `${firstName}.${lastName}@example.com`.toLowerCase(),
      phone,
      company: row[mapping.company] ?? "—",
      title: row[mapping.title] ?? "",
      industry: options.enrich ? "Software" : "",
      city: row[mapping.city] ?? "",
      region: row[mapping.region] ?? "",
      status: "new",
      source: "CSV import",
      score: 40 + Math.floor(Math.random() * 40),
      campaignId: options.campaignId,
      lastTouchedAt: null,
      createdAt: now,
      notes: "Imported via CSV",
    };
    store.leads.unshift(lead);
    existingPhones.add(phone);
    if (email) existingEmails.add(email);
    ids.push(id);
  }
  return simulate({ imported: ids.length, skipped, ids }, 400, 800);
}

export async function listCampaigns(): Promise<Campaign[]> {
  return simulate(getStore().campaigns);
}

export async function getCampaign(id: string): Promise<Campaign> {
  const cmp = getStore().campaigns.find((c) => c.id === id);
  if (!cmp) throw new Error(`Campaign ${id} not found`);
  return simulate(cmp);
}

export type NewCampaign = {
  name: string;
  agentId: string;
  audienceFilter: {
    status?: Lead["status"] | "all";
    source?: Lead["source"] | "all";
    scoreMin?: number;
  };
  scheduleSummary: string;
};

export async function createCampaign(input: NewCampaign): Promise<Campaign> {
  const store = getStore();
  const audience = filterLeads(store.leads, {
    status: input.audienceFilter.status,
    source: input.audienceFilter.source,
    scoreMin: input.audienceFilter.scoreMin,
  });
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: `cmp_new_${Math.random().toString(36).slice(2, 12)}`,
    orgId: store.org.id,
    name: input.name,
    status: "active",
    agentId: input.agentId,
    audienceSize: audience.length,
    callsMade: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    scheduleSummary: input.scheduleSummary,
    startedAt: now,
    createdAt: now,
  };
  store.campaigns.unshift(campaign);
  // Assign the filtered leads to this campaign
  const targetIds = new Set(audience.slice(0, 500).map((l) => l.id));
  for (const lead of store.leads) {
    if (targetIds.has(lead.id) && !lead.campaignId) lead.campaignId = campaign.id;
  }
  return simulate(campaign, 400, 700);
}

export async function updateCampaignStatus(
  id: string,
  status: Campaign["status"],
): Promise<Campaign> {
  const cmp = getStore().campaigns.find((c) => c.id === id);
  if (!cmp) throw new Error(`Campaign ${id} not found`);
  cmp.status = status;
  return simulate(cmp);
}

export async function previewAudience(filter: NewCampaign["audienceFilter"]): Promise<number> {
  const filtered = filterLeads(getStore().leads, {
    status: filter.status,
    source: filter.source,
    scoreMin: filter.scoreMin,
  });
  return simulate(filtered.length, 60, 160);
}

export async function listAgents() {
  return simulate(getStore().agents);
}

export type LiveSnapshot = {
  callsToday: number;
  meetingsToday: number;
  callsInFlight: number;
  avgDurationSec: number;
};

export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const calls = getStore().calls;
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayStart = startOfDay.getTime();

  let callsToday = 0;
  let meetingsToday = 0;
  let durSum = 0;
  let durN = 0;
  let inFlight = 0;
  for (const c of calls) {
    const t = new Date(c.startedAt ?? c.createdAt).getTime();
    if (t < dayStart) continue;
    callsToday++;
    if (c.analysis?.outcome === "meeting_booked") meetingsToday++;
    // Last 20 calls of today drive avg duration.
    if (durN < 20 && c.durationSec) {
      durSum += c.durationSec;
      durN++;
    }
    // "In flight" = started in the last 90s and not yet ended.
    if (now - t < 90_000) inFlight++;
  }

  // Floor calls-in-flight to a small baseline so the live page never looks dead.
  if (inFlight < 3) inFlight = 3 + Math.floor(Math.random() * 4);

  return simulate({
    callsToday,
    meetingsToday,
    callsInFlight: inFlight,
    avgDurationSec: durN > 0 ? Math.round(durSum / durN) : 0,
  });
}

export type RangeKey = "7d" | "30d" | "90d" | "qtd";

export type DashboardKpi = {
  label: string;
  value: number;
  pct?: boolean;
  duration?: boolean;
  delta: number;
  spark: number[];
};

export type DashboardData = {
  range: RangeKey;
  totals: {
    dialed: number;
    connected: number;
    conversations: number;
    qualified: number;
    booked: number;
    attended: number;
    avgQuality: number;
    avgDurationSec: number;
  };
  kpis: DashboardKpi[];
  performance: Array<{
    date: string;
    label: string;
    calls: number;
    connected: number;
    meetings: number;
    bookRate: number;
  }>;
  heatmap: Array<{ dow: number; hour: number; connectRate: number; calls: number }>;
  topCampaigns: Array<{ id: string; name: string; meetings: number; bookRate: number }>;
  topAgents: Array<{ id: string; name: string; quality: number; calls: number }>;
  insights: Array<{ title: string; body: string }>;
  activity: Array<{
    id: string;
    type: "call.booked" | "campaign.launched" | "lead.imported" | "member.joined" | "agent.updated";
    at: string;
    message: string;
  }>;
};

const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90, qtd: 90 };

export async function getDashboard(range: RangeKey = "30d"): Promise<DashboardData> {
  const store = getStore();
  const days = RANGE_DAYS[range];
  const now = Date.now();
  const since = now - days * 24 * 3600_000;
  const prevSince = since - days * 24 * 3600_000;

  const callsInRange = store.calls.filter(
    (c) => new Date(c.startedAt ?? c.createdAt).getTime() >= since,
  );
  const callsPrev = store.calls.filter((c) => {
    const t = new Date(c.startedAt ?? c.createdAt).getTime();
    return t >= prevSince && t < since;
  });

  const dialed = callsInRange.length;
  const connected = callsInRange.filter(
    (c) => (c.durationSec ?? 0) > 0 && c.analysis,
  ).length;
  const conversations = callsInRange.filter((c) => (c.durationSec ?? 0) > 30).length;
  const booked = callsInRange.filter(
    (c) => c.analysis?.outcome === "meeting_booked",
  ).length;
  const qualified = Math.round(conversations * 0.4);
  const attended = Math.round(booked * 0.66);
  const totalDuration = callsInRange.reduce((s, c) => s + (c.durationSec ?? 0), 0);
  const avgDurationSec = dialed > 0 ? Math.round(totalDuration / dialed) : 0;
  const qualitySum = callsInRange.reduce(
    (s, c) => s + (c.analysis?.score ?? 0),
    0,
  );
  const qualityCount = callsInRange.filter((c) => c.analysis?.score !== undefined).length;
  const avgQuality = qualityCount > 0 ? qualitySum / qualityCount : 0;

  const prevDialed = callsPrev.length;
  const prevConnected = callsPrev.filter(
    (c) => (c.durationSec ?? 0) > 0 && c.analysis,
  ).length;
  const prevBooked = callsPrev.filter(
    (c) => c.analysis?.outcome === "meeting_booked",
  ).length;

  const delta = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  // Per-day buckets for the performance chart and sparklines.
  const buckets: Array<{
    date: string;
    label: string;
    calls: number;
    connected: number;
    meetings: number;
    qualityTotal: number;
    qualityN: number;
  }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * 24 * 3600_000);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets.push({
      date: key,
      label,
      calls: 0,
      connected: 0,
      meetings: 0,
      qualityTotal: 0,
      qualityN: 0,
    });
  }
  const bucketIdx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const call of callsInRange) {
    const key = (call.startedAt ?? call.createdAt).slice(0, 10);
    const idx = bucketIdx.get(key);
    if (idx == null) continue;
    const b = buckets[idx];
    b.calls++;
    if ((call.durationSec ?? 0) > 0 && call.analysis) b.connected++;
    if (call.analysis?.outcome === "meeting_booked") b.meetings++;
    if (call.analysis?.score !== undefined) {
      b.qualityTotal += call.analysis.score;
      b.qualityN++;
    }
  }
  const performance = buckets.map((b) => ({
    date: b.date,
    label: b.label,
    calls: b.calls,
    connected: b.connected,
    meetings: b.meetings,
    bookRate: b.calls > 0 ? b.meetings / b.calls : 0,
  }));

  // Sparks for the last 14 buckets (or fewer).
  const sparkLen = Math.min(14, buckets.length);
  const sparkSlice = buckets.slice(-sparkLen);
  const callsSpark = sparkSlice.map((b) => b.calls);
  const meetSpark = sparkSlice.map((b) => b.meetings);

  const rejectedOutcomes: Outcome[] = ["not_interested", "opted_out"];
  const rejected = callsInRange.filter(
    (c) => c.analysis && rejectedOutcomes.includes(c.analysis.outcome),
  ).length;
  const prevRejected = callsPrev.filter(
    (c) => c.analysis && rejectedOutcomes.includes(c.analysis.outcome),
  ).length;
  const rejectedByDay = new Map<string, number>();
  for (const call of callsInRange) {
    if (!call.analysis || !rejectedOutcomes.includes(call.analysis.outcome))
      continue;
    const key = (call.startedAt ?? call.createdAt).slice(0, 10);
    rejectedByDay.set(key, (rejectedByDay.get(key) ?? 0) + 1);
  }
  const rejSpark = sparkSlice.map((b) => rejectedByDay.get(b.date) ?? 0);

  const kpis: DashboardKpi[] = [
    {
      label: "Total calls",
      value: dialed,
      delta: delta(dialed, prevDialed),
      spark: callsSpark,
    },
    {
      label: "Meetings booked",
      value: booked,
      delta: delta(booked, prevBooked),
      spark: meetSpark,
    },
    {
      label: "Call rejected",
      value: rejected,
      delta: delta(rejected, prevRejected),
      spark: rejSpark,
    },
  ];

  // Heatmap: connect rate by dow × hour from this org's calls.
  const heatmapBuckets = new Map<string, { calls: number; connected: number }>();
  for (let d = 0; d < 7; d++) {
    for (let h = 8; h < 19; h++) {
      heatmapBuckets.set(`${d}-${h}`, { calls: 0, connected: 0 });
    }
  }
  for (const call of callsInRange) {
    const t = new Date(call.startedAt ?? call.createdAt);
    const key = `${t.getDay()}-${t.getHours()}`;
    const b = heatmapBuckets.get(key);
    if (!b) continue;
    b.calls++;
    if ((call.durationSec ?? 0) > 0 && call.analysis) b.connected++;
  }
  const heatmap = Array.from(heatmapBuckets.entries()).map(([key, v]) => {
    const [dow, hour] = key.split("-").map(Number);
    return {
      dow,
      hour,
      calls: v.calls,
      connectRate: v.calls > 0 ? v.connected / v.calls : 0,
    };
  });

  // Top campaigns by booked.
  const topCampaigns = [...store.campaigns]
    .filter((c) => c.callsMade > 0)
    .sort((a, b) => b.meetingsBooked - a.meetingsBooked)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      meetings: c.meetingsBooked,
      bookRate: c.conversionRate,
    }));

  // Top agents by quality.
  const agentStats = new Map<string, { calls: number; qSum: number; qN: number }>();
  for (const call of callsInRange) {
    const a = call.agentId;
    if (!a) continue;
    const s = agentStats.get(a) ?? { calls: 0, qSum: 0, qN: 0 };
    s.calls++;
    if (call.analysis?.score !== undefined) {
      s.qSum += call.analysis.score;
      s.qN++;
    }
    agentStats.set(a, s);
  }
  const topAgents = store.agents
    .map((a) => {
      const s = agentStats.get(a.id) ?? { calls: 0, qSum: 0, qN: 0 };
      return {
        id: a.id,
        name: a.name,
        calls: s.calls,
        quality: s.qN > 0 ? s.qSum / s.qN : a.avgQuality,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // AI insights: computed from heatmap and outcomes.
  const insights: Array<{ title: string; body: string }> = [];
  const peakCell = heatmap.reduce(
    (best, cell) => (cell.connectRate > best.connectRate && cell.calls > 5 ? cell : best),
    heatmap[0],
  );
  const overallConnect = dialed > 0 ? connected / dialed : 0;
  if (peakCell && peakCell.calls > 5 && overallConnect > 0) {
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][peakCell.dow];
    const lift = (peakCell.connectRate / overallConnect - 1) * 100;
    insights.push({
      title: "Best dialing window",
      body: `${dayName} ${peakCell.hour}:00 runs ${lift.toFixed(0)}% above your average connect rate. Shift more dials there.`,
    });
  }
  const noAnswer = callsInRange.filter((c) => !c.analysis).length;
  const noAnswerRate = dialed > 0 ? noAnswer / dialed : 0;
  if (noAnswerRate > 0.2) {
    insights.push({
      title: "No-answer rate is high",
      body: `${(noAnswerRate * 100).toFixed(0)}% of dials ring out. Try shifting cap from Mon 8–10am to Tue–Thu mid-afternoon.`,
    });
  }
  if (topCampaigns.length > 0) {
    const best = topCampaigns[0];
    insights.push({
      title: "Top performer",
      body: `"${best.name}" books ${(best.bookRate * 100).toFixed(1)}% — ${best.bookRate > 0.06 ? "above" : "below"} the org-wide ${(((booked || 1) / (dialed || 1)) * 100).toFixed(1)}% baseline.`,
    });
  }

  // Activity stream — synthesize from store state plus the most recent booked calls.
  const recentBooked = callsInRange
    .filter((c) => c.analysis?.outcome === "meeting_booked")
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
    .slice(0, 4);
  const activity: DashboardData["activity"] = [];
  for (const call of recentBooked) {
    activity.push({
      id: `act_${call._id}`,
      type: "call.booked",
      at: call.startedAt ?? call.createdAt,
      message: `${call.prospectName ?? "Lead"} at ${call.company ?? "—"} booked a meeting`,
    });
  }
  const recentCampaigns = [...store.campaigns]
    .filter((c) => c.startedAt)
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
    .slice(0, 2);
  for (const c of recentCampaigns) {
    activity.push({
      id: `act_cmp_${c.id}`,
      type: "campaign.launched",
      at: c.startedAt!,
      message: `Campaign "${c.name}" launched · ${c.audienceSize.toLocaleString()} leads`,
    });
  }
  const recentImports = store.leads.filter((l) => l.source === "CSV import").slice(0, 1);
  if (recentImports.length > 0) {
    const batch = store.leads.filter((l) => l.source === "CSV import").length;
    activity.push({
      id: "act_import",
      type: "lead.imported",
      at: recentImports[0].createdAt,
      message: `Imported ${batch.toLocaleString()} leads from CSV`,
    });
  }
  activity.push({
    id: "act_member",
    type: "member.joined",
    at: new Date(now - 5 * 24 * 3600_000).toISOString(),
    message: `Ravi joined the team`,
  });
  activity.sort((a, b) => b.at.localeCompare(a.at));

  return simulate({
    range,
    totals: {
      dialed,
      connected,
      conversations,
      qualified,
      booked,
      attended,
      avgQuality,
      avgDurationSec,
    },
    kpis,
    performance,
    heatmap,
    topCampaigns,
    topAgents,
    insights,
    activity: activity.slice(0, 8),
  });
}

export async function getCampaignStats(id: string) {
  const store = getStore();
  const cmp = store.campaigns.find((c) => c.id === id);
  if (!cmp) throw new Error(`Campaign ${id} not found`);
  // Synthesize per-campaign call rollups consistent with the campaign's stored
  // book rate, even if the seeded calls don't carry campaignId.
  const dialed = cmp.callsMade;
  const connected = Math.round(dialed * 0.3);
  const conversations = Math.round(connected * 0.65);
  const qualified = Math.round(conversations * 0.4);
  const booked = cmp.meetingsBooked;
  const objections: Array<{ label: string; count: number }> = [
    { label: "Pricing", count: Math.round(dialed * 0.12) },
    { label: "Timing", count: Math.round(dialed * 0.09) },
    { label: "Already have a solution", count: Math.round(dialed * 0.07) },
    { label: "Not the decision maker", count: Math.round(dialed * 0.05) },
    { label: "Send more info", count: Math.round(dialed * 0.04) },
  ];
  return simulate({ dialed, connected, conversations, qualified, booked, objections });
}

// Phase 4.1 — Agent Studio.

export async function getAgentScript(): Promise<AgentScript> {
  return simulate(getStore().agentScript);
}

export type AgentConfigPatch = {
  enabled?: boolean;
  objective?: string;
  name?: string;
  voiceId?: string;
  speed?: number;
  temperature?: number;
  businessHours?: BusinessHours;
};

export async function updateAgentConfig(patch: AgentConfigPatch): Promise<AgentConfig> {
  const store = getStore();
  const cfg = store.agentConfig;
  if (patch.enabled !== undefined) cfg.enabled = patch.enabled;
  if (patch.objective !== undefined) cfg.objective = patch.objective;
  if (patch.name !== undefined) cfg.agent.name = patch.name;
  if (patch.voiceId !== undefined && cfg.agent.voice) cfg.agent.voice.voiceId = patch.voiceId;
  if (patch.speed !== undefined && cfg.agent.voice) cfg.agent.voice.speed = patch.speed;
  if (patch.temperature !== undefined && cfg.agent.llm) cfg.agent.llm.temperature = patch.temperature;
  if (patch.businessHours !== undefined) cfg.businessHours = patch.businessHours;
  cfg.updatedAt = new Date().toISOString();
  return simulate(cfg, 120, 280);
}

export async function updateAgentScript(section: ScriptSectionKey, value: string): Promise<AgentScript> {
  const store = getStore();
  store.agentScript = { ...store.agentScript, [section]: value };
  return simulate(store.agentScript, 120, 280);
}

const REWRITE_PRESETS: Record<ScriptSectionKey, string[]> = {
  opening: [
    "Hey {{firstName}}, this is Xylo from Octify. I'll be quick — sixty seconds to share why I'm calling, then you tell me if it's worth more time. Fair?",
    "Hi {{firstName}}, Xylo from Octify here — I know you weren't expecting this. One sentence on why I picked up the phone, and then I'll let you decide if we keep talking.",
  ],
  qualification: [
    "Quick check so I don't waste your minute: at {{company}}, are you the person who'd evaluate an outbound AI calling tool, or is that on someone else's plate?",
    "Before I go further — does AI calling tooling fall in your scope at {{company}}, or should I be talking to someone else?",
  ],
  pitch: [
    "Teams switch to us for one reason: every conversation lands in HubSpot in under ninety seconds with the next step queued. The compounding effect is a 25–35% lift on booked meetings inside six weeks.",
    "The headline isn't dials per hour — it's CRM-writeback quality. That's where teams using Xylo see meetings booked move 25–35% inside the first six weeks.",
  ],
  objections: [
    "Fair. The fastest way to make it real is thirty seconds of a live call and a screenshot of the writeback it produced. Can I send those over today?",
    "I hear that a lot. Would a thirty-second sample call plus a redacted CRM record change anything? If not, I'll drop it.",
  ],
  close: [
    "Okay — twenty minutes with a solution AE, we walk your stack and show a live call. Thursday 10 Pacific or Friday 2 Pacific — which lands?",
    "Let's lock twenty minutes. Thursday 10am or Friday 2pm Pacific — pick one and I'll send the invite before we hang up.",
  ],
};

export async function aiRewriteSection(section: ScriptSectionKey): Promise<string> {
  const options = REWRITE_PRESETS[section];
  const pick = options[Math.floor(Math.random() * options.length)];
  return simulate(pick, 700, 1300);
}

export async function listVoiceOptions(): Promise<VoiceOption[]> {
  return simulate(getStore().voiceOptions);
}

export async function listAgentVersions(): Promise<AgentVersion[]> {
  return simulate(getStore().agentVersions);
}

export async function saveAgentVersion(note: string): Promise<AgentVersion> {
  const store = getStore();
  const cfg = store.agentConfig;
  const id = `ver_${Math.random().toString(36).slice(2, 8)}`;
  const versionNumber = store.agentVersions.length + 1;
  const version: AgentVersion = {
    id,
    label: `v${versionNumber + 1} · ${note.slice(0, 48) || "Manual save"}`,
    createdAt: new Date().toISOString(),
    author: store.session.user.email,
    note: note || "Manual save",
    snapshot: {
      name: cfg.agent.name,
      objective: cfg.objective,
      voiceId: cfg.agent.voice?.voiceId ?? "",
      speed: cfg.agent.voice?.speed ?? 1,
      temperature: cfg.agent.llm?.temperature ?? 0.4,
      script: { ...store.agentScript },
    },
  };
  store.agentVersions.unshift(version);
  return simulate(version, 300, 600);
}

export async function restoreAgentVersion(id: string): Promise<{ config: AgentConfig; script: AgentScript }> {
  const store = getStore();
  const version = store.agentVersions.find((v) => v.id === id);
  if (!version) throw new Error(`Version ${id} not found`);
  const cfg = store.agentConfig;
  cfg.agent.name = version.snapshot.name;
  cfg.objective = version.snapshot.objective;
  if (cfg.agent.voice) {
    cfg.agent.voice.voiceId = version.snapshot.voiceId;
    cfg.agent.voice.speed = version.snapshot.speed;
  }
  if (cfg.agent.llm) cfg.agent.llm.temperature = version.snapshot.temperature;
  cfg.updatedAt = new Date().toISOString();
  store.agentScript = { ...version.snapshot.script };
  return simulate({ config: cfg, script: store.agentScript }, 300, 600);
}

// Test call: returns a scripted sequence of events with ms offsets. The
// component schedules them on the client clock to simulate streaming.
export async function runTestCall(phone: string): Promise<{ events: TestCallEvent[] }> {
  // Pick a random outcome with reasonable weights.
  const r = Math.random();
  const outcome: TestCallEvent["outcome"] =
    r < 0.45 ? "meeting_booked"
    : r < 0.7 ? "callback_requested"
    : r < 0.9 ? "not_interested"
    : "voicemail";

  const events: TestCallEvent[] = [];
  let t = 0;
  events.push({ kind: "ringing", at: t });
  t += 1800;
  events.push({ kind: "ringing", at: t });
  t += 1800;

  if (outcome === "voicemail") {
    events.push({ kind: "connected", at: t });
    t += 600;
    events.push({ kind: "transcript", at: t, role: "user", text: "Hi, you've reached me. Leave a message and I'll get back." });
    t += 2200;
    events.push({ kind: "transcript", at: t, role: "agent", text: "Hi — this is Xylo from Octify, I'll try again. Have a great day." });
    t += 1800;
    events.push({ kind: "outcome", at: t, outcome });
    events.push({ kind: "ended", at: t + 400 });
    return simulate({ events }, 200, 400);
  }

  events.push({ kind: "connected", at: t });
  t += 600;

  const lines: Array<[TestCallEvent["role"], string, number]> = [
    ["user", "Hello?", 900],
    ["agent", `Hey, this is Xylo calling from Octify Technologies. I know I'm catching you cold — got ninety seconds for me to share why I'm calling, and then you can tell me if it's worth more time?`, 4200],
    ["user", "Uh, sure, go ahead.", 1400],
    ["agent", "Appreciate it. Teams like yours tell us the meaningful win isn't more dials — it's how fast every conversation lands in HubSpot with the right next step queued.", 4400],
    ["user", "We already use a tool for that.", 1800],
  ];

  if (outcome === "not_interested") {
    lines.push(["agent", "Got it. Mind if I ask which one — and if there's anything you'd want it to do better?", 3000]);
    lines.push(["user", "Honestly we're heads down on a launch right now. Not the right time.", 2200]);
    lines.push(["agent", "Totally fair. I'll drop a one-pager in email and circle back next quarter. Have a good one.", 2800]);
  } else if (outcome === "callback_requested") {
    lines.push(["agent", "Makes sense. Would a thirty-second sample call plus a redacted CRM record be worth a look?", 3200]);
    lines.push(["user", "Send it over. I'll have time Thursday.", 1600]);
    lines.push(["agent", "Perfect — I'll email it now and follow up Thursday morning. Thanks for the time.", 2400]);
  } else {
    lines.push(["agent", "Makes sense. The piece teams switch for is CRM writeback quality — every call summarised before the rep opens the lead. Want a twenty-minute look?", 4200]);
    lines.push(["user", "Yeah okay, that could be useful.", 1600]);
    lines.push(["agent", "Great. I've got Thursday 10am or Friday 2pm Pacific — which works?", 2400]);
    lines.push(["user", "Thursday works.", 1100]);
    lines.push(["agent", "Locked in — invite is on its way. Talk Thursday.", 2000]);
  }

  for (const [role, text, dur] of lines) {
    events.push({ kind: "transcript", at: t, role, text });
    t += dur;
  }
  events.push({ kind: "outcome", at: t, outcome });
  events.push({ kind: "ended", at: t + 600 });
  void phone;
  return simulate({ events }, 200, 400);
}

// Phase 4.2 — Knowledge Base editor.

export type KnowledgeBasePatch = Partial<
  Pick<
    KnowledgeBase,
    "products" | "objections" | "caseStudies" | "faqs"
    | "competitorNotes" | "pricingNotes" | "qualifyingQuestions" | "doNotMention"
  >
>;

export async function updateKnowledgeBase(patch: KnowledgeBasePatch): Promise<KnowledgeBase> {
  const store = getStore();
  store.knowledgeBase = {
    ...store.knowledgeBase,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return simulate(store.knowledgeBase, 100, 240);
}

const OBJECTION_SUGGESTIONS: KbObjection[] = [
  { objection: "We're rebuilding our outbound motion next quarter.",          response: "Makes sense. Most teams plug us in during a rebuild because we don't replace your reps — we route warm conversations to them. Worth a fifteen-minute look before you finalise the stack?" },
  { objection: "Our prospects can tell it's AI within five seconds.",          response: "That's the bar we hold ourselves to. Could I send a thirty-second clip from a recent call? If you can pick it within five seconds, I'll buy you coffee." },
  { objection: "We tried voice AI six months ago — wasn't ready.",            response: "Totally fair, it's moved a lot. Two specific things have changed: CRM writeback latency and interruption handling. Worth a side-by-side?" },
  { objection: "Our compliance team won't sign off on outbound AI.",          response: "We hear that — we're SOC 2 Type II and route through your numbers under your TCPA consent records. Happy to send the trust packet directly to security." },
  { objection: "We don't have the volume to justify it.",                      response: "Fair. Our smallest production tenants run fifty dials a day and still book a meeting a week. Want a fifteen-minute look at what that looks like at your scale?" },
];

const FAQ_SUGGESTIONS: KbFaq[] = [
  { question: "Can we use our own phone numbers?",                  answer: "Yes — bring your numbers via SIP or our managed-number pool. We honour your area-code matching rules either way." },
  { question: "What happens if the lead asks a question off-script?", answer: "The agent draws on the knowledge base in real time. If it can't answer with confidence, it offers a callback from a human and writes the question to CRM." },
  { question: "How do you handle do-not-call lists?",                 answer: "We hit the national DNC + your internal suppression list before every dial. Opt-outs heard on the call write back instantly and propagate across campaigns." },
  { question: "Do you support multi-language calls?",                 answer: "English, Spanish, and Portuguese are GA. French and German are in early access. The agent can switch mid-call if the prospect changes language." },
  { question: "What's included in the trial?",                        answer: "Two weeks, up to 500 dials, one agent, one CRM connector, and a guided KB build. No credit card." },
];

export async function aiSuggestObjections(): Promise<KbObjection[]> {
  const shuffled = [...OBJECTION_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return simulate(shuffled.slice(0, 3), 800, 1400);
}

export async function aiSuggestFaqs(): Promise<KbFaq[]> {
  const shuffled = [...FAQ_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return simulate(shuffled.slice(0, 3), 800, 1400);
}

export type PdfExtraction = {
  filename: string;
  pages: number;
  products: KbProduct[];
};

// Phase 4.3 — Workflows.

export async function listCrmRules(): Promise<CrmMappingRule[]> {
  return simulate(getStore().crmRules);
}
export async function updateCrmRules(next: CrmMappingRule[]): Promise<CrmMappingRule[]> {
  getStore().crmRules = next;
  return simulate(next, 100, 240);
}
export async function listSegmentSchedules(): Promise<SegmentScheduleRule[]> {
  return simulate(getStore().segmentSchedules);
}
export async function updateSegmentSchedules(next: SegmentScheduleRule[]): Promise<SegmentScheduleRule[]> {
  getStore().segmentSchedules = next;
  return simulate(next, 100, 240);
}
export async function listRetryPolicies(): Promise<RetryPolicyRule[]> {
  return simulate(getStore().retryPolicies);
}
export async function updateRetryPolicies(next: RetryPolicyRule[]): Promise<RetryPolicyRule[]> {
  getStore().retryPolicies = next;
  return simulate(next, 100, 240);
}

// Phase 4.3 — Inbox.

export type InboxQuery = {
  kind?: InboxItem["kind"] | "all";
  status?: InboxItemStatus | "all";
  assignee?: string | "all" | "unassigned";
};

export async function listInbox(q: InboxQuery = {}): Promise<InboxItem[]> {
  let items = [...getStore().inbox];
  if (q.kind && q.kind !== "all") items = items.filter((i) => i.kind === q.kind);
  if (q.status && q.status !== "all") items = items.filter((i) => i.status === q.status);
  if (q.assignee && q.assignee !== "all") {
    if (q.assignee === "unassigned") items = items.filter((i) => i.assigneeEmail === null);
    else items = items.filter((i) => i.assigneeEmail === q.assignee);
  }
  return simulate(items);
}

export async function getInboxCounts(): Promise<{ unread: number; total: number }> {
  const items = getStore().inbox;
  return simulate({
    unread: items.filter((i) => i.status === "unread").length,
    total: items.length,
  });
}

export async function updateInboxItem(
  id: string,
  patch: Partial<Pick<InboxItem, "status" | "assigneeEmail">>,
): Promise<InboxItem> {
  const store = getStore();
  const item = store.inbox.find((i) => i.id === id);
  if (!item) throw new Error(`Inbox item ${id} not found`);
  Object.assign(item, patch);
  return simulate(item, 100, 220);
}

export async function bulkUpdateInbox(
  ids: string[],
  patch: Partial<Pick<InboxItem, "status" | "assigneeEmail">>,
): Promise<{ updated: number }> {
  const store = getStore();
  let updated = 0;
  for (const item of store.inbox) {
    if (ids.includes(item.id)) {
      Object.assign(item, patch);
      updated++;
    }
  }
  return simulate({ updated }, 120, 240);
}

export async function extractKbProductsFromFile(filename: string): Promise<PdfExtraction> {
  const seedName = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  const base = seedName.split(" ").filter(Boolean).slice(0, 3).join(" ") || "Product";
  const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const products: KbProduct[] = [
    {
      name: `${cap(base)} Core`,
      description: "Voice-first core plan with CRM writeback and standard analytics. Best for teams getting started.",
      price: "$480 / month per seat",
      pitch: "Replace the manual after-call note. Every conversation lands in CRM in under ninety seconds.",
    },
    {
      name: `${cap(base)} Scale`,
      description: "Adds multi-agent orchestration, campaign experiments, and custom CRM connectors.",
      price: "$1,100 / month per seat",
      pitch: "Run twenty agents across regions with a single talk-track source of truth.",
    },
  ];
  return simulate({ filename, pages: 12 + Math.floor(Math.random() * 18), products }, 2200, 3800);
}

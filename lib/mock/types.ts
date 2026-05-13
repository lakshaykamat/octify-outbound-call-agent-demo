// Single source of truth for mock types. Shared Zod-derived shapes live in
// ./schemas; this file adds the fabric-only entities (Lead, Campaign, Agent,
// AgentScript, AgentVersion, etc.) on top.

export type {
  Outcome, Sentiment, WritebackStatus, CallStatus,
  Analysis, TranscriptLine, XyloCall, CallsListResponse,
  Analytics, RecordingResponse,
  KbProduct, KbObjection, KbCaseStudy, KbFaq, KnowledgeBase,
  AgentConfig, CallRules, BusinessHours,
  Organization, Member, MembersResponse,
  SessionUser, SessionResponse,
  ProductToggle,
} from "./schemas";

export type LeadStatus = "new" | "queued" | "calling" | "completed" | "dnc";
export type LeadSource = "Website form" | "CSV import" | "HubSpot sync" | "Apollo" | "Manual";

export type Lead = {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  industry: string;
  city: string;
  region: string;
  status: LeadStatus;
  source: LeadSource;
  score: number;            // 0–100
  campaignId: string | null;
  lastTouchedAt: string | null;
  createdAt: string;
  notes: string;
};

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type Campaign = {
  id: string;
  orgId: string;
  name: string;
  status: CampaignStatus;
  agentId: string;
  audienceSize: number;
  callsMade: number;
  meetingsBooked: number;
  conversionRate: number;   // 0–1
  scheduleSummary: string;
  startedAt: string | null;
  createdAt: string;
};

export type Agent = {
  id: string;
  orgId: string;
  name: string;
  persona: string;
  voice: string;
  enabled: boolean;
  avgQuality: number;
  totalCalls: number;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ScriptSectionKey = "opening" | "qualification" | "pitch" | "objections" | "close";

export type AgentScript = {
  opening: string;
  qualification: string;
  pitch: string;
  objections: string;
  close: string;
};

export type AgentVersion = {
  id: string;
  label: string;
  createdAt: string;
  author: string;
  note: string;
  snapshot: {
    name: string;
    objective: string;
    voiceId: string;
    speed: number;
    temperature: number;
    script: AgentScript;
  };
};

export type VoiceOption = {
  id: string;
  name: string;
  accent: string;
  gender: "female" | "male" | "neutral";
  tone: string;
  // A short PCM-shaped curve used to render a preview wave (fake audio).
  waveform: number[];
};

export type TestCallEventKind =
  | "ringing"
  | "connected"
  | "transcript"
  | "outcome"
  | "ended";

export type TestCallEvent = {
  kind: TestCallEventKind;
  at: number; // ms offset from call start
  role?: "agent" | "user";
  text?: string;
  outcome?: "meeting_booked" | "not_interested" | "voicemail" | "callback_requested";
};

// Phase 4.3 — Workflows.

type OutcomeRef = import("@/lib/mock").Outcome;

export type CrmMappingRule = {
  id: string;
  when: { outcome: OutcomeRef };
  then: {
    stage: string;
    notifyOwner: boolean;
    addTag: string | null;
  };
  enabled: boolean;
};

export type SegmentScheduleRule = {
  id: string;
  segment: string;          // e.g. "Enterprise", "SMB", "Renewals"
  days: string[];           // ["mon","tue",...]
  open: string;             // "10:00"
  close: string;            // "16:00"
  timezone: string;
  enabled: boolean;
};

export type RetryPolicyRule = {
  id: string;
  outcome: OutcomeRef | "no_answer";
  delayHours: number;
  maxAttempts: number;
  enabled: boolean;
};

// Phase 4.3 — Inbox.

export type InboxItemKind = "hot_reply" | "crm_sync_failed" | "agent_error";
export type InboxItemStatus = "unread" | "read" | "resolved";

export type InboxItem = {
  id: string;
  kind: InboxItemKind;
  title: string;
  summary: string;
  createdAt: string;
  status: InboxItemStatus;
  assigneeEmail: string | null;
  meta: {
    leadName?: string;
    company?: string;
    callId?: string;
    error?: string;
  };
};

export type ActivityEvent = {
  id: string;
  type: "call.started" | "call.ended" | "lead.imported" | "campaign.launched" | "member.joined";
  at: string;
  message: string;
  meta?: Record<string, unknown>;
};

import { z } from "zod";

export const OutcomeSchema = z.enum([
  "meeting_booked",
  "callback_requested",
  "not_interested",
  "wrong_number",
  "voicemail",
  "opted_out",
  "other",
]);
export type Outcome = z.infer<typeof OutcomeSchema>;

export const SentimentSchema = z.enum(["positive", "neutral", "negative"]);
export type Sentiment = z.infer<typeof SentimentSchema>;

export const WritebackStatusSchema = z.enum([
  "pending",
  "success",
  "failed",
  "abandoned",
]);
export type WritebackStatus = z.infer<typeof WritebackStatusSchema>;

export const CallStatusSchema = z.enum([
  "queued",
  "follow_up_scheduled",
  "dispatching",
  "dispatched",
  "ringing",
  "in_progress",
  "completed",
  "not_connected",
  "cancelled",
  "error",
]);
export type CallStatus = z.infer<typeof CallStatusSchema>;

export const AnalysisSchema = z.object({
  outcome: OutcomeSchema,
  sentiment: SentimentSchema,
  summary: z.string(),
  objectionsRaised: z.array(z.string()),
  followUpAction: z.string().nullable(),
  followUpDate: z.string().nullable(),
  score: z.number().min(0).max(10),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const TranscriptLineSchema = z.object({
  role: z.enum(["agent", "user"]),
  content: z.string(),
  timestamp: z.number().optional(),
});
export type TranscriptLine = z.infer<typeof TranscriptLineSchema>;

export const XyloCallSchema = z.object({
  _id: z.string(),
  orgId: z.string().optional(),
  phone: z.string(),
  prospectName: z.string().optional().default(""),
  company: z.string().optional().default(""),
  status: CallStatusSchema.or(z.string()).optional(),
  createdAt: z.string(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  durationSec: z.number().optional().default(0),
  transcript: z.array(TranscriptLineSchema).optional().default([]),
  recordingUrl: z.string().nullable().optional(),
  analysis: AnalysisSchema.nullable().optional(),
  crmWritebackStatus: WritebackStatusSchema.nullable().optional(),
  agentId: z.string().optional(),
  campaignId: z.string().nullable().optional(),
  outcome: z.string().optional(),
  sentiment: z.string().optional(),
});
export type XyloCall = z.infer<typeof XyloCallSchema>;

export const CallsListResponseSchema = z.object({
  calls: z.array(XyloCallSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type CallsListResponse = z.infer<typeof CallsListResponseSchema>;

export const AnalyticsSchema = z.object({
  totalCalls: z.number(),
  answered: z.number(),
  meetingsBooked: z.number(),
  avgDurationSec: z.number(),
  conversionRate: z.number(),
});
export type Analytics = z.infer<typeof AnalyticsSchema>;

export const RecordingResponseSchema = z.object({
  url: z.string().url(),
  durationSec: z.number(),
});
export type RecordingResponse = z.infer<typeof RecordingResponseSchema>;

// Mirrors XyloKb model (api-gateway/src/models/xylo-kb.model.ts).
export const KbProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.string(),
  pitch: z.string(),
});
export const KbObjectionSchema = z.object({
  objection: z.string(),
  response: z.string(),
});
export const KbCaseStudySchema = z.object({
  customer: z.string(),
  outcome: z.string(),
  metric: z.string(),
});
export const KbFaqSchema = z.union([
  z.object({ question: z.string(), answer: z.string() }),
  z
    .object({ q: z.string(), a: z.string() })
    .transform((v) => ({ question: v.q, answer: v.a })),
]);

export const KnowledgeBaseSchema = z.object({
  orgId: z.string(),
  products: z.array(KbProductSchema),
  objections: z.array(KbObjectionSchema),
  caseStudies: z.array(KbCaseStudySchema),
  faqs: z.array(KbFaqSchema),
  competitorNotes: z.string(),
  pricingNotes: z.string(),
  qualifyingQuestions: z.array(z.string()),
  doNotMention: z.array(z.string()),
  updatedAt: z.string().default(""),
});
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
export type KbProduct = z.infer<typeof KbProductSchema>;
export type KbObjection = z.infer<typeof KbObjectionSchema>;
export type KbCaseStudy = z.infer<typeof KbCaseStudySchema>;
export type KbFaq = z.infer<typeof KbFaqSchema>;

// Mirrors XyloConfig (api-gateway/src/models/xylo-config.model.ts).
export const RetellLanguageSchema = z.string();

export const AgentVoiceSchema = z.object({
  voiceId: z.string(),
  language: RetellLanguageSchema,
  speed: z.number(),
});

export const AgentLlmSchema = z.object({
  model: z.string().optional(),
  systemPrompt: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

export const CallRulesSchema = z.object({
  maxAttemptsPerLead: z.number(),
  retryAfterNotConnectedHours: z.number(),
  dedupeWindowHours: z.number(),
  crmWritebackMaxAttempts: z.number(),
});

export const BusinessHoursWindowSchema = z.object({
  days: z.array(z.string()),
  open: z.string(),
  close: z.string(),
});

export const BusinessHoursSchema = z.object({
  timezone: z.string().default(""),
  schedule: z.array(BusinessHoursWindowSchema).default([]),
  is24x7: z.boolean().default(false),
});

export const AgentConfigSchema = z.object({
  orgId: z.string(),
  enabled: z.boolean(),
  objective: z.string(),
  crmProvider: z.string(),
  agent: z.object({
    retellAgentId: z.string(),
    retellLlmId: z.string(),
    retellKnowledgeBaseId: z.string().nullable(),
    name: z.string(),
    fromNumber: z.string(),
    voice: AgentVoiceSchema.optional(),
    llm: AgentLlmSchema.optional(),
  }),
  businessHours: BusinessHoursSchema,
  callRules: CallRulesSchema,
  stageMapping: z.object({
    pipelineId: z.string().nullable(),
    newStageId: z.string().nullable(),
    onAppointmentScheduledStageId: z.string().nullable(),
    onFollowUpStageId: z.string().nullable(),
    onNoAnswerStageId: z.string().nullable(),
    onClosedLostStageId: z.string().nullable(),
    onInvalidContactStageId: z.string().nullable(),
    onDoNotContactStageId: z.string().nullable(),
  }),
  createdAt: z.string().default(""),
  updatedAt: z.string().default(""),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type CallRules = z.infer<typeof CallRulesSchema>;
export type BusinessHours = z.infer<typeof BusinessHoursSchema>;

// Mirrors api-gateway OrganizationsService.getOrganizationWithProducts() and
// the embedded `user.organization` in /auth/session. The session variant exposes
// `id`; the direct /organizations/:id endpoint exposes `_id` (Mongo). We accept
// either and normalize to `id`.
export const ProductToggleSchema = z.object({ enabled: z.boolean() });
export type ProductToggle = z.infer<typeof ProductToggleSchema>;

export const OrganizationSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    website: z.string().optional().default(""),
    industry: z.string().optional().default(""),
    description: z.string().optional().default(""),
    ownerRole: z.string().optional().default(""),
    customerSegment: z.string().optional().default(""),
    icps: z.array(z.string()).optional().default([]),
    icpLocations: z.array(z.string()).optional().default([]),
    productOrServiceSummary: z.string().optional().default(""),
    salesMotion: z.string().optional().default(""),
    salesChannel: z.string().optional().default(""),
    pricingNote: z.string().optional().default(""),
    enabledProducts: z.record(z.string(), ProductToggleSchema).default({}),
  })
  .transform((o) => ({ ...o, id: (o.id ?? o._id) as string }));
export type Organization = z.infer<typeof OrganizationSchema>;

// Mirrors the user document returned by /auth/users (api-gateway
// AuthService.findAllByOrg). The Mongo user has no `name`, `lastActiveAt`,
// `invitedAt`, or `status` — surface what's actually there.
export const MemberSchema = z.object({
  _id: z.string(),
  email: z.string(),
  role: z.enum(["owner", "admin", "member", "viewer"]),
  organizationId: z.string().optional(),
  credits: z.number().optional(),
  isEmailVerified: z.boolean().optional(),
  isOrganizationEmailVerified: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

export const MembersResponseSchema = z.object({
  members: z.array(MemberSchema),
  total: z.number(),
});
export type MembersResponse = z.infer<typeof MembersResponseSchema>;

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  credits: z.number().optional(),
  organizationId: z.string().nullable().optional(),
  role: z.enum(["owner", "admin", "member", "viewer"]).nullable().optional(),
  organization: OrganizationSchema.nullable().optional(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

export const SessionResponseSchema = z.object({
  user: SessionUserSchema,
  issued_at: z.number().optional(),
  expires_at: z.number().optional(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

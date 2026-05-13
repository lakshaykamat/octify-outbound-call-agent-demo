// Static config / KB content. Volume-agnostic; doesn't need a seed.

import type { AgentConfig, AgentScript, AgentVersion, KnowledgeBase, VoiceOption } from "./types";

export function staticAgentScript(): AgentScript {
  return {
    opening:
      "Hey {{firstName}}, this is Xylo calling from Octify Technologies. Sorry to catch you out of the blue — do you have ninety seconds for me to share why I'm calling, and then you can tell me if it's worth a longer chat?",
    qualification:
      "Quick context — we work with revenue teams on outbound voice. Just to make sure I'm not wasting your time: are you the person who'd evaluate AI calling tools at {{company}}, or is that someone else on the team?",
    pitch:
      "What teams like yours tell us is that the meaningful lift isn't dials per hour — it's how fast every conversation lands in HubSpot with the right next step queued up. That's what Xylo does. Most teams see a 25–35% lift on booked meetings inside six weeks.",
    objections:
      "Totally fair. The fastest way to know if it's real is to hear thirty seconds of a live call and look at the CRM record it writes. Could I send a short recording and a sample writeback, and we can go from there?",
    close:
      "Okay — what I'd love to do is grab twenty minutes on your calendar with one of our solution AEs to walk through your stack and show a live call. I have Thursday 10am or Friday 2pm Pacific — which works better?",
  };
}

export function staticVoiceOptions(): VoiceOption[] {
  const wave = (seed: number, density = 32) =>
    Array.from({ length: density }, (_, i) => {
      const s = Math.sin((i + 1) * (seed * 0.37));
      const c = Math.cos((i + 1) * (seed * 0.21 + 1.3));
      return Math.max(0.12, Math.min(1, Math.abs(s * 0.6 + c * 0.4)));
    });
  return [
    { id: "11labs-clara",  name: "Clara",  accent: "US · West Coast",   gender: "female",  tone: "Warm, decisive",         waveform: wave(1) },
    { id: "11labs-marcus", name: "Marcus", accent: "US · Mid-Atlantic", gender: "male",    tone: "Polished, formal",       waveform: wave(2) },
    { id: "11labs-sienna", name: "Sienna", accent: "US · Southern",     gender: "female",  tone: "Familiar, casual",       waveform: wave(3) },
    { id: "11labs-arjun",  name: "Arjun",  accent: "UK · London",       gender: "male",    tone: "Crisp, professional",    waveform: wave(4) },
    { id: "11labs-ines",   name: "Inés",   accent: "ES · Madrid",       gender: "female",  tone: "Bright, energetic",      waveform: wave(5) },
    { id: "11labs-river",  name: "River",  accent: "US · Pacific NW",   gender: "neutral", tone: "Measured, neutral",      waveform: wave(6) },
  ];
}

export function staticAgentVersions(): AgentVersion[] {
  const script = staticAgentScript();
  const earlier = {
    ...script,
    pitch:
      "We help revenue teams book more meetings with outbound AI calling. Most teams see a meaningful lift in the first month.",
    close:
      "Could I send some materials and circle back next week to find a time?",
  };
  return [
    {
      id: "ver_04",
      label: "v4 · Sharper pitch + softer close",
      createdAt: "2026-05-10T14:11:00.000Z",
      author: "noor@motornexo.com",
      note: "Tightened the value prop, swapped close to a concrete two-slot ask.",
      snapshot: {
        name: "Xylo · Octify SDR",
        objective:
          "Qualify inbound leads, surface budget and timeline, and book a 20-min discovery call with an AE when the lead is decision-maker and budget is confirmed.",
        voiceId: "11labs-clara",
        speed: 1.02,
        temperature: 0.4,
        script,
      },
    },
    {
      id: "ver_03",
      label: "v3 · Pre-rewrite pitch",
      createdAt: "2026-05-04T09:24:00.000Z",
      author: "ravi@motornexo.com",
      note: "Working draft before the pitch rewrite.",
      snapshot: {
        name: "Xylo · Octify SDR",
        objective:
          "Qualify inbound leads and offer a discovery call where it fits.",
        voiceId: "11labs-clara",
        speed: 1.00,
        temperature: 0.4,
        script: earlier,
      },
    },
    {
      id: "ver_02",
      label: "v2 · First production cut",
      createdAt: "2026-04-22T16:02:00.000Z",
      author: "owner@motornexo.com",
      note: "Promoted from staging.",
      snapshot: {
        name: "Xylo · Octify SDR",
        objective:
          "Qualify inbound leads and offer a discovery call where it fits.",
        voiceId: "11labs-clara",
        speed: 1.00,
        temperature: 0.5,
        script: earlier,
      },
    },
  ];
}

export function staticAgentConfig(orgId: string): AgentConfig {
  return {
    orgId,
    enabled: true,
    objective: "Qualify inbound leads, surface budget and timeline, and book a 20-min discovery call with an AE when the lead is decision-maker and budget is confirmed.",
    crmProvider: "hubspot",
    agent: {
      retellAgentId: "agent_01HXC7M3PQR8V2N4",
      retellLlmId: "llm_01HXC7M5T9K2B6X8",
      retellKnowledgeBaseId: "kb_01HXC8N2P6T4M7W9",
      name: "Xylo · Octify SDR",
      fromNumber: "+14155551217",
      voice: { voiceId: "11labs-clara", language: "en-US", speed: 1.02 },
      llm: {
        model: "claude-sonnet-4-6",
        systemPrompt: "You are Xylo, an outbound SDR for Octify Technologies. Be warm, brief, and specific. Ask one question at a time. If the contact is a decision-maker and confirms budget, offer the calendar and book the meeting. If they object, surface one rebuttal from the KB, then accept the answer. Never promise pricing not present in the KB.",
        temperature: 0.4,
        maxTokens: 800,
      },
    },
    businessHours: {
      timezone: "America/Los_Angeles",
      is24x7: false,
      schedule: [
        { days: ["mon", "tue", "wed", "thu", "fri"], open: "09:00", close: "18:00" },
        { days: ["sat"], open: "10:00", close: "14:00" },
      ],
    },
    callRules: {
      maxAttemptsPerLead: 3,
      retryAfterNotConnectedHours: 18,
      dedupeWindowHours: 24,
      crmWritebackMaxAttempts: 3,
    },
    stageMapping: {
      pipelineId: "pipeline_inbound_2026",
      newStageId: "stage_new",
      onAppointmentScheduledStageId: "stage_meeting_booked",
      onFollowUpStageId: "stage_follow_up",
      onNoAnswerStageId: "stage_no_answer",
      onClosedLostStageId: "stage_closed_lost",
      onInvalidContactStageId: "stage_invalid",
      onDoNotContactStageId: "stage_dnc",
    },
    createdAt: "2025-09-20T08:00:00.000Z",
    updatedAt: "2026-05-10T14:11:00.000Z",
  };
}

export function staticKnowledgeBase(orgId: string): KnowledgeBase {
  return {
    orgId,
    updatedAt: "2026-05-09T17:22:00.000Z",
    products: [
      { name: "Groovo Suite", description: "Voice + chat + CRM-writeback for revenue teams. Connects to HubSpot, Salesforce, and Pipedrive.", price: "$1,200 / month", pitch: "Cut inbound response time from hours to under sixty seconds, with every call summarised in your CRM before the rep opens the lead." },
      { name: "Xylo Voice",   description: "Outbound SDR voice agent with calendar + CRM writeback. Built on Retell + Claude.",               price: "$600 / month per seat", pitch: "An SDR that never sleeps, never forgets the talk track, and books meetings while your reps are heads-down." },
      { name: "RevPilot",     description: "Pipeline scoring + deal coaching for AEs. Surfaces stalled deals, predicts close dates.",         price: "$280 / month per AE",   pitch: "Stop guessing which deals are real. RevPilot reads every email and call so you can forecast in minutes, not days." },
    ],
    objections: [
      { objection: "We already use a competing tool.", response: "Totally fair. Most teams who switch tell us Xylo writes back into CRM in ninety seconds rather than the next morning — would a fifteen-minute side-by-side help you see the difference?" },
      { objection: "We don't have budget right now.",  response: "Understood. Could I send a one-pager and circle back at the start of next quarter when budgets reset?" },
      { objection: "I'm not the right person.",         response: "No problem — who on your team owns inbound SDR tooling? I'd love to send them a short note with your context." },
      { objection: "It sounds robotic.",                response: "I hear that a lot. Reps tell us prospects can't tell within the first thirty seconds — would you mind if I sent a thirty-second recording so you can hear for yourself?" },
      { objection: "Security / compliance is a blocker.", response: "We're SOC 2 Type II, HIPAA-eligible, and your data never leaves your region. Happy to send the trust packet." },
    ],
    caseStudies: [
      { customer: "Ferris Wheel Fintech", outcome: "Booked 31% more discovery calls in the first 6 weeks", metric: "+31% discovery calls, ROI in 9 weeks" },
      { customer: "Northwind Logistics",  outcome: "Replaced two contracted SDRs and saved $186k / year",   metric: "$186k saved · 4.1× meetings per dollar" },
      { customer: "Atlas Health",         outcome: "Cut inbound first-touch from 4h to 38s while staying HIPAA-eligible", metric: "38-second first touch, 0 compliance incidents" },
    ],
    faqs: [
      { question: "Which CRMs do you support?",      answer: "HubSpot, Salesforce, Pipedrive, and Close are supported today. Custom connectors are available on the Scale plan." },
      { question: "Can the agent call internationally?", answer: "Yes — Xylo supports outbound calls to 48 countries. Per-minute rates vary by destination." },
      { question: "How long does setup take?",        answer: "Most teams are live within two business days. Onboarding includes a guided KB build and a calibration call." },
      { question: "Is the conversation recorded?",    answer: "Calls are recorded only where local law permits, and we honour two-party consent automatically. Recordings live in your tenant for 30 days." },
    ],
    competitorNotes: "Air.ai prioritises volume; we win on CRM-writeback quality and Claude-grade reasoning. Bland is cheaper per minute; we beat them on meeting-booked conversion and timezone safety. Salesloft Cadence has no voice; we complement, not replace.",
    pricingNotes: "Quote list price. Discounting requires AE approval above 10%. Annual prepay unlocks 12% off. No discount on Trial. Never mention internal margin or unit cost.",
    qualifyingQuestions: [
      "Are you the person who owns inbound SDR tooling at your company?",
      "Roughly how many inbound leads does your team handle per week?",
      "What does your team use to follow up on inbound leads today?",
      "What's the average response time on a new inbound lead right now?",
      "If we could cut that response time to under a minute, would you want to see a live demo?",
    ],
    doNotMention: [
      "internal model names or providers",
      "ongoing legal disputes",
      "specific named competitors unless the prospect names them first",
      "the names of other customers beyond the published case studies",
    ],
  };
}

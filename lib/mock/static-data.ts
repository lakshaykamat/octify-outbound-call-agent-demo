// Static config / KB content. Volume-agnostic; doesn't need a seed.

import type { AgentConfig, AgentScript, AgentVersion, KnowledgeBase, VoiceOption } from "./types";

export function staticAgentScript(): AgentScript {
  return {
    opening:
      "Hey {{firstName}}, this is Xylo calling from MotorNexo. Quick one — do you have ninety seconds for me to share why I'm calling, and then you can tell me if it's worth a longer chat?",
    qualification:
      "We work with dealerships, collision centers, and independent shops in {{region}}. Just so I'm not wasting your time — are you the person who looks after parts inventory or sourcing at {{company}}, or is that someone else on the team?",
    pitch:
      "Two things teams like yours tell us: aged parts sitting on the shelf are frozen capital, and hard-to-source SKUs hold bays hostage for days. MotorNexo turns the first into cash and shortens the second — it's a verified B2B marketplace across dealers, body shops, and service centers. It's free to use, and most members move their first aged-inventory dollars within two weeks.",
    objections:
      "Totally fair. The fastest way to know whether it fits is to see your aged-inventory snapshot in MotorNexo and run one live search against the network. Could I grab fifteen minutes with you to walk through it on your real SKUs?",
    close:
      "Okay — I'd love to book a quick fifteen-to-twenty minute demo so we can pull your data in and show you the moves in real time. I have Thursday 10am or Friday 2pm Pacific — which works better?",
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
      "MotorNexo is a B2B parts marketplace — you can move aged inventory and source hard-to-find parts in one place. It's free to use.",
    close:
      "Could I send a one-pager and circle back next week to find a time?",
  };
  return [
    {
      id: "ver_04",
      label: "v4 · Sharper aged-inventory pitch",
      createdAt: "2026-05-10T14:11:00.000Z",
      author: "noor@motornexo.com",
      note: "Tightened the dual seller/buyer value prop, added two-slot close.",
      snapshot: {
        name: "Xylo · MotorNexo SDR",
        objective:
          "Qualify decision-makers at dealerships, body shops, and service centers, surface aged-inventory or sourcing pain, and book a 15–20 min product demo with a MotorNexo specialist.",
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
      note: "Working draft before the dual-angle rewrite.",
      snapshot: {
        name: "Xylo · MotorNexo SDR",
        objective: "Qualify shops and dealers and offer a demo where it fits.",
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
        name: "Xylo · MotorNexo SDR",
        objective: "Qualify shops and dealers and offer a demo where it fits.",
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
    objective:
      "Qualify decision-makers at dealerships, body shops, and service centers in California, surface aged-inventory or hard-to-source pain, and book a 15–20 min product demo with a MotorNexo specialist when interest is real.",
    crmProvider: "hubspot",
    agent: {
      retellAgentId: "agent_01HXC7M3PQR8V2N4",
      retellLlmId: "llm_01HXC7M5T9K2B6X8",
      retellKnowledgeBaseId: "kb_01HXC8N2P6T4M7W9",
      name: "Xylo · MotorNexo SDR",
      fromNumber: "+16193042264",
      voice: { voiceId: "11labs-clara", language: "en-US", speed: 1.02 },
      llm: {
        model: "claude-sonnet-4-6",
        systemPrompt:
          "You are Xylo, an outbound SDR for MotorNexo — a verified B2B auto parts marketplace. Be warm, brief, and specific. Ask one question at a time. Tailor the angle to the listener: dealerships and dealer groups care about moving aged or excess parts; body shops and service centers care about sourcing scarce OEM parts fast. If the contact is a decision-maker (parts manager, fixed ops director, GM, dealer principal, service manager, shop owner), surface one pain point and offer the calendar to book a 15–20 min demo. Never quote commissions, transaction economics, or internal pricing — defer to the demo. Never name specific competitors unless the prospect names them first.",
        temperature: 0.4,
        maxTokens: 800,
      },
    },
    businessHours: {
      timezone: "America/Los_Angeles",
      is24x7: false,
      schedule: [
        { days: ["mon", "tue", "wed", "thu", "fri"], open: "10:00", close: "12:00" },
        { days: ["mon", "tue", "wed", "thu", "fri"], open: "14:00", close: "17:00" },
      ],
    },
    callRules: {
      maxAttemptsPerLead: 3,
      retryAfterNotConnectedHours: 18,
      dedupeWindowHours: 24,
      crmWritebackMaxAttempts: 3,
    },
    stageMapping: {
      pipelineId: "pipeline_motornexo_outbound_2026",
      newStageId: "stage_new",
      onAppointmentScheduledStageId: "stage_demo_booked",
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
      {
        name: "Inventory",
        description:
          "Upload, manage, and monitor aged or obsolete parts. Velocity and risk scoring surface the SKUs costing you carrying cost every day they sit on the shelf.",
        price: "Free to use",
        pitch:
          "Turn frozen capital into cash. Most sellers move their first aged-inventory dollars within two weeks of listing.",
      },
      {
        name: "Marketplace",
        description:
          "Search supplier inventory across the verified MotorNexo network, compare availability and condition, and purchase directly from other members.",
        price: "Free to use",
        pitch:
          "Fewer bays go cold. Buyers find hard-to-source OEM parts in minutes instead of chasing four dealers by phone.",
      },
      {
        name: "Orders",
        description:
          "Track every purchase and sale with full transaction history, status, and writeback to your DMS or shop management system.",
        price: "Free to use",
        pitch:
          "One place for every MotorNexo transaction — your fixed ops director sees the trail without chasing emails.",
      },
      {
        name: "Backorders",
        description:
          "Create and monitor demand for unavailable SKUs. We watch the network and notify you the moment a verified seller lists it.",
        price: "Free to use",
        pitch:
          "Stop calling around for that one part. Post the backorder and let the network find you the moment supply shows up.",
      },
    ],
    objections: [
      {
        objection: "We already have suppliers we're happy with.",
        response:
          "Totally fair — MotorNexo isn't a replacement, it's a second tap. Use your primary suppliers as usual; we step in when something's backordered or you have excess to move. Would you be open to a fifteen-minute walkthrough on your real SKUs?",
      },
      {
        objection: "We don't have aged inventory to sell.",
        response:
          "Most shops we talk to discover 8–12% of their parts haven't moved in 180 days once we run the report. Could I pull a free aged-inventory snapshot for you so you can see for yourself?",
      },
      {
        objection: "We can't trust an unknown supplier on parts.",
        response:
          "Every seller is dealership- or shop-verified before they list, with location, license, and rating visible on every SKU. Happy to walk through our verification process on a quick call.",
      },
      {
        objection: "I don't have time to learn a new tool.",
        response:
          "Most parts managers are up and running in twenty minutes — upload a CSV from your DMS and the system handles the rest. No replatforming required.",
      },
      {
        objection: "Sounds expensive.",
        response:
          "Actually MotorNexo is free for buyers and sellers — no subscription, no listing fees. Worth fifteen minutes to see what's possible at zero cost?",
      },
      {
        objection: "I'm not the right person.",
        response:
          "No problem — who on your team owns parts inventory or sourcing? I'd love to send them a short note with your context.",
      },
      {
        objection: "Send me an email.",
        response:
          "Happy to. To make it useful, do you lean more toward selling aged stock or sourcing hard-to-find parts? I'll tailor what I send.",
      },
    ],
    caseStudies: [
      {
        customer: "Valley Ford Group (4 rooftops)",
        outcome: "Moved $182k of aged parts inventory in the first 90 days",
        metric: "$182k recovered · 23% aged-stock reduction in Q1",
      },
      {
        customer: "Coastline Collision Centers (7 locations)",
        outcome: "Cut hard-to-source OEM part wait time from 4.2 days to 14 hours",
        metric: "14-hour average sourcing time · 91% bay availability",
      },
      {
        customer: "Sunset Auto Service (6 bays, 3 locations)",
        outcome: "Found a discontinued ECU through the network in 38 minutes",
        metric: "Zero rental car days on that job — saved $640 in customer credit",
      },
    ],
    faqs: [
      {
        question: "How is MotorNexo free to use?",
        answer:
          "Buyers and sellers don't pay subscriptions or listing fees. We're focused on growing the verified network first — defer commercial detail to a demo.",
      },
      {
        question: "Who's allowed to buy and sell on MotorNexo?",
        answer:
          "Verified franchised dealerships, body shops, collision centers, and multi-location independent service centers. Every member is verified before they can list or purchase.",
      },
      {
        question: "Do I need to replace my DMS or shop management system?",
        answer:
          "No. MotorNexo runs alongside your existing systems. You can upload aged-inventory CSVs from CDK, Reynolds, Tekion, Mitchell 1, and most major DMS exports.",
      },
      {
        question: "What regions do you serve today?",
        answer:
          "California first — Los Angeles, San Diego, and the surrounding markets. We expand to a new region when seller density crosses a threshold.",
      },
      {
        question: "What kinds of parts move on the marketplace?",
        answer:
          "OEM mechanical, collision and body panels, electrical and ECUs, and increasingly EV-specific parts. We're strongest on common North American and European brands.",
      },
      {
        question: "How long does setup take?",
        answer:
          "Most accounts are live the same day. The verification check usually takes under an hour; uploading aged inventory is a single CSV step.",
      },
    ],
    competitorNotes:
      "Don't name specific competitors unless the prospect names them first. If they do: MotorNexo is verified-network-first (every seller is checked before listing) and dealer + shop + collision in one tap, versus dealer-only or shop-only point solutions. We're free; pure marketplaces that charge listing fees tend to under-serve aged inventory.",
    pricingNotes:
      "MotorNexo is free to use for buyers and sellers. Do NOT discuss commissions, transaction economics, internal pricing, or revenue model on the call — those questions belong in the demo. If pressed, say: \"We keep commercial detail for the demo, but the platform itself is free to use.\"",
    qualifyingQuestions: [
      "Are you the person who owns parts inventory or sourcing at your shop or dealership?",
      "Roughly how much aged or excess inventory is sitting on the shelf today?",
      "How often do you hit a part you can't source within 24 hours?",
      "How are you handling aged stock or backorders today — phone calls, broker, or auctions?",
      "If you could turn aged inventory into cash and shorten sourcing time in one place, would you want a 15-minute walkthrough?",
    ],
    doNotMention: [
      "commissions, transaction economics, or revenue model",
      "internal pricing details or supplier terms",
      "specific named competitors unless the prospect names them first",
      "names of customers beyond the published case studies",
      "internal model names, providers, or infrastructure",
      "ongoing legal or compliance matters",
    ],
  };
}

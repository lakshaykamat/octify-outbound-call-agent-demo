import type { Rng } from "../rng";
import type { Lead, XyloCall, Analysis, TranscriptLine, Outcome } from "../types";
import {
  durationFor, qualityScore, rollDialResult, sentimentFor,
} from "../distributions";
import {
  FOLLOW_UP_ACTIONS, OBJECTION_TAGS,
  TRANSCRIPT_AGENT_CLOSE_BOOKED, TRANSCRIPT_AGENT_CLOSE_LOST,
  TRANSCRIPT_BOOK_BUYER, TRANSCRIPT_BOOK_SELLER,
  TRANSCRIPT_OPENERS_BUYER, TRANSCRIPT_OPENERS_SELLER,
  TRANSCRIPT_USER_INTERESTED, TRANSCRIPT_USER_OBJECTION,
} from "../data/pools";

function isSeller(lead: Lead): boolean {
  return lead.industry.includes("Dealership");
}

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function makeTranscript(rng: Rng, lead: Lead, outcome: Outcome | null): TranscriptLine[] {
  const first = lead.firstName;
  const domain = (lead.email.split("@")[1] ?? "").trim() || "example.com";
  const day = rng.pick(["Tuesday", "Wednesday", "Thursday", "Friday"]);
  const vars = { first, company: lead.company, domain, day };
  const openers = isSeller(lead) ? TRANSCRIPT_OPENERS_SELLER : TRANSCRIPT_OPENERS_BUYER;
  const bookPitch = isSeller(lead) ? TRANSCRIPT_BOOK_SELLER : TRANSCRIPT_BOOK_BUYER;

  if (outcome === null) {
    return [
      { role: "agent", content: fill(rng.pick(openers), vars) },
      { role: "agent", content: "[no answer]" },
    ];
  }
  if (outcome === "voicemail") {
    return [
      { role: "agent", content: "[voicemail tone]" },
      { role: "agent", content: `Hi ${first}, this is Xylo calling on behalf of MotorNexo. I'll try again tomorrow — feel free to call us back at 619-304-2264.` },
    ];
  }
  if (outcome === "wrong_number") {
    return [
      { role: "agent", content: fill(rng.pick(openers), vars) },
      { role: "user", content: "You have the wrong number." },
      { role: "agent", content: "Apologies — I'll remove this contact. Have a good day." },
    ];
  }
  const interested = outcome === "meeting_booked" || outcome === "callback_requested";
  const userTurn = interested ? rng.pick(TRANSCRIPT_USER_INTERESTED) : rng.pick(TRANSCRIPT_USER_OBJECTION);
  const close = interested ? rng.pick(TRANSCRIPT_AGENT_CLOSE_BOOKED) : rng.pick(TRANSCRIPT_AGENT_CLOSE_LOST);
  return [
    { role: "agent", content: fill(rng.pick(openers), vars) },
    { role: "user", content: userTurn },
    { role: "agent", content: fill(rng.pick(bookPitch), vars) },
    { role: "user", content: interested ? rng.pick(TRANSCRIPT_USER_INTERESTED) : rng.pick(TRANSCRIPT_USER_OBJECTION) },
    { role: "agent", content: fill(close, vars) },
  ];
}

function summarise(rng: Rng, lead: Lead, outcome: Outcome): string {
  const role = lead.title ? lead.title.toLowerCase() : "operations";
  const seller = isSeller(lead);
  switch (outcome) {
    case "meeting_booked":
      return seller
        ? `${lead.firstName} (${role}) agreed to a 15-minute marketplace walkthrough. Confirmed aged-parts shelf is a problem; wants to see SKU velocity reporting.`
        : `${lead.firstName} (${role}) agreed to a 15-minute demo on OEM sourcing speed. Currently waiting on backorders — open to a faster channel.`;
    case "callback_requested":
      return `${lead.firstName} asked for a callback. Interested but needs to align with the ${seller ? "parts manager / fixed ops" : "owner / shop manager"} first.`;
    case "not_interested":
      return `Prospect declined — ${rng.pick([
        "already moves aged stock through auction",
        "captive OEM distributor handles all parts",
        "long-time supplier, not looking",
        "tried a locator service before, didn't stick",
        "no aged inventory to monetize",
      ])}.`;
    case "voicemail":
      return "Voicemail left. No callback received.";
    case "wrong_number":
      return "Number does not belong to lead. Removed from queue.";
    case "opted_out":
      return "Prospect requested to be added to do-not-contact list.";
    case "other":
      return "Brief conversation. No clear outcome captured.";
  }
}

export function makeCall(
  rng: Rng,
  orgId: string,
  lead: Lead,
  agentId: string,
  startedAt: Date,
): XyloCall {
  const { connected, outcome } = rollDialResult(rng);
  const durationSec = durationFor(rng, outcome);
  const endedAt = new Date(startedAt.getTime() + durationSec * 1000);
  const sentiment = sentimentFor(rng, outcome);
  const score = qualityScore(rng, outcome);

  let analysis: Analysis | null = null;
  if (outcome && sentiment) {
    const objections = (outcome === "not_interested" || outcome === "opted_out")
      ? [rng.pick(OBJECTION_TAGS)]
      : [];
    const followUpAction = outcome === "meeting_booked" || outcome === "callback_requested"
      ? rng.pick(FOLLOW_UP_ACTIONS)
      : null;
    const followUpDate = followUpAction
      ? new Date(endedAt.getTime() + rng.int(1, 14) * 24 * 3600_000).toISOString().slice(0, 10)
      : null;
    analysis = {
      outcome,
      sentiment,
      summary: summarise(rng, lead, outcome),
      objectionsRaised: objections,
      followUpAction,
      followUpDate,
      score: Math.round(score * 10) / 10,
    };
  }

  return {
    _id: `call_${rng.uuid().slice(0, 16)}`,
    orgId,
    phone: lead.phone,
    prospectName: lead.fullName,
    company: lead.company,
    status: connected ? "completed" : "not_connected",
    createdAt: startedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSec,
    transcript: makeTranscript(rng, lead, outcome),
    recordingUrl: null,
    analysis,
    crmWritebackStatus: analysis ? rng.weighted([
      ["success", 88], ["pending", 8], ["failed", 4],
    ] as const) : null,
    agentId,
    campaignId: lead.campaignId,
  };
}

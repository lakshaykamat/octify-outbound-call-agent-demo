// Tuned generators that enforce the realistic-data targets from PLAN.md.
// Every call's outcome, sentiment, duration, quality score, and timing
// flows through here so downstream aggregates land in the documented bands.

import type { Outcome, Sentiment } from "./types";
import type { Rng } from "./rng";

// Outcome mix on dials that get past the no-answer roll. Calibrated to
// real-world B2B cold-outbound benchmarks: roughly 1-in-4 dials reach a live
// human, voicemail dominates the rest, and bad numbers are common on cold
// lists. Meeting-booked ~3% of all dials lands in the "strong AI SDR" band.
const OUTCOME_WEIGHTS: [Outcome, number][] = [
  ["voicemail", 30],          // ~17% of all dials
  ["not_interested", 20],     // ~12% — most live conversations end here
  ["wrong_number", 9],        // ~5% — cold B2B lists carry 6–12% bad numbers
  ["callback_requested", 7],  // ~4%
  ["meeting_booked", 5],      // ~3% — high-end AI SDR
  ["other", 4],               // ~2.5% — messy / inconclusive live calls
  ["opted_out", 3],           // ~1.8%
];

// "no-answer" is a CallStatus, not an Outcome — when an outcome doesn't apply
// we leave analysis null and durationSec ~0. We model that as a separate roll
// happening before outcome assignment. 42% matches typical ring-out rates on
// curated cold lists (unscrubbed lists run 55–65%).
const NO_ANSWER_RATE = 0.42;

export function rollDialResult(rng: Rng): { connected: boolean; outcome: Outcome | null } {
  if (rng.bool(NO_ANSWER_RATE)) return { connected: false, outcome: null };
  const outcome = rng.weighted(OUTCOME_WEIGHTS);
  return { connected: true, outcome };
}

// Call duration (seconds) by outcome — realistic shapes.
export function durationFor(rng: Rng, outcome: Outcome | null): number {
  // Ring-out: 4–6 rings ≈ 22–30s before the dialer gives up.
  if (outcome === null) return Math.max(6, Math.round(rng.gaussian(24, 6)));
  switch (outcome) {
    // Voicemails: tone + a clean 20–35s left-message script.
    case "voicemail":        return Math.max(10, Math.round(rng.gaussian(28, 7)));
    // Wrong number: opener, lead corrects, polite exit. Quick.
    case "wrong_number":     return Math.max(8, Math.round(rng.gaussian(18, 6)));
    // Opt-out: opener, do-not-contact request, acknowledge, hang up.
    case "opted_out":        return Math.max(12, Math.round(rng.gaussian(32, 10)));
    // Brush-off: opener, objection, agent attempts one save, ends. 30–80s.
    case "not_interested":   return Math.max(20, Math.round(rng.gaussian(55, 18)));
    // Callback request: short scheduling exchange. 60–130s.
    case "callback_requested": return Math.max(40, Math.round(rng.gaussian(95, 28)));
    // Inconclusive: gatekeeper transfers, partial pitches, etc.
    case "other":            return Math.max(25, Math.round(rng.gaussian(110, 50)));
    // Booked: full pitch + qualifying questions + slot picked. 3–7 min.
    case "meeting_booked":   return Math.max(120, Math.round(rng.gaussian(295, 55)));
  }
}

// Sentiment is correlated with outcome.
export function sentimentFor(rng: Rng, outcome: Outcome | null): Sentiment | null {
  if (!outcome) return null;
  if (outcome === "meeting_booked") {
    return rng.weighted([["positive", 80], ["neutral", 18], ["negative", 2]]);
  }
  if (outcome === "callback_requested") {
    return rng.weighted([["positive", 40], ["neutral", 55], ["negative", 5]]);
  }
  if (outcome === "not_interested" || outcome === "opted_out") {
    return rng.weighted([["positive", 5], ["neutral", 55], ["negative", 40]]);
  }
  // voicemail / wrong_number / other
  return rng.weighted([["positive", 10], ["neutral", 80], ["negative", 10]]);
}

// Quality score (0–10) — measures conversation/handling quality. Outcomes
// where no real conversation happened (voicemail, wrong#) score low because
// there's nothing to evaluate beyond delivery. Real conversations score
// higher when they ended well (booked, callback) and middling when they
// ended in a brush-off.
export function qualityScore(rng: Rng, outcome: Outcome | null): number {
  const clamp = (x: number) => Math.max(0, Math.min(10, x));
  if (!outcome) return clamp(rng.gaussian(3.5, 1.0));
  switch (outcome) {
    case "meeting_booked":     return clamp(rng.gaussian(8.6, 0.6));
    case "callback_requested": return clamp(rng.gaussian(7.4, 0.8));
    case "not_interested":     return clamp(rng.gaussian(6.1, 1.0));
    case "opted_out":          return clamp(rng.gaussian(4.8, 1.0));
    case "voicemail":          return clamp(rng.gaussian(3.9, 0.8));
    case "wrong_number":       return clamp(rng.gaussian(3.0, 0.7));
    case "other":              return clamp(rng.gaussian(5.6, 1.2));
  }
}

// Lead score (0–100) — normal around 55, slight high skew.
export function leadScore(rng: Rng): number {
  const raw = rng.gaussian(55, 18) + rng.gaussian(0, 6);
  return Math.max(1, Math.min(99, Math.round(raw)));
}

// Time-of-day multiplier for call volume. Models real B2B SDR rhythms:
// Sunday is dark, Saturday is near-dark (rare morning catch-up only),
// Mon ramps slowly, Tue–Thu carry the week with mid-morning and mid-afternoon
// peaks, Fri tapers hard after lunch. Universal lunch dip 12–1pm.
// dow: 0=Sun … 6=Sat. hour: 0–23.
export function activityMultiplier(dow: number, hour: number): number {
  // Sunday: SDR teams don't dial. Generate ~0 calls.
  if (dow === 0) return 0;
  // Saturday: occasional morning catch-up by individuals. Tiny volume.
  if (dow === 6) return hour >= 10 && hour <= 13 ? 0.08 : 0;

  // Outside business hours: a handful of stragglers only.
  if (hour < 8 || hour >= 19) return 0.02;

  // Lunch dip — applies to every weekday.
  if (hour === 12) return 0.4;
  if (hour === 13) return 0.6;

  // Monday: slow ramp, no afternoon power-peak. People settling in,
  // pipeline reviews, list scrubbing eats into dial time.
  if (dow === 1) {
    if (hour <= 9) return 0.35;
    if (hour <= 11) return 0.85;
    return 0.9;
  }

  // Friday: solid morning, sharp afternoon drop-off.
  if (dow === 5) {
    if (hour <= 9) return 0.7;
    if (hour <= 11) return 1.05;
    if (hour === 14) return 0.85;
    return 0.3;
  }

  // Tuesday–Thursday: the heavy lifting days.
  if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)) return 1.4;
  if (hour <= 9) return 0.6;
  return 1.0;
}

// One-off daily anomalies — holidays, campaign spikes, training days,
// post-holiday rebounds. Keyed by days-ago from "now" so the seeded demo
// tells the same story regardless of when it's loaded. These ride on top
// of the weekly rhythm so chart valleys/peaks aren't metronomic.
export function dailyAnomaly(daysAgo: number): number {
  switch (daysAgo) {
    case 3:  return 1.45;  // campaign launch — fresh list, everyone dialing
    case 7:  return 0.55;  // monthly all-hands / training half-day
    case 14: return 0.0;   // company holiday
    case 19: return 1.30;  // list refresh / quota push
    case 23: return 0.65;  // partial team out (snow / sick wave)
    case 30: return 1.20;  // start-of-month rebound
    case 38: return 0.0;   // federal holiday
    case 39: return 1.35;  // post-holiday rebound day
    case 52: return 0.45;  // company offsite afternoon
    case 65: return 1.25;  // quarter-mid push
    case 78: return 0.60;  // bad weather / regional outage
    default: return 1.0;
  }
}

// Weekly volume modifier — gentle WoW growth, a couple of soft weeks.
// weekIndex: 0 = most recent week, increasing into the past.
export function weekModifier(weekIndex: number): number {
  if (weekIndex === 6) return 0.72;   // soft week (post-holiday hangover)
  if (weekIndex === 11) return 0.65;  // pre-launch lull
  // ~6% drop per week into the past = ~6% WoW growth going forward.
  return Math.pow(0.94, weekIndex);
}

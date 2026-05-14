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
  ["voicemail", 36],
  ["not_interested", 26],
  ["wrong_number", 7],
  ["callback_requested", 9],
  ["meeting_booked", 7],
  ["other", 8],
  ["opted_out", 4],
];

const NO_ANSWER_RATE = 0.38;

export function rollDialResult(rng: Rng): { connected: boolean; outcome: Outcome | null } {
  if (rng.bool(NO_ANSWER_RATE)) return { connected: false, outcome: null };
  const outcome = rng.weighted(OUTCOME_WEIGHTS);
  return { connected: true, outcome };
}

// Call duration (seconds) by outcome, realistic shapes.
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

// Quality score (0–10), measures conversation/handling quality. Outcomes
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

// Lead score (0–100), normal around 55, slight high skew.
export function leadScore(rng: Rng): number {
  const raw = rng.gaussian(55, 18) + rng.gaussian(0, 6);
  return Math.max(1, Math.min(99, Math.round(raw)));
}

// Within-day shape only (relative weights). seed.ts renormalises these
// across the day so dayTarget stays consistent regardless of the shape.
export function activityMultiplier(dow: number, hour: number): number {
  if (hour < 8 || hour >= 19) return 0.08;

  // Weekends: flatter, AI runs lighter, no real lunch dip.
  if (dow === 0 || dow === 6) {
    if (hour <= 9) return 0.6;
    if (hour <= 11) return 1.0;
    if (hour === 12) return 0.75;
    if (hour <= 14) return 0.9;
    return 0.7;
  }

  if (hour === 12) return 0.55;
  if (hour === 13) return 0.75;

  if (dow === 1) {
    if (hour <= 9) return 0.6;
    if (hour <= 11) return 1.0;
    return 1.05;
  }

  if (dow === 5) {
    if (hour <= 9) return 0.85;
    if (hour <= 11) return 1.15;
    if (hour === 14) return 1.0;
    return 0.75;
  }

  if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)) return 1.2;
  if (hour <= 9) return 0.75;
  return 1.0;
}

// Day-of-week magnitude factor. AI dials every day but weekends are lighter.
export function dayOfWeekFactor(dow: number): number {
  switch (dow) {
    case 0: return 0.80;
    case 1: return 0.95;
    case 2: return 1.05;
    case 3: return 1.06;
    case 4: return 1.04;
    case 5: return 0.96;
    case 6: return 0.84;
    default: return 1.0;
  }
}

// Soft daily anomalies. No zero days (the chart is meant to look operational,
// not littered with company-holiday potholes). Range stays inside 0.85-1.15.
export function dailyAnomaly(daysAgo: number): number {
  switch (daysAgo) {
    case 3:  return 1.12;
    case 7:  return 0.92;
    case 14: return 0.88;
    case 19: return 1.10;
    case 23: return 0.93;
    case 30: return 1.08;
    case 38: return 0.90;
    case 39: return 1.10;
    case 52: return 0.94;
    case 65: return 1.07;
    case 78: return 0.92;
    default: return 1.0;
  }
}

// Gentle WoW drift. The chart should read as a steady operation, not a
// rollercoaster. ~1.5% drop per week into the past.
export function weekModifier(weekIndex: number): number {
  return Math.pow(0.985, weekIndex);
}

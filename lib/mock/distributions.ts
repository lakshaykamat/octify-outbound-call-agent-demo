// Tuned generators that enforce the realistic-data targets from PLAN.md.
// Every call's outcome, sentiment, duration, quality score, and timing
// flows through here so downstream aggregates land in the documented bands.

import type { Outcome, Sentiment } from "./types";
import type { Rng } from "./rng";

// Outcome mix on dials that get past the no-answer roll. Calibrated to
// real-world B2B cold-outbound benchmarks: ~35% live human pickups, ~30%
// voicemail, 3-5% meeting-booked, 6-8% callback. See dashboard funnel.
const OUTCOME_WEIGHTS: [Outcome, number][] = [
  ["voicemail", 30],
  ["not_interested", 18],
  ["callback_requested", 6],
  ["meeting_booked", 4],
  ["wrong_number", 3],
  ["opted_out", 2],
  ["other", 2],
];

// "no-answer" is a CallStatus, not an Outcome — when an outcome doesn't apply
// we leave analysis null and durationSec ~0. We model that as a separate roll
// happening before outcome assignment. 35% matches typical ring-out rates on
// unscrubbed cold lists.
const NO_ANSWER_RATE = 0.35;

export function rollDialResult(rng: Rng): { connected: boolean; outcome: Outcome | null } {
  if (rng.bool(NO_ANSWER_RATE)) return { connected: false, outcome: null };
  const outcome = rng.weighted(OUTCOME_WEIGHTS);
  return { connected: true, outcome };
}

// Call duration (seconds) by outcome — realistic shapes.
export function durationFor(rng: Rng, outcome: Outcome | null): number {
  if (outcome === null) return rng.int(8, 22);              // ring-out / no answer
  switch (outcome) {
    case "voicemail":        return rng.int(12, 28);
    case "wrong_number":     return rng.int(8, 30);
    case "opted_out":        return rng.int(15, 40);
    case "not_interested":   return Math.round(rng.gaussian(45, 15));
    case "callback_requested": return Math.round(rng.gaussian(90, 25));
    case "other":            return rng.int(30, 180);
    case "meeting_booked":   return Math.round(rng.gaussian(250, 40));   // ~4m10s mean
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

// Quality score (0–10) — mean 7.4, std-dev 1.2, clamped.
export function qualityScore(rng: Rng, outcome: Outcome | null): number {
  if (!outcome) return Math.max(0, Math.min(10, rng.gaussian(4.5, 1.5)));
  if (outcome === "meeting_booked") return Math.max(0, Math.min(10, rng.gaussian(8.5, 0.7)));
  if (outcome === "callback_requested") return Math.max(0, Math.min(10, rng.gaussian(7.2, 0.9)));
  if (outcome === "not_interested") return Math.max(0, Math.min(10, rng.gaussian(6.0, 1.1)));
  return Math.max(0, Math.min(10, rng.gaussian(5.5, 1.3)));
}

// Lead score (0–100) — normal around 55, slight high skew.
export function leadScore(rng: Rng): number {
  const raw = rng.gaussian(55, 18) + rng.gaussian(0, 6);
  return Math.max(1, Math.min(99, Math.round(raw)));
}

// Time-of-day multiplier for connect rate / call volume.
// Tue–Thu 10–11am and 2–4pm peak. Weekends ~10% volume.
// dow: 0=Sun … 6=Sat. hour: 0–23.
export function activityMultiplier(dow: number, hour: number): number {
  if (dow === 0 || dow === 6) return 0.1;
  if (hour < 8 || hour >= 19) return 0.05;
  const peak =
    (dow >= 2 && dow <= 4) &&
    ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16));
  if (peak) return 1.4;
  // Monday morning / Friday afternoon slump.
  if (dow === 1 && hour < 10) return 0.5;
  if (dow === 5 && hour >= 15) return 0.5;
  return 1.0;
}

// Weekly volume modifier — light noise, one bad week, one holiday dip.
export function weekModifier(weekIndex: number): number {
  // weekIndex: 0 = most recent week, increasing into the past.
  if (weekIndex === 5) return 0.6;   // holiday week
  if (weekIndex === 9) return 0.8;   // bad week
  // gentle growth: ~6% WoW going forward = ~6% drop per week into the past.
  return Math.pow(0.94, weekIndex);
}

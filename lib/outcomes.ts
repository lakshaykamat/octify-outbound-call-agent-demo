import type { Outcome, Sentiment } from "@/lib/api/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const OUTCOME_LABEL: Record<Outcome, string> = {
  meeting_booked: "Meeting booked",
  callback_requested: "Callback",
  not_interested: "Not interested",
  wrong_number: "Wrong number",
  voicemail: "Voicemail",
  opted_out: "Opted out",
  other: "Other",
};

const OUTCOME_BADGE: Record<Outcome, BadgeVariant> = {
  meeting_booked: "default",
  callback_requested: "secondary",
  voicemail: "outline",
  not_interested: "destructive",
  wrong_number: "outline",
  opted_out: "destructive",
  other: "outline",
};

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

const SENTIMENT_TONE: Record<Sentiment, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-muted-foreground",
  negative: "text-rose-600 dark:text-rose-400",
};

export const OUTCOME_OPTIONS: { value: Outcome; label: string }[] = (
  Object.keys(OUTCOME_LABEL) as Outcome[]
).map((value) => ({ value, label: OUTCOME_LABEL[value] }));

export function outcomeLabel(value: Outcome | null | undefined): string {
  return value ? OUTCOME_LABEL[value] : "—";
}

export function outcomeBadgeVariant(value: Outcome): BadgeVariant {
  return OUTCOME_BADGE[value];
}

export function sentimentLabel(value: Sentiment | null | undefined): string {
  return value ? SENTIMENT_LABEL[value] : "—";
}

export function sentimentTone(value: Sentiment | null | undefined): string {
  return value ? SENTIMENT_TONE[value] : "text-muted-foreground";
}

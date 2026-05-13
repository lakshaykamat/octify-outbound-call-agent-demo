import type { LeadSource, LeadStatus } from "@/lib/mock";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "queued", label: "Queued" },
  { value: "calling", label: "Calling" },
  { value: "completed", label: "Completed" },
  { value: "dnc", label: "DNC" },
];

export const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: "Website form", label: "Website form" },
  { value: "CSV import", label: "CSV import" },
  { value: "HubSpot sync", label: "HubSpot sync" },
  { value: "Apollo", label: "Apollo" },
  { value: "Manual", label: "Manual" },
];

const STATUS_VARIANT: Record<LeadStatus, BadgeVariant> = {
  new: "default",
  queued: "secondary",
  calling: "secondary",
  completed: "outline",
  dnc: "destructive",
};

export function leadStatusVariant(status: LeadStatus): BadgeVariant {
  return STATUS_VARIANT[status];
}

export function leadStatusLabel(status: LeadStatus): string {
  return LEAD_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

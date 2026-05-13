import type { Rng } from "../rng";
import type { Lead, LeadSource, LeadStatus } from "../types";
import { leadScore } from "../distributions";
import { LEAD_SOURCES, LEAD_STATUSES, NOTE_FRAGMENTS } from "../data/pools";
import { makeBusiness, makeCity, makeEmail, makePerson, makePhone, makeTitle } from "./identity";

// CRM-shaped source mix. CSV imports dominate any dealer outreach — most lists
// come from bought data or trade-show scans rather than inbound forms.
const SOURCE_WEIGHTS: [LeadSource, number][] = [
  ["CSV import", 38],
  ["Apollo", 22],
  ["HubSpot sync", 18],
  ["Website form", 14],
  ["Manual", 8],
];

// Status mix reflects a 90-day outbound program: most leads have been worked
// (completed), a long tail still in queue, a thin band currently dialing.
const STATUS_WEIGHTS: [LeadStatus, number][] = [
  ["completed", 52],
  ["new", 24],
  ["queued", 13],
  ["calling", 4],
  ["dnc", 7],
];

void LEAD_SOURCES; void LEAD_STATUSES;

export function makeLead(rng: Rng, orgId: string, createdAt: Date): Lead {
  const person = makePerson(rng);
  const city = makeCity(rng);
  const business = makeBusiness(rng, city, person);
  const source = rng.weighted(SOURCE_WEIGHTS);
  const status = rng.weighted(STATUS_WEIGHTS);

  return {
    id: `lead_${rng.uuid().slice(0, 16)}`,
    orgId,
    firstName: person.firstName,
    lastName: person.lastName,
    fullName: person.fullName,
    email: makeEmail(rng, person.firstName, person.lastName, business.domain),
    phone: makePhone(rng, city),
    company: business.name,
    title: makeTitle(rng, business.type),
    industry: business.industry,
    city: city.name,
    region: city.region,
    status,
    source,
    score: leadScore(rng),
    campaignId: null,
    lastTouchedAt: null,
    createdAt: createdAt.toISOString(),
    notes: rng.pick(NOTE_FRAGMENTS),
  };
}

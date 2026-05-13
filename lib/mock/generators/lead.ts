import type { Rng } from "../rng";
import type { Lead, LeadSource, LeadStatus } from "../types";
import { leadScore } from "../distributions";
import { LEAD_SOURCES, LEAD_STATUSES } from "../data/pools";
import { makeCity, makeCompany, makeEmail, makePerson, makePhone, makeTitle } from "./identity";

const SOURCE_WEIGHTS: [LeadSource, number][] = [
  ["Website form", 35],
  ["CSV import", 25],
  ["HubSpot sync", 20],
  ["Apollo", 12],
  ["Manual", 8],
];

const STATUS_WEIGHTS: [LeadStatus, number][] = [
  ["new", 28],
  ["queued", 14],
  ["calling", 6],
  ["completed", 47],
  ["dnc", 5],
];

void LEAD_SOURCES; void LEAD_STATUSES;

export function makeLead(rng: Rng, orgId: string, createdAt: Date): Lead {
  const person = makePerson(rng);
  const company = makeCompany(rng);
  const city = makeCity(rng);
  const source = rng.weighted(SOURCE_WEIGHTS);
  const status = rng.weighted(STATUS_WEIGHTS);

  return {
    id: `lead_${rng.uuid().slice(0, 16)}`,
    orgId,
    firstName: person.firstName,
    lastName: person.lastName,
    fullName: person.fullName,
    email: makeEmail(person.firstName, person.lastName, company.domain),
    phone: makePhone(rng),
    company: company.name,
    title: makeTitle(rng),
    industry: company.industry,
    city: city.city,
    region: city.region,
    status,
    source,
    score: leadScore(rng),
    campaignId: null,
    lastTouchedAt: null,
    createdAt: createdAt.toISOString(),
    notes: "",
  };
}

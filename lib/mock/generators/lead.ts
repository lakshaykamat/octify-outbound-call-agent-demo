import type { Rng } from "../rng";
import type { Lead, LeadSource, LeadStatus } from "../types";
import { leadScore } from "../distributions";
import { LEAD_SOURCES, LEAD_STATUSES, NOTE_FRAGMENTS } from "../data/pools";
import { makeBusiness, makeCity, makeEmail, makePerson, makePhone, makeTitle } from "./identity";
import type { BusinessType } from "../data/pools";

// Real prospect businesses imported from the Apex Capital CRM pull. Each row
// is a verified company (name + phone + address + ICP score); the contact-
// person name/email is synthesized on top during lead creation. When the
// import includes a real `contactTitle` we use it as-is, otherwise we
// synthesize from the business type.
export type SeedBusiness = {
  company: string;
  businessCategory: string;
  businessType: BusinessType;
  phone: string;
  address: string;
  city: string;
  region: string;
  icpScore: number;
  icpReasoning: string;
  sourceLabel: string;
  contactTitle?: string;
};

// CRM-shaped source mix. CSV imports dominate any owner/investor outreach,
// most lists come from bought data or industry-event scans rather than
// inbound forms.
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

// Slug a company name into a plausible domain, "Summit Capital Partners" ->
// "summit.com", by stripping common suffix words and trimming the result.
const DOMAIN_DROP_WORDS = [
  "capital partners", "realty group", "property management",
  "asset management", "investments", "real estate", "holdings",
  "equity partners", "family office", "ventures", "advisors", "commercial",
  "residential", "portfolio services", "management group",
  "real estate services", "realty advisors", "investment group",
  "multifamily management", "capital", "realty", "brokers", "partners",
  "group", "llc", "inc", "co",
];
function companyDomain(company: string): string {
  let s = company.toLowerCase();
  for (const w of DOMAIN_DROP_WORDS) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  }
  s = s.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "").trim();
  if (!s) s = "firm";
  if (s.length > 24) s = s.slice(0, 24);
  return `${s}.com`;
}

const INDUSTRY_BY_TYPE: Record<BusinessType, string> = {
  dealer: "Commercial Real Estate, Brokerage",
  body_shop: "Commercial Real Estate, Property Management",
  service: "Commercial Real Estate, Investment",
};

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

// Hydrate a real prospect business into a Lead. Phone, company, address,
// industry, and ICP score come from the source row; contact-person details
// (name, email, title) are synthesized so transcripts and email writebacks
// have something to render. Source label is preserved from the import.
export function makeLeadFromBusiness(
  rng: Rng,
  orgId: string,
  createdAt: Date,
  business: SeedBusiness,
): Lead {
  const person = makePerson(rng);
  const domain = companyDomain(business.company);
  const status = rng.weighted(STATUS_WEIGHTS);
  // Source mapping: real businesses came from a public-data pull, which we
  // surface as "CSV import" (the closest CRM-shaped label users recognize).
  const source: LeadSource = "CSV import";
  return {
    id: `lead_${rng.uuid().slice(0, 16)}`,
    orgId,
    firstName: person.firstName,
    lastName: person.lastName,
    fullName: person.fullName,
    email: makeEmail(rng, person.firstName, person.lastName, domain),
    phone: business.phone || makePhone(rng),
    company: business.company,
    title: business.contactTitle?.trim() || makeTitle(rng, business.businessType),
    industry: INDUSTRY_BY_TYPE[business.businessType],
    city: business.city,
    region: business.region,
    status,
    source,
    // ICP score from the import is on the 0-100 band, use it directly so
    // the dashboard's score filter pulls real prospect bands.
    score: business.icpScore,
    campaignId: null,
    lastTouchedAt: null,
    // Prefer the ICP reasoning when present, it's specific, actionable, and
    // exactly what an SDR would jot down as a research note.
    createdAt: createdAt.toISOString(),
    notes: business.icpReasoning || rng.pick(NOTE_FRAGMENTS),
  };
}

import type { Rng } from "../rng";
import {
  FIRST_NAMES, LAST_NAMES,
  COMPANY_PREFIXES, COMPANY_ROOTS, COMPANY_SUFFIXES,
  INDUSTRIES, TITLES, CITIES,
} from "../data/pools";

export function makePerson(rng: Rng) {
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

export function makeCompany(rng: Rng) {
  const prefix = rng.pick(COMPANY_PREFIXES);
  const root = rng.pick(COMPANY_ROOTS);
  const suffix = rng.bool(0.4) ? ` ${rng.pick(COMPANY_SUFFIXES)}` : "";
  const name = `${prefix}${root}${suffix}`;
  const domain = `${prefix.toLowerCase()}${root}.com`;
  const industry = rng.pick(INDUSTRIES);
  return { name, domain, industry };
}

export function makeTitle(rng: Rng) {
  return rng.pick(TITLES);
}

export function makeCity(rng: Rng) {
  const [city, region, lng, lat] = rng.pick(CITIES);
  return { city, region, lng, lat };
}

// US-shaped phone numbers — area codes 200–999, then 7 digits.
export function makePhone(rng: Rng) {
  const area = rng.int(201, 989);
  const mid = rng.int(200, 999);
  const last = rng.int(1000, 9999);
  return `+1${area}${mid}${last}`;
}

export function makeEmail(firstName: string, lastName: string, domain: string) {
  const handle = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "");
  return `${handle}@${domain}`;
}

import type { Rng } from "../rng";
import {
  AUTO_BRANDS, BODY_SHOP_TEMPLATES, BUSINESS_TYPE_WEIGHTS, CITIES,
  DEALER_TEMPLATES, EMAIL_PATTERN_WEIGHTS, FAMILY_NAMES, FIRST_NAMES,
  LAST_NAMES, PHONE_FORMAT_WEIGHTS, SERVICE_SHOP_TEMPLATES, TITLES_BY_TYPE,
  type BusinessType, type CityRecord,
} from "../data/pools";

export function makePerson(rng: Rng) {
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

export function makeCity(rng: Rng): CityRecord & { region: string } {
  const city = rng.pick(CITIES);
  return { ...city, region: city.state };
}

// MotorNexo's ICP: dealerships (sellers), body shops (buyers), service centers
// (buyers). Pick a business type, then build a realistic name from one of the
// templates for that type. Domain is slugged from the visible name minus
// brand/suffix words so it looks like a real dealer/shop website.
export function makeBusiness(rng: Rng, city: CityRecord, owner: { firstName: string; lastName: string }): {
  type: BusinessType;
  name: string;
  domain: string;
  industry: string;
} {
  const type = rng.weighted(BUSINESS_TYPE_WEIGHTS);
  const family = rng.pick(FAMILY_NAMES);
  const brand = rng.pick(AUTO_BRANDS);

  const templates =
    type === "dealer" ? DEALER_TEMPLATES
    : type === "body_shop" ? BODY_SHOP_TEMPLATES
    : SERVICE_SHOP_TEMPLATES;

  const tpl = rng.pick(templates);
  const name = tpl
    .replace(/\{family\}/g, family)
    .replace(/\{brand\}/g, brand)
    .replace(/\{city\}/g, city.name)
    .replace(/\{first\}/g, owner.firstName)
    .replace(/\{last\}/g, owner.lastName);

  const industry =
    type === "dealer" ? "Automotive — Franchised Dealership"
    : type === "body_shop" ? "Automotive — Collision Repair"
    : "Automotive — Independent Service";

  return { type, name, domain: slugifyDomain(name), industry };
}

// Realistic dealer/shop domains drop common suffix words ("Auto Group",
// "Collision Center", "Auto Body", "& Paint"…) so the result looks hand-picked
// rather than slugged. `crowntoyota.com` not `crowntoyota-of-pasadena.com`.
const DOMAIN_DROP_WORDS = [
  "auto group", "auto body", "body shop", "collision center", "collision",
  "body & paint", "& paint", "and paint", "auto service", "auto repair",
  "automotive", "tire & auto", "tire and auto", "performance & service",
  "performance and service", "service", "center", "brothers",
];

function slugifyDomain(name: string): string {
  let s = name.toLowerCase();
  for (const w of DOMAIN_DROP_WORDS) {
    s = s.replace(new RegExp(`\\b${w.replace(/[&]/g, "\\&")}\\b`, "g"), " ");
  }
  s = s
    .replace(/mercedes-benz/g, "mercedes")
    .replace(/land rover/g, "landrover")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (s.length === 0) s = "shop";
  if (s.length > 28) s = s.slice(0, 28);
  return `${s}.com`;
}

export function makeTitle(rng: Rng, type: BusinessType): string {
  // ~4% of CRM rows have a blank title — leads from form fills or imports
  // where the title column wasn't populated.
  if (rng.bool(0.04)) return "";
  return rng.pick(TITLES_BY_TYPE[type]);
}

const NANP_AREA_FALLBACK = ["213", "310", "323", "424", "562", "619", "626", "714", "747", "818", "858"];

export function makePhone(rng: Rng, city?: CityRecord) {
  const areas = city && city.areaCodes.length > 0 ? city.areaCodes : NANP_AREA_FALLBACK;
  const area = rng.pick(areas);
  // Exchange codes can't start with 0 or 1; second digit can't be 11.
  const exMid = rng.int(200, 999);
  const line = rng.int(0, 9999).toString().padStart(4, "0");

  const fmt = rng.weighted(PHONE_FORMAT_WEIGHTS);
  switch (fmt) {
    case "+1XXXXXXXXXX":         return `+1${area}${exMid}${line}`;
    case "(XXX) XXX-XXXX":       return `(${area}) ${exMid}-${line}`;
    case "XXX-XXX-XXXX":         return `${area}-${exMid}-${line}`;
    case "+1 (XXX) XXX-XXXX":    return `+1 (${area}) ${exMid}-${line}`;
    case "XXXXXXXXXX":           return `${area}${exMid}${line}`;
    default:                     return `+1${area}${exMid}${line}`;
  }
}

const GMAIL_TLD = "gmail.com";
const YAHOO_TLD = "yahoo.com";

export function makeEmail(rng: Rng, firstName: string, lastName: string, domain: string): string {
  const f = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const l = lastName.toLowerCase().replace(/[^a-z]/g, "");
  if (!f || !l) return "";

  const pattern = rng.weighted(EMAIL_PATTERN_WEIGHTS);
  switch (pattern) {
    case "first.last":      return `${f}.${l}@${domain}`;
    case "flast":           return `${f[0]}${l}@${domain}`;
    case "firstl":          return `${f}${l[0]}@${domain}`;
    case "first":           return `${f}@${domain}`;
    case "last":            return `${l}@${domain}`;
    case "role:service":    return `service@${domain}`;
    case "role:parts":      return `parts@${domain}`;
    case "role:info":       return `info@${domain}`;
    case "role:bodyshop":   return `bodyshop@${domain}`;
    case "personal:gmail":  return `${f}.${l}${rng.int(1, 99)}@${GMAIL_TLD}`;
    case "personal:yahoo":  return `${f}${l}@${YAHOO_TLD}`;
    case "empty":           return "";
    default:                return `${f}.${l}@${domain}`;
  }
}

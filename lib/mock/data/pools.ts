// All pool *data* lives in pools.json, this file is the typed entry point.
// JSON modules widen to `string[]`, so the TS export casts back into the
// narrow literal-union types defined in ../types.ts. Bulk content stays in
// JSON so it's diff-friendly and editable without recompiling.

import poolsJson from "./pools.json";
import type { LeadSource, LeadStatus } from "../types";

export type BusinessType = "dealer" | "body_shop" | "service";

export type CityRecord = {
  name: string;
  state: string;
  lng: number;
  lat: number;
  areaCodes: string[];
};

const j = poolsJson as {
  firstNames: string[];
  lastNames: string[];
  familyNames: string[];
  autoBrands: string[];
  dealerTemplates: string[];
  bodyShopTemplates: string[];
  serviceShopTemplates: string[];
  businessTypeWeights: [BusinessType, number][];
  cities: CityRecord[];
  titlesByType: Record<BusinessType, string[]>;
  phoneFormatWeights: [string, number][];
  emailPatternWeights: [string, number][];
  objectionTags: string[];
  followUpActions: string[];
  transcriptOpeners: { seller: string[]; buyer: string[] };
  transcriptBookPitches: { seller: string[]; buyer: string[] };
  transcriptUserInterested: string[];
  transcriptUserObjection: string[];
  transcriptCloseBooked: string[];
  transcriptCloseLost: string[];
  transcriptUserVm: string[];
  leadSources: LeadSource[];
  leadStatuses: LeadStatus[];
  noteFragments: string[];
};

export const FIRST_NAMES = j.firstNames;
export const LAST_NAMES = j.lastNames;
export const FAMILY_NAMES = j.familyNames;
export const AUTO_BRANDS = j.autoBrands;
export const DEALER_TEMPLATES = j.dealerTemplates;
export const BODY_SHOP_TEMPLATES = j.bodyShopTemplates;
export const SERVICE_SHOP_TEMPLATES = j.serviceShopTemplates;
export const BUSINESS_TYPE_WEIGHTS = j.businessTypeWeights;
export const CITIES = j.cities;
export const TITLES_BY_TYPE = j.titlesByType;
export const PHONE_FORMAT_WEIGHTS = j.phoneFormatWeights;
export const EMAIL_PATTERN_WEIGHTS = j.emailPatternWeights;

export const OBJECTION_TAGS = j.objectionTags;
export const FOLLOW_UP_ACTIONS = j.followUpActions;

export const TRANSCRIPT_OPENERS_SELLER = j.transcriptOpeners.seller;
export const TRANSCRIPT_OPENERS_BUYER = j.transcriptOpeners.buyer;
export const TRANSCRIPT_BOOK_SELLER = j.transcriptBookPitches.seller;
export const TRANSCRIPT_BOOK_BUYER = j.transcriptBookPitches.buyer;
export const TRANSCRIPT_USER_INTERESTED = j.transcriptUserInterested;
export const TRANSCRIPT_USER_OBJECTION = j.transcriptUserObjection;
export const TRANSCRIPT_AGENT_CLOSE_BOOKED = j.transcriptCloseBooked;
export const TRANSCRIPT_AGENT_CLOSE_LOST = j.transcriptCloseLost;
export const TRANSCRIPT_USER_VM = j.transcriptUserVm;
export const NOTE_FRAGMENTS = j.noteFragments;

// Derived combined views, not data, kept here so callers that don't care
// about the seller/buyer split keep a single import.
export const TRANSCRIPT_OPENERS = [
  ...TRANSCRIPT_OPENERS_SELLER,
  ...TRANSCRIPT_OPENERS_BUYER,
];
export const TRANSCRIPT_BOOK = [
  ...TRANSCRIPT_BOOK_SELLER,
  ...TRANSCRIPT_BOOK_BUYER,
];

export const LEAD_SOURCES = j.leadSources;
export const LEAD_STATUSES = j.leadStatuses;

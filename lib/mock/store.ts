// In-memory store. Seeded once per page load; no persistence.
// Mutations (created campaigns, resolved inbox items, etc.) live for the
// lifetime of the tab and reset on refresh.

import { seedStore, type Scenario, type SeededStore } from "./seed";

export type Store = SeededStore;

let current: SeededStore | null = null;

export function getStore(): SeededStore {
  if (!current) current = seedStore("happy-path");
  return current;
}

export function reseedStore(scenario: Scenario): SeededStore {
  current = seedStore(scenario);
  return current;
}

// Singleton in-memory store. Seeded lazily on first access so module-load
// remains side-effect-free per CLAUDE.md "No import-time side effects".

import { seedStore, type Scenario, type SeededStore } from "./seed";

let current: SeededStore | null = null;

// SeededStore.leads is `readonly` in the seed module's inferred type only by
// convention; we mutate via handlers so the store is genuinely live.
export type Store = SeededStore;

export function getStore(): SeededStore {
  if (!current) current = seedStore("happy-path");
  return current;
}

export function reseedStore(scenario: Scenario): SeededStore {
  current = seedStore(scenario);
  return current;
}

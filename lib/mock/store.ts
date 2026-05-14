// Singleton in-memory store with localStorage persistence so demo
// mutations (created campaigns, assigned inbox items, resolved threads,
// updated agent config, etc.) survive page reloads.
//
// Bump STORAGE_VERSION whenever the SeededStore shape changes, old
// payloads will be discarded and the seed re-runs.

import { seedStore, type Scenario, type SeededStore } from "./seed";

const STORAGE_KEY = "xylo-portal:mock-store";
const STORAGE_VERSION = 9;

export type Store = SeededStore;

type Envelope = { v: number; data: SeededStore };

let current: SeededStore | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hydrate(): SeededStore | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope;
    if (env?.v !== STORAGE_VERSION || !env.data) return null;
    return env.data;
  } catch {
    return null;
  }
}

function persistNow(): void {
  if (!isBrowser() || !current) return;
  try {
    const env: Envelope = { v: STORAGE_VERSION, data: current };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  } catch (err) {
    // Quota exceeded or serialization issue, silently drop; demo continues
    // in-memory until next reload.
    console.warn("[mock] persist failed", err);
  }
}

function schedulePersist(): void {
  if (!isBrowser()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 200);
}

export function getStore(): SeededStore {
  if (!current) {
    current = hydrate() ?? seedStore("happy-path");
  }
  schedulePersist();
  return current;
}

export function reseedStore(scenario: Scenario): SeededStore {
  current = seedStore(scenario);
  persistNow();
  return current;
}

export function resetStore(): void {
  if (isBrowser()) window.localStorage.removeItem(STORAGE_KEY);
  current = null;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

// Lightweight event bus for "live" pages. Phase 1 ships the plumbing; Phase 3
// (Live page) will subscribe. Emitting nothing yet beyond a heartbeat keeps
// the surface clean.

"use client";

import { useEffect, useState } from "react";
import type { ActivityEvent } from "./types";

type Listener = (event: ActivityEvent) => void;
const listeners = new Set<Listener>();

export function emitMockEvent(event: ActivityEvent) {
  for (const l of listeners) l(event);
}

export function subscribeMockEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMockClock(): { now: number } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return { now };
}

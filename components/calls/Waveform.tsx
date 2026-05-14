"use client";

import { useMemo, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function generateBars(callId: string, count: number): number[] {
  let seed = 0;
  for (let i = 0; i < callId.length; i++) seed = (seed * 31 + callId.charCodeAt(i)) >>> 0;
  const rand = seededRandom(seed || 1);
  // Tapered amplitude, louder in middle, quieter at ends, with a few peaks.
  return Array.from({ length: count }, (_, i) => {
    const pos = i / count;
    const envelope = Math.sin(pos * Math.PI) * 0.8 + 0.2;
    const noise = 0.5 + rand() * 0.5;
    const peak = i % 13 === 0 ? 1.1 : 1;
    return Math.min(1, envelope * noise * peak);
  });
}

export function Waveform({
  callId,
  durationSec,
}: {
  callId: string;
  durationSec: number;
}) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0); // 0..1
  const bars = useMemo(() => generateBars(callId, 64), [callId]);

  const currentSec = Math.round(durationSec * position);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-muted"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="ml-0.5 size-4" />}
        </button>
        <div
          className="relative flex h-12 flex-1 items-end gap-[2px]"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setPosition(Math.max(0, Math.min(1, pct)));
          }}
          role="slider"
          aria-valuenow={Math.round(position * 100)}
        >
          {bars.map((amp, i) => {
            const reached = i / bars.length <= position;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 cursor-pointer rounded-sm transition-colors",
                  reached ? "bg-emerald-500" : "bg-muted-foreground/40",
                )}
                style={{ height: `${Math.max(8, amp * 100)}%` }}
              />
            );
          })}
        </div>
        <div className="w-16 text-right text-xs tabular-nums text-muted-foreground">
          {formatDuration(currentSec)} / {formatDuration(durationSec)}
        </div>
      </div>
    </div>
  );
}

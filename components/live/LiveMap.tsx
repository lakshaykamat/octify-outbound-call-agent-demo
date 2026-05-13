"use client";

import { useEffect, useState } from "react";

export type LivePing = {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  region: string;
  outcome: "connected" | "voicemail" | "no-answer" | "booked";
  ts: number;
};

const TONE: Record<LivePing["outcome"], string> = {
  connected: "bg-emerald-500",
  voicemail: "bg-amber-500",
  "no-answer": "bg-muted-foreground/40",
  booked: "bg-blue-500",
};

export function LiveMap({ pings }: { pings: LivePing[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border bg-card">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <svg
        viewBox="0 0 200 100"
        className="absolute inset-0 size-full text-muted-foreground/30"
        aria-hidden
      >
        {/* Rough US outline */}
        <path
          d="M20,30 L40,22 L60,18 L90,16 L120,14 L150,18 L170,24 L180,32 L182,42 L178,52 L170,60 L160,68 L150,72 L130,76 L110,76 L90,74 L70,72 L55,66 L40,58 L30,46 Z"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="0.5"
        />
      </svg>

      {pings.map((p) => {
        const age = (now - p.ts) / 1000;
        if (age > 6) return null;
        const opacity = Math.max(0.1, 1 - age / 6);
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              opacity,
            }}
          >
            <div className="relative">
              <div
                className={`absolute inset-0 size-3 animate-ping rounded-full ${TONE[p.outcome]} opacity-50`}
                style={{ animationDuration: "1.4s" }}
              />
              <div className={`relative size-2 rounded-full ${TONE[p.outcome]}`} />
            </div>
          </div>
        );
      })}

      <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border bg-card/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        Live · US dial map
      </div>
    </div>
  );
}

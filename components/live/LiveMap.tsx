"use client";

import { useEffect, useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
// us-atlas ships TopoJSON; types not declared, hence the local shape below.
import topology from "us-atlas/states-10m.json";

type TopologyLike = Parameters<typeof feature>[0];
type GeometryCollectionLike = Parameters<typeof feature>[1];

export type LivePing = {
  id: string;
  lng: number;
  lat: number;
  region: string;
  outcome: "connected" | "voicemail" | "no-answer" | "booked";
  ts: number;
};

const TONE: Record<LivePing["outcome"], string> = {
  connected: "bg-emerald-500",
  voicemail: "bg-amber-500",
  "no-answer": "bg-muted-foreground/40",
  booked: "bg-sky-500",
};

// viewBox dimensions chosen so the AlbersUSA projection fills it cleanly.
const VIEW_W = 960;
const VIEW_H = 500;

const topo = topology as unknown as TopologyLike;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statesObject = (topo as any).objects.states as GeometryCollectionLike;

const states = feature(topo, statesObject) as unknown as FeatureCollection<Geometry>;
const borders = mesh(topo, statesObject, (a, b) => a !== b);

const projection = geoAlbersUsa().fitSize([VIEW_W, VIEW_H], states);
const path = geoPath(projection);

function projectPing(p: LivePing): { x: number; y: number } | null {
  const xy = projection([p.lng, p.lat]);
  if (!xy) return null;
  return { x: xy[0], y: xy[1] };
}

export function LiveMap({ pings }: { pings: LivePing[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const statePaths = useMemo(() => {
    return (states.features as Feature<Geometry>[]).map((f, i) => ({
      d: path(f) ?? "",
      key: (f.id as string) ?? `s-${i}`,
    }));
  }, []);
  const borderPath = useMemo(() => path(borders) ?? "", []);

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border bg-card">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <g className="text-muted-foreground/15">
          {statePaths.map((s) => (
            <path key={s.key} d={s.d} fill="currentColor" />
          ))}
        </g>
        <path
          d={borderPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.6}
          strokeLinejoin="round"
          className="text-muted-foreground/35"
        />
      </svg>

      {pings.map((p) => {
        const age = (now - p.ts) / 1000;
        if (age > 6) return null;
        const proj = projectPing(p);
        if (!proj) return null;
        const opacity = Math.max(0.1, 1 - age / 6);
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(proj.x / VIEW_W) * 100}%`,
              top: `${(proj.y / VIEW_H) * 100}%`,
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

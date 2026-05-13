"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Sentiment, TranscriptLine } from "@/lib/mock";

function seededHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickSentiment(seed: number, role: TranscriptLine["role"]): Sentiment {
  const r = (seed % 100) / 100;
  if (role === "agent") {
    if (r < 0.18) return "positive";
    if (r < 0.92) return "neutral";
    return "negative";
  }
  if (r < 0.3) return "positive";
  if (r < 0.85) return "neutral";
  return "negative";
}

const SENTIMENT_DOT: Record<Sentiment, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-muted-foreground/40",
  negative: "bg-rose-500",
};

export function TranscriptWithSentiment({
  lines,
  callId,
}: {
  lines: TranscriptLine[];
  callId: string;
}) {
  const [query, setQuery] = useState("");

  const enriched = useMemo(() => {
    return lines.map((line, i) => {
      const sentiment = pickSentiment(seededHash(callId + i), line.role);
      return { ...line, sentiment, index: i };
    });
  }, [lines, callId]);

  const filtered = query.trim()
    ? enriched.filter((l) => l.content.toLowerCase().includes(query.toLowerCase()))
    : enriched;

  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">No transcript available.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript"
          className="pl-8"
        />
      </div>
      <ol className="space-y-2">
        {filtered.map((l) => (
          <li
            key={l.index}
            className={cn(
              "flex gap-2 rounded-md p-2 text-sm transition-colors hover:bg-muted/40",
              l.role === "agent" ? "bg-muted/20" : "",
            )}
          >
            <span
              className={cn("mt-1.5 size-2 shrink-0 rounded-full", SENTIMENT_DOT[l.sentiment])}
              title={l.sentiment}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {l.role === "agent" ? "Agent" : "Prospect"}
              </p>
              <p className="text-sm text-foreground/90">{l.content}</p>
            </div>
          </li>
        ))}
      </ol>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No lines match “{query}”.</p>
      )}
    </div>
  );
}

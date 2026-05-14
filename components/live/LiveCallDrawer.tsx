"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LiveEvent } from "./LiveFeed";

const SCRIPTS: Record<LiveEvent["outcome"], { role: "agent" | "user"; text: string; sentiment: "positive" | "neutral" | "negative" }[]> = {
  booked: [
    { role: "agent", text: "Hi {name}, this is Lara from Apex Capital. Quick question about a sell-versus-hold decision on the asset?", sentiment: "neutral" },
    { role: "user", text: "Sure, what about it?", sentiment: "neutral" },
    { role: "agent", text: "We run a free off-market valuation for owners in {region} weighing sell, refi, or hold. Worth a 15-minute look?", sentiment: "neutral" },
    { role: "user", text: "Yeah, we've been thinking about trimming one asset.", sentiment: "positive" },
    { role: "agent", text: "How does Thursday at 2pm work for a quick discovery call?", sentiment: "neutral" },
    { role: "user", text: "Thursday works. Send the invite to my email.", sentiment: "positive" },
    { role: "agent", text: "Perfect, booked. You'll get a calendar invite in the next few minutes.", sentiment: "positive" },
  ],
  connected: [
    { role: "agent", text: "Hi {name}, this is Lara from Apex Capital. Got a minute?", sentiment: "neutral" },
    { role: "user", text: "I'm in the middle of something, what's this about?", sentiment: "neutral" },
    { role: "agent", text: "Quick, we run a free off-market valuation for owners weighing sell or refi. Anything on the table?", sentiment: "neutral" },
    { role: "user", text: "Some, but we're not actively looking right now.", sentiment: "neutral" },
    { role: "agent", text: "Totally understand. Can I send a short overview to revisit later?", sentiment: "neutral" },
    { role: "user", text: "Yeah, that's fine.", sentiment: "neutral" },
  ],
  voicemail: [
    { role: "agent", text: "Hi {name}, this is Lara calling from Apex Capital.", sentiment: "neutral" },
    { role: "agent", text: "We run free off-market valuations for owners in {region} weighing sell, refi, or hold.", sentiment: "neutral" },
    { role: "agent", text: "I'll send you a short note by email. Talk soon.", sentiment: "neutral" },
  ],
  "no-answer": [],
};

export function LiveCallDrawer({
  event,
  open,
  onOpenChange,
}: {
  event: LiveEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [lineCount, setLineCount] = useState(0);
  const [sentimentValue, setSentimentValue] = useState(50); // 0..100
  const script = event ? SCRIPTS[event.outcome] : [];

  // Reset & stream lines while open.
  useEffect(() => {
    if (!open || !event) {
      setLineCount(0);
      setSentimentValue(50);
      return;
    }
    setLineCount(0);
    setSentimentValue(50);
    let i = 0;
    const tick = () => {
      i++;
      if (i > script.length) return;
      setLineCount(i);
      const line = script[i - 1];
      if (line) {
        setSentimentValue((s) =>
          line.sentiment === "positive"
            ? Math.min(100, s + 10)
            : line.sentiment === "negative"
              ? Math.max(0, s - 12)
              : s,
        );
      }
      timeout = setTimeout(tick, 800 + Math.random() * 700);
    };
    let timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  }, [open, event, script]);

  const tone =
    sentimentValue >= 60
      ? "text-emerald-500"
      : sentimentValue <= 40
        ? "text-rose-500"
        : "text-muted-foreground";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full flex-col data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:w-[42vw] data-[vaul-drawer-direction=right]:sm:max-w-none">
        <DrawerHeader className="gap-3 border-b p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live call
            </span>
            <DrawerClose
              aria-label="Close"
              className="-mr-1.5 -mt-1.5 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-4" />
            </DrawerClose>
          </div>
          {event ? (
            <>
              <DrawerTitle className="text-xl font-semibold tracking-tight">
                {event.prospectName}
              </DrawerTitle>
              <DrawerDescription>
                {event.company} · {event.region}
              </DrawerDescription>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline">In progress</Badge>
                <Badge variant="outline">Lara · Apex SDR</Badge>
              </div>
            </>
          ) : (
            <DrawerTitle>No call selected</DrawerTitle>
          )}
        </DrawerHeader>

        {event && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Live sentiment</span>
                <span className={cn("font-medium tabular-nums", tone)}>
                  {sentimentValue >= 60 ? "Positive" : sentimentValue <= 40 ? "Negative" : "Neutral"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    sentimentValue >= 60
                      ? "bg-emerald-500"
                      : sentimentValue <= 40
                        ? "bg-rose-500"
                        : "bg-muted-foreground/60",
                  )}
                  style={{ width: `${sentimentValue}%` }}
                />
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Talk · listen ratio (live)</span>
                <span className="tabular-nums">
                  Agent {Math.max(30, 50 - lineCount * 2)}% · Lead {Math.min(70, 50 + lineCount * 2)}%
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-foreground/70 transition-all duration-500"
                  style={{ width: `${Math.max(30, 50 - lineCount * 2)}%` }}
                />
                <div
                  className="bg-emerald-500/70 transition-all duration-500"
                  style={{ width: `${Math.min(70, 50 + lineCount * 2)}%` }}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Streaming transcript
              </h3>
              <ol className="space-y-2">
                {script.slice(0, lineCount).map((line, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md p-2 text-sm transition-all",
                      line.role === "agent" ? "bg-muted/30" : "",
                    )}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {line.role === "agent" ? "Agent" : event.prospectName.split(" ")[0]}
                    </p>
                    <p className="mt-0.5 text-sm">
                      {line.text
                        .replace("{name}", event.prospectName.split(" ")[0])
                        .replace("{region}", event.region)}
                    </p>
                  </li>
                ))}
                {lineCount < script.length && (
                  <li className="rounded-md bg-muted/20 p-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {script[lineCount]?.role === "agent" ? "Agent" : event.prospectName.split(" ")[0]}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
                      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" style={{ animationDelay: "150ms" }} />
                      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" style={{ animationDelay: "300ms" }} />
                    </p>
                  </li>
                )}
              </ol>
              {lineCount === script.length && script.length > 0 && (
                <p className="pt-2 text-xs text-muted-foreground">Call ended · transcript complete.</p>
              )}
            </section>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

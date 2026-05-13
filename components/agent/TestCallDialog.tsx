"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRunTestCall } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { TestCallEvent } from "@/lib/mock";

type Phase = "idle" | "ringing" | "connected" | "ended";

const OUTCOME_LABEL: Record<NonNullable<TestCallEvent["outcome"]>, { label: string; tone: string }> = {
  meeting_booked:     { label: "Meeting booked",     tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  callback_requested: { label: "Callback requested", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  not_interested:     { label: "Not interested",     tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  voicemail:          { label: "Voicemail",          tone: "bg-muted text-muted-foreground" },
};

export function TestCallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [phone, setPhone] = useState("+1 415 555 0118");
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState<Array<{ role: "agent" | "user"; text: string }>>([]);
  const [outcome, setOutcome] = useState<TestCallEvent["outcome"] | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptEnd = useRef<HTMLDivElement | null>(null);
  const run = useRunTestCall();

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript]);

  useEffect(() => {
    if (!open) {
      clearTimers();
      setPhase("idle");
      setTranscript([]);
      setOutcome(null);
    }
    return clearTimers;
  }, [open]);

  async function start() {
    setPhase("ringing");
    setTranscript([]);
    setOutcome(null);
    const { events } = await run.mutateAsync(phone);
    for (const ev of events) {
      const t = setTimeout(() => {
        if (ev.kind === "connected") setPhase("connected");
        else if (ev.kind === "transcript" && ev.role && ev.text) {
          setTranscript((prev) => [...prev, { role: ev.role!, text: ev.text! }]);
        } else if (ev.kind === "outcome") setOutcome(ev.outcome ?? null);
        else if (ev.kind === "ended") setPhase("ended");
      }, ev.at);
      timers.current.push(t);
    }
  }

  function hangUp() {
    clearTimers();
    setPhase("ended");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test call</DialogTitle>
          <DialogDescription>
            Ring your own number to hear the agent end-to-end. Nothing is dialed in the demo — this streams a scripted exchange.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={phase !== "idle" && phase !== "ended"}
              placeholder="+1 415 555 0118"
              className="flex-1"
            />
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 gap-1.5",
                phase === "ringing" && "border-amber-400 text-amber-700 dark:text-amber-300",
                phase === "connected" && "border-emerald-500 text-emerald-700 dark:text-emerald-300",
                phase === "ended" && "border-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  phase === "idle" && "bg-muted-foreground",
                  phase === "ringing" && "animate-pulse bg-amber-500",
                  phase === "connected" && "animate-pulse bg-emerald-500",
                  phase === "ended" && "bg-muted-foreground",
                )}
              />
              {phase === "idle" && "Idle"}
              {phase === "ringing" && "Ringing…"}
              {phase === "connected" && "Connected"}
              {phase === "ended" && "Call ended"}
            </Badge>
          </div>

          <div className="h-72 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {transcript.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                {phase === "idle" && "Press Call me now to begin."}
                {phase === "ringing" && "Ringing…"}
                {phase === "connected" && "Connected — waiting for the first line."}
                {phase === "ended" && !outcome && "Call ended."}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {transcript.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                      line.role === "agent"
                        ? "bg-primary/[0.08] text-foreground"
                        : "ml-auto bg-card text-foreground shadow-xs",
                    )}
                  >
                    <div className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {line.role === "agent" ? "Xylo" : "You"}
                    </div>
                    {line.text}
                  </div>
                ))}
                <div ref={transcriptEnd} />
              </div>
            )}
          </div>

          {outcome ? (
            <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Outcome
              </span>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", OUTCOME_LABEL[outcome].tone)}>
                {OUTCOME_LABEL[outcome].label}
              </span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {phase === "idle" || phase === "ended" ? (
            <Button onClick={start} disabled={run.isPending}>
              <PhoneCall className="size-4" />
              {phase === "ended" ? "Call again" : "Call me now"}
            </Button>
          ) : (
            <Button variant="destructive" onClick={hangUp}>
              <PhoneOff className="size-4" />
              Hang up
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TestCallButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Phone className="size-3.5" />
        Test call
      </Button>
      <TestCallDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

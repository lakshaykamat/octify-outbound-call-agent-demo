"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TestCallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [phone, setPhone] = useState("+1 415 555 0118");
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<TestCallEvent["outcome"] | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const run = useRunTestCall();

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  useEffect(() => {
    if (phase !== "connected") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!open) {
      clearTimers();
      setPhase("idle");
      setOutcome(null);
      setConnectedAt(null);
      setEndedAt(null);
    }
    return clearTimers;
  }, [open]);

  async function start() {
    setPhase("ringing");
    setOutcome(null);
    setConnectedAt(null);
    setEndedAt(null);
    const { events } = await run.mutateAsync(phone);
    for (const ev of events) {
      const t = setTimeout(() => {
        if (ev.kind === "connected") {
          const start = Date.now();
          setConnectedAt(start);
          setNow(start);
          setPhase("connected");
        } else if (ev.kind === "outcome") {
          setOutcome(ev.outcome ?? null);
        } else if (ev.kind === "ended") {
          setEndedAt(Date.now());
          setPhase("ended");
        }
      }, ev.at);
      timers.current.push(t);
    }
  }

  function hangUp() {
    clearTimers();
    setEndedAt(Date.now());
    setPhase("ended");
  }

  const elapsed =
    phase === "connected" && connectedAt
      ? now - connectedAt
      : phase === "ended" && connectedAt && endedAt
        ? endedAt - connectedAt
        : 0;

  const statusLine =
    phase === "idle" ? "Ready to dial"
    : phase === "ringing" ? "Ringing…"
    : phase === "connected" ? "In call"
    : "Call ended";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Test call</DialogTitle>
          <DialogDescription>
            Ring your own number to hear the agent end-to-end. Nothing is dialed in the demo.
          </DialogDescription>
        </DialogHeader>

        {phase === "idle" ? (
          <div className="flex flex-col gap-4 px-6 pb-6">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Phone number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 415 555 0118"
              inputMode="tel"
            />
            <Button onClick={start} disabled={run.isPending} size="lg">
              <PhoneCall className="size-4" />
              Call me now
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 px-6 pb-8 pt-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  phase === "ringing" && "animate-pulse bg-amber-500",
                  phase === "connected" && "animate-pulse bg-emerald-500",
                  phase === "ended" && "bg-muted-foreground",
                )}
              />
              {statusLine}
            </div>

            <div
              className={cn(
                "font-mono text-6xl font-semibold tabular-nums tracking-tight",
                phase === "ringing" && "text-muted-foreground/60",
                phase === "connected" && "text-foreground",
                phase === "ended" && "text-muted-foreground",
              )}
            >
              {phase === "ringing" ? "00:00" : formatDuration(elapsed)}
            </div>

            <div className="text-sm text-muted-foreground">{phone}</div>

            {outcome && phase === "ended" ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Outcome
                </span>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", OUTCOME_LABEL[outcome].tone)}>
                  {OUTCOME_LABEL[outcome].label}
                </span>
              </div>
            ) : null}

            <div className="flex w-full items-center justify-center pt-2">
              {phase === "ended" ? (
                <Button onClick={start} disabled={run.isPending} size="lg" className="min-w-40">
                  <PhoneCall className="size-4" />
                  Call again
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={hangUp}
                  size="lg"
                  className="size-14 rounded-full p-0"
                  aria-label="Hang up"
                >
                  <PhoneOff className="size-5" />
                </Button>
              )}
            </div>
          </div>
        )}
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

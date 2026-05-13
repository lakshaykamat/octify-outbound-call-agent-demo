"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateAgentConfig, useVoiceOptions } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { AgentConfig, VoiceOption } from "@/lib/mock";

function Waveform({ data, active }: { data: number[]; active: boolean }) {
  return (
    <div className="flex h-7 items-center gap-[2px]">
      {data.map((v, i) => (
        <span
          key={i}
          className={cn(
            "block w-[3px] rounded-full transition-all duration-300",
            active ? "bg-primary" : "bg-muted-foreground/40",
          )}
          style={{
            height: `${Math.max(10, Math.round(v * 100))}%`,
            transitionDelay: active ? `${i * 18}ms` : "0ms",
            opacity: active ? 0.6 + v * 0.4 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

function VoiceTile({
  voice,
  selected,
  onSelect,
  playing,
  onPlayToggle,
}: {
  voice: VoiceOption;
  selected: boolean;
  onSelect: () => void;
  playing: boolean;
  onPlayToggle: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected && "border-primary bg-primary/[0.04] ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{voice.name}</div>
          <div className="text-[11px] text-muted-foreground">{voice.accent}</div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={(e) => {
            e.stopPropagation();
            onPlayToggle();
          }}
          aria-label={playing ? "Stop preview" : "Play preview"}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </Button>
      </div>
      <Waveform data={voice.waveform} active={playing} />
      <div className="text-[11px] text-muted-foreground">{voice.tone}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110"
      />
    </div>
  );
}

export function VoiceCard({ a }: { a: AgentConfig }) {
  const voices = useVoiceOptions();
  const update = useUpdateAgentConfig();
  const [playing, setPlaying] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [speed, setSpeed] = useState(a.agent.voice?.speed ?? 1);
  const [temperature, setTemperature] = useState(a.agent.llm?.temperature ?? 0.4);

  useEffect(() => setSpeed(a.agent.voice?.speed ?? 1), [a.agent.voice?.speed]);
  useEffect(
    () => setTemperature(a.agent.llm?.temperature ?? 0.4),
    [a.agent.llm?.temperature],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function togglePreview(id: string) {
    if (playing === id) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPlaying(null);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(id);
    timerRef.current = setTimeout(() => setPlaying(null), 3000);
  }

  function commitSpeed(next: number) {
    setSpeed(next);
    update.mutate({ speed: next });
  }
  function commitTemp(next: number) {
    setTemperature(next);
    update.mutate({ temperature: next });
  }

  async function selectVoice(id: string) {
    try {
      await update.mutateAsync({ voiceId: id });
      toast.success("Voice updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <SectionCard
      title="Voice & tone"
      description="Pick a voice and tune delivery. Changes apply to the next call."
    >
      <div className="flex flex-col gap-5">
        {voices.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(voices.data ?? []).map((v) => (
              <VoiceTile
                key={v.id}
                voice={v}
                selected={a.agent.voice?.voiceId === v.id}
                onSelect={() => selectVoice(v.id)}
                playing={playing === v.id}
                onPlayToggle={() => togglePreview(v.id)}
              />
            ))}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Slider
            label="Speech rate"
            value={speed}
            min={0.7}
            max={1.3}
            step={0.01}
            format={(n) => `${n.toFixed(2)}×`}
            onChange={commitSpeed}
          />
          <Slider
            label="Creativity"
            value={temperature}
            min={0}
            max={1}
            step={0.05}
            format={(n) => n.toFixed(2)}
            onChange={commitTemp}
          />
        </div>
      </div>
    </SectionCard>
  );
}

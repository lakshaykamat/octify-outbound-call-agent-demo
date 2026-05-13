// Thin typed loader over data/agent-runtime.json + data/knowledge-base.json.
// The voice waveform is the one piece that stays computed in TS because it's
// decorative noise, not data — the seed value lives in JSON.

import type {
  AgentConfig, AgentScript, AgentVersion, KnowledgeBase, VoiceOption,
} from "./types";
import agentRuntime from "./data/agent-runtime.json";
import kb from "./data/knowledge-base.json";

const runtime = agentRuntime as {
  script: AgentScript;
  earlierScriptOverrides: Partial<AgentScript>;
  voiceOptions: { id: string; name: string; accent: string; gender: VoiceOption["gender"]; tone: string; waveSeed: number }[];
  versions: {
    id: string;
    label: string;
    createdAt: string;
    author: string;
    note: string;
    snapshot: {
      name: string;
      objective: string;
      voiceId: string;
      speed: number;
      temperature: number;
      useScript: "current" | "earlier";
    };
  }[];
  agentConfig: Omit<AgentConfig, "orgId">;
};

function wave(seed: number, density = 32): number[] {
  return Array.from({ length: density }, (_, i) => {
    const s = Math.sin((i + 1) * (seed * 0.37));
    const c = Math.cos((i + 1) * (seed * 0.21 + 1.3));
    return Math.max(0.12, Math.min(1, Math.abs(s * 0.6 + c * 0.4)));
  });
}

export function staticAgentScript(): AgentScript {
  return { ...runtime.script };
}

export function staticVoiceOptions(): VoiceOption[] {
  return runtime.voiceOptions.map(({ waveSeed, ...rest }) => ({
    ...rest,
    waveform: wave(waveSeed),
  }));
}

export function staticAgentVersions(): AgentVersion[] {
  const current = staticAgentScript();
  const earlier: AgentScript = { ...current, ...runtime.earlierScriptOverrides };
  return runtime.versions.map((v) => ({
    id: v.id,
    label: v.label,
    createdAt: v.createdAt,
    author: v.author,
    note: v.note,
    snapshot: {
      name: v.snapshot.name,
      objective: v.snapshot.objective,
      voiceId: v.snapshot.voiceId,
      speed: v.snapshot.speed,
      temperature: v.snapshot.temperature,
      script: v.snapshot.useScript === "current" ? current : earlier,
    },
  }));
}

export function staticAgentConfig(orgId: string): AgentConfig {
  return { orgId, ...runtime.agentConfig } as AgentConfig;
}

export function staticKnowledgeBase(orgId: string): KnowledgeBase {
  return { orgId, ...(kb as Omit<KnowledgeBase, "orgId">) };
}

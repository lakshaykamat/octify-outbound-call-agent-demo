"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { reseedStore, type Scenario } from "@/lib/mock";
import { toast } from "sonner";

const SCENARIOS: { value: Scenario; label: string; description: string }[] = [
  { value: "happy-path", label: "Happy path", description: "Healthy outbound motion at scale" },
  { value: "first-day", label: "First day", description: "Fresh workspace, empty pipeline" },
  { value: "power-user", label: "Power user", description: "Mature team, multiple campaigns" },
  { value: "investor-pitch", label: "Investor pitch", description: "Best-in-class metrics" },
];

type Ctx = {
  scenarios: typeof SCENARIOS;
  scenario: Scenario;
  switchScenario: (s: Scenario) => void;
  resetDemo: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  personaOpen: boolean;
  setPersonaOpen: (open: boolean) => void;
};

const DemoCtx = createContext<Ctx | null>(null);

export function useDemo() {
  const c = useContext(DemoCtx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>("happy-path");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const qc = useQueryClient();

  const reseed = useCallback(
    (s: Scenario) => {
      reseedStore(s);
      void qc.invalidateQueries();
    },
    [qc],
  );

  const switchScenario = useCallback(
    (s: Scenario) => {
      setScenario(s);
      reseed(s);
      const label = SCENARIOS.find((x) => x.value === s)?.label ?? s;
      toast.message(`Persona · ${label}`);
    },
    [reseed],
  );

  const resetDemo = useCallback(() => {
    reseed(scenario);
    toast.success("Workspace reset");
  }, [reseed, scenario]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setPersonaOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      scenarios: SCENARIOS,
      scenario,
      switchScenario,
      resetDemo,
      paletteOpen,
      setPaletteOpen,
      personaOpen,
      setPersonaOpen,
    }),
    [scenario, switchScenario, resetDemo, paletteOpen, personaOpen],
  );

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

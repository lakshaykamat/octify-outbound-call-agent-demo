"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDemo } from "./DemoContext";
import { Check, Sparkles } from "lucide-react";

export function PersonaSwitcher() {
  const { personaOpen, setPersonaOpen, scenarios, scenario, switchScenario } = useDemo();

  return (
    <Dialog open={personaOpen} onOpenChange={setPersonaOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" /> Demo persona
          </DialogTitle>
          <DialogDescription>
            Re-seeds the workspace with a different data shape. For presenters only.
          </DialogDescription>
        </DialogHeader>
        <ul className="-mx-2 divide-y">
          {scenarios.map((s) => {
            const active = s.value === scenario;
            return (
              <li key={s.value}>
                <button
                  type="button"
                  onClick={() => {
                    switchScenario(s.value);
                    setPersonaOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition hover:bg-muted ${
                    active ? "bg-muted" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.label}</span>
                      {active ? <Check className="size-3.5 text-emerald-500" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="text-[10px] text-muted-foreground">
          Hidden chord: <kbd className="rounded border bg-muted px-1 font-mono">⌘⇧D</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}

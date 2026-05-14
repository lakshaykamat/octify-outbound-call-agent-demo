"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { useUpdateAgentConfig } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { AgentConfig, BusinessHours } from "@/lib/mock";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7..19

function bhToCells(bh: BusinessHours): Set<string> {
  const cells = new Set<string>();
  if (bh.is24x7) {
    for (const d of DAYS) for (const h of HOURS) cells.add(`${d.key}-${h}`);
    return cells;
  }
  for (const win of bh.schedule) {
    const open = Number(win.open.slice(0, 2));
    const close = Number(win.close.slice(0, 2));
    for (const d of win.days) {
      for (let h = open; h < close; h++) cells.add(`${d}-${h}`);
    }
  }
  return cells;
}

function cellsToBh(cells: Set<string>, timezone: string): BusinessHours {
  const schedule: BusinessHours["schedule"] = [];
  for (const day of DAYS) {
    const hours = HOURS.filter((h) => cells.has(`${day.key}-${h}`)).sort((a, b) => a - b);
    if (hours.length === 0) continue;
    // Collapse contiguous ranges.
    let start = hours[0];
    let prev = hours[0];
    for (let i = 1; i <= hours.length; i++) {
      const h = hours[i];
      if (h === prev + 1) {
        prev = h;
        continue;
      }
      schedule.push({
        days: [day.key],
        open: `${String(start).padStart(2, "0")}:00`,
        close: `${String(prev + 1).padStart(2, "0")}:00`,
      });
      if (h !== undefined) {
        start = h;
        prev = h;
      }
    }
  }
  return { timezone, schedule, is24x7: false };
}

export function ScheduleGrid({ a }: { a: AgentConfig }) {
  const update = useUpdateAgentConfig();
  const initial = useMemo(() => bhToCells(a.businessHours), [a.businessHours]);
  const [cells, setCells] = useState<Set<string>>(initial);
  const [dirty, setDirty] = useState(false);
  const [dragMode, setDragMode] = useState<"on" | "off" | null>(null);

  function toggleCell(key: string, mode: "on" | "off") {
    setCells((prev) => {
      const next = new Set(prev);
      if (mode === "on") next.add(key);
      else next.delete(key);
      return next;
    });
    setDirty(true);
  }

  async function save() {
    try {
      const bh = cellsToBh(cells, a.businessHours.timezone || "America/Los_Angeles");
      await update.mutateAsync({ businessHours: bh });
      setDirty(false);
      toast.success("Schedule updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function reset() {
    setCells(initial);
    setDirty(false);
  }

  function preset(kind: "weekdays" | "extended" | "24x7" | "clear") {
    const next = new Set<string>();
    if (kind === "weekdays") {
      for (const d of ["mon", "tue", "wed", "thu", "fri"])
        for (let h = 9; h < 18; h++) next.add(`${d}-${h}`);
    } else if (kind === "extended") {
      for (const d of ["mon", "tue", "wed", "thu", "fri"])
        for (let h = 8; h < 19; h++) next.add(`${d}-${h}`);
      for (const d of ["sat"]) for (let h = 10; h < 14; h++) next.add(`${d}-${h}`);
    } else if (kind === "24x7") {
      for (const d of DAYS) for (const h of HOURS) next.add(`${d.key}-${h}`);
    }
    setCells(next);
    setDirty(true);
  }

  return (
    <SectionCard bare>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => preset("weekdays")}>Weekdays 9–6</Button>
            <Button variant="outline" size="sm" onClick={() => preset("extended")}>Extended</Button>
            <Button variant="outline" size="sm" onClick={() => preset("24x7")}>24 / 7</Button>
            <Button variant="ghost" size="sm" onClick={() => preset("clear")}>Clear</Button>
          </div>
          <div className="flex items-center gap-2">
            {dirty ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
            ) : null}
            <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
              {update.isPending ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </div>
        <div
          className="overflow-x-auto select-none"
          onMouseLeave={() => setDragMode(null)}
          onMouseUp={() => setDragMode(null)}
        >
          <table className="min-w-full border-separate border-spacing-[2px]">
            <thead>
              <tr>
                <th className="w-12" />
                {HOURS.map((h) => (
                  <th
                    key={h}
                    className="px-1 text-center font-mono text-[10px] font-normal text-muted-foreground tabular-nums"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day.key}>
                  <td className="pr-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {day.label}
                  </td>
                  {HOURS.map((h) => {
                    const key = `${day.key}-${h}`;
                    const on = cells.has(key);
                    return (
                      <td key={key} className="p-0">
                        <button
                          type="button"
                          onMouseDown={() => {
                            const mode = on ? "off" : "on";
                            setDragMode(mode);
                            toggleCell(key, mode);
                          }}
                          onMouseEnter={() => {
                            if (dragMode) toggleCell(key, dragMode);
                          }}
                          className={cn(
                            "h-6 w-7 rounded-[4px] transition",
                            on
                              ? "bg-primary/85 hover:bg-primary"
                              : "bg-muted hover:bg-muted-foreground/20",
                          )}
                          aria-label={`${day.label} ${h}:00 ${on ? "on" : "off"}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

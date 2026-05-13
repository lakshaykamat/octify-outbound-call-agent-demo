"use client";

import { SectionCard } from "@/components/patterns";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/mock";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Heatmap({ data }: { data: DashboardData["heatmap"] }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8..18

  // Find max connectRate for scaling.
  const maxRate = data.reduce((m, c) => Math.max(m, c.connectRate), 0) || 1;

  const cellMap = new Map(data.map((c) => [`${c.dow}-${c.hour}`, c]));

  return (
    <SectionCard
      title="When connects happen"
      description="Connect rate by day-of-week and hour-of-day."
      className="flex h-full flex-col"
      contentClassName="flex flex-1 flex-col"
    >
      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-12" />
              {hours.map((h) => (
                <th
                  key={h}
                  className="px-1 text-center text-[10px] font-medium text-muted-foreground tabular-nums"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, d) => (
              <tr key={day}>
                <td className="pr-2 text-right text-[10px] font-medium uppercase text-muted-foreground">
                  {day}
                </td>
                {hours.map((h) => {
                  const cell = cellMap.get(`${d}-${h}`);
                  const intensity = cell ? cell.connectRate / maxRate : 0;
                  const opacity = Math.max(0.06, intensity);
                  return (
                    <td key={h} className="p-0.5">
                      <div
                        title={
                          cell
                            ? `${day} ${h}:00 — ${(cell.connectRate * 100).toFixed(1)}% connect (${cell.calls} calls)`
                            : ""
                        }
                        className={cn(
                          "h-7 rounded-md transition-colors",
                          cell && cell.calls > 0 ? "bg-emerald-500" : "bg-muted",
                        )}
                        style={{ opacity: cell?.calls ? opacity : 0.15 }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Low</span>
        <div className="flex h-2 w-32 overflow-hidden rounded-full">
          {[0.1, 0.25, 0.45, 0.65, 0.85, 1].map((o) => (
            <div key={o} className="flex-1 bg-emerald-500" style={{ opacity: o }} />
          ))}
        </div>
        <span>High</span>
      </div>
    </SectionCard>
  );
}

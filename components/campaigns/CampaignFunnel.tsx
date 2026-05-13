import { cn } from "@/lib/utils";

export type FunnelStage = {
  label: string;
  value: number;
};

export function CampaignFunnel({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value ?? 0;
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const pct = top > 0 ? (stage.value / top) * 100 : 0;
        const fromPrev =
          i === 0 ? null : stages[i - 1].value > 0
            ? (stage.value / stages[i - 1].value) * 100
            : 0;
        return (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{stage.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-foreground">
                  {stage.value.toLocaleString()}
                </span>
                {fromPrev !== null && (
                  <span className="ml-2 text-muted-foreground">
                    {fromPrev.toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-md bg-muted">
              <div
                className={cn("h-full bg-foreground/80")}
                style={{
                  width: `${Math.max(2, pct)}%`,
                  opacity: 1 - i * 0.13,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

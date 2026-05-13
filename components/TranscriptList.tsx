import type { TranscriptLine } from "@/lib/api/types";

export function TranscriptList({ lines }: { lines: TranscriptLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transcript available.</p>
    );
  }
  return (
    <ol className="space-y-3">
      {lines.map((l, i) => (
        <li key={i} className="text-sm">
          <span
            className={
              l.role === "agent"
                ? "font-semibold text-foreground"
                : "font-semibold text-muted-foreground"
            }
          >
            {l.role === "agent" ? "Agent" : "Prospect"}
          </span>
          <span className="ml-2 text-foreground/90">{l.content}</span>
        </li>
      ))}
    </ol>
  );
}

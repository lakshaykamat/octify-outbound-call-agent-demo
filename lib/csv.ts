import { listCalls, type CallsQuery } from "@/lib/mock";
import type { XyloCall } from "@/lib/mock";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function buildCallsCsv(q: CallsQuery): Promise<Blob> {
  const all: XyloCall[] = [];
  let page = 1;
  const limit = 200;
  while (true) {
    const batch = await listCalls({ ...q, page, limit });
    all.push(...batch.calls);
    if (all.length >= batch.total || batch.calls.length === 0) break;
    page += 1;
    if (page > 200) break;
  }

  const headers = [
    "id", "started_at", "contact_name", "phone", "duration_sec",
    "outcome", "sentiment", "score", "summary",
    "objections_raised", "follow_up_action", "follow_up_date",
  ];

  const rows = all.map((c) => [
    c._id,
    c.startedAt ?? c.createdAt,
    c.prospectName ?? "",
    c.phone,
    c.durationSec ?? 0,
    c.analysis?.outcome ?? "",
    c.analysis?.sentiment ?? "",
    c.analysis?.score ?? "",
    c.analysis?.summary ?? "",
    c.analysis?.objectionsRaised?.join("; ") ?? "",
    c.analysis?.followUpAction ?? "",
    c.analysis?.followUpDate ?? "",
  ]);

  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

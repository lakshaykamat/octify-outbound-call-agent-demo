// Minimal CSV parser for demo imports. Handles quoted fields and embedded commas;
// does not aim to be RFC-perfect.

export type ParsedCsv = {
  columns: string[];
  rows: Array<Record<string, string>>;
};

export function parseCsv(text: string): ParsedCsv {
  const lines = splitLines(text);
  if (lines.length === 0) return { columns: [], rows: [] };
  const columns = splitRow(lines[0]);
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = splitRow(lines[i]);
    const row: Record<string, string> = {};
    for (let c = 0; c < columns.length; c++) {
      row[columns[c]] = (cells[c] ?? "").trim();
    }
    rows.push(row);
  }
  return { columns, rows };
}

function splitLines(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuote = !inQuote;
      buf += ch;
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuote) {
      if (buf.length > 0) out.push(buf);
      buf = "";
      if (ch === "\r" && text[i + 1] === "\n") i++;
      continue;
    }
    buf += ch;
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

function splitRow(line: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        buf += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (ch === "," && !inQuote) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out;
}

const MAPPING_HINTS: Record<string, string[]> = {
  fullName: ["name", "fullname", "full_name", "contact"],
  firstName: ["first", "firstname", "first_name", "given"],
  lastName: ["last", "lastname", "last_name", "surname", "family"],
  email: ["email", "e-mail", "mail"],
  phone: ["phone", "mobile", "cell", "telephone", "number"],
  company: ["company", "organization", "org", "account"],
  title: ["title", "role", "position"],
  city: ["city", "town"],
  region: ["state", "region", "province"],
};

export function autoMap(columns: string[]): { mapping: Record<string, string>; confidence: Record<string, number> } {
  const mapping: Record<string, string> = {};
  const confidence: Record<string, number> = {};
  for (const [field, hints] of Object.entries(MAPPING_HINTS)) {
    let best: { col: string; score: number } | null = null;
    for (const col of columns) {
      const lc = col.toLowerCase().replace(/[^a-z]/g, "");
      for (const hint of hints) {
        if (lc === hint.replace(/[^a-z]/g, "")) {
          if (!best || best.score < 100) best = { col, score: 100 };
        } else if (lc.includes(hint.replace(/[^a-z]/g, ""))) {
          if (!best || best.score < 70) best = { col, score: 70 };
        }
      }
    }
    if (best) {
      mapping[field] = best.col;
      confidence[field] = best.score;
    }
  }
  return { mapping, confidence };
}

export function validateRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
): { valid: boolean; reason?: string } {
  const phone = (row[mapping.phone] ?? "").trim();
  if (!phone) return { valid: false, reason: "Missing phone" };
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return { valid: false, reason: "Invalid phone" };
  return { valid: true };
}

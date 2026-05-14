"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileSpreadsheetIcon,
  FileTextIcon,
  SparklesIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CopyIcon,
  Loader2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  HelpCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { autoMap, parseCsv, validateRow, type ParsedCsv } from "@/lib/csv-parse";
import { useCampaigns, useImportLeads } from "@/hooks/queries";

type Step = 1 | 2 | 3 | 4 | 5;

const FIELDS = [
  { key: "fullName", label: "Full name" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone *" },
  { key: "company", label: "Company" },
  { key: "title", label: "Title" },
  { key: "city", label: "City" },
  { key: "region", label: "Region" },
];

const STEP_META: Array<{ id: Step; label: string; blurb: string }> = [
  { id: 1, label: "Source", blurb: "Pick where the data comes from" },
  { id: 2, label: "Mapping", blurb: "Match columns to lead fields" },
  { id: 3, label: "Validate", blurb: "Review valid, invalid, duplicates" },
  { id: 4, label: "Enrich", blurb: "Options and campaign assignment" },
  { id: 5, label: "Confirm", blurb: "Import and finish up" },
];

const SOURCE_TILES = [
  { id: "csv", label: "CSV upload", description: "Drag a file or browse" },
  { id: "gsheets", label: "Google Sheets", description: "Paste a sheet URL" },
  { id: "hubspot", label: "HubSpot", description: "Sync contacts" },
  { id: "salesforce", label: "Salesforce", description: "Sync leads" },
  { id: "pipedrive", label: "Pipedrive", description: "Sync people" },
];

const SAMPLE_CSV = `name,email,phone,company,title,city,state
Aiden Park,aiden.park@northcoreparts.com,+12135551080,Northcore Parts,Service Manager,Los Angeles,CA
Bea Costa,bea.costa@valleyautoworks.com,+16195551041,Valley Autoworks,Owner,San Diego,CA
Cyrus Maldonado,cyrus.m@ridgewayfleet.com,+13105551073,Ridgeway Fleet,Fleet Director,Long Beach,CA
Dara Whitfield,dara@anaheimcollision.com,+17145551018,Anaheim Collision,Body Shop Lead,Anaheim,CA
Elif Marchetti,elif@orangedealersgroup.com,+19495551007,Orange Dealers Group,Fixed Ops Director,Irvine,CA
Farhan Boateng,farhan.b@harborautobody.com,+15625551062,Harbor Auto Body,Estimator,Torrance,CA
Gia Rasmussen,gia@palmsmotorworks.com,+13235551094,Palms Motorworks,GM,Hollywood,CA
Hideo Salaman,hideo@compactdiesel.com,+18185551033,Compact Diesel,Parts Buyer,Burbank,CA
Imani Lockhart,imani@beachcityauto.com,+14245551086,Beach City Auto,Controller,Santa Monica,CA
Jovan Penaloza,jovan@westsidemotors.com,+13105551049,Westside Motors,Service Director,Los Angeles,CA`;

function StepRail({
  step,
  parsed,
  fileName,
  mapping,
  validCount,
  invalidCount,
}: {
  step: Step;
  parsed: ParsedCsv | null;
  fileName: string;
  mapping: Record<string, string>;
  validCount: number;
  invalidCount: number;
}) {
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  const subText = (id: Step): string | null => {
    if (id === 1) return parsed ? `${fileName}` : null;
    if (id === 2) return parsed ? `${mappedCount} of ${FIELDS.length} mapped` : null;
    if (id === 3 && parsed && step >= 3)
      return `${validCount.toLocaleString()} valid · ${invalidCount.toLocaleString()} invalid`;
    return null;
  };

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Import leads
        </p>
        <p className="mt-1 text-sm font-medium">5 steps · about a minute</p>

        <ol className="relative mt-5 space-y-1">
          <span
            aria-hidden
            className="absolute left-[19px] top-[21px] bottom-[21px] w-px bg-border"
          />
          {STEP_META.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            const sub = subText(s.id);
            return (
              <li
                key={s.id}
                className={cn(
                  "relative flex gap-3 rounded-lg px-2 py-2 transition-colors",
                  active && "bg-muted/60",
                )}
              >
                <div
                  className={cn(
                    "z-10 mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border bg-background text-[11px] font-semibold tabular-nums",
                    active && "border-foreground bg-foreground text-background",
                    done && "border-emerald-500/70 bg-emerald-500 text-white",
                    !active && !done && "text-muted-foreground",
                  )}
                >
                  {done ? <CheckIcon className="size-3" strokeWidth={3} /> : s.id}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "text-sm leading-tight",
                      active ? "font-semibold" : "font-medium",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-xs leading-tight",
                      active ? "text-muted-foreground" : "text-muted-foreground/70",
                    )}
                  >
                    {sub ?? s.blurb}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <a
        href="#"
        className="mt-3 flex items-center gap-2 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <HelpCircleIcon className="size-3.5" />
        How importing works
      </a>
    </aside>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SourceStep({
  onChooseCsv,
  onConnect,
}: {
  onChooseCsv: (text: string, fileName: string) => void;
  onConnect: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      onChooseCsv(String(reader.result ?? ""), file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Where are your leads coming from?"
        description="Drop a CSV or connect an existing source. We'll guess the columns next."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed bg-gradient-to-b from-muted/20 to-transparent px-6 py-14 text-center transition-all",
          dragging
            ? "scale-[1.005] border-foreground bg-muted/40"
            : "hover:border-foreground/40 hover:bg-muted/30",
        )}
      >
        <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
          <FileSpreadsheetIcon className="size-6 text-muted-foreground" strokeWidth={1.5} />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background ring-2 ring-card">
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V3M3 6l3-3 3 3" />
            </svg>
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">Drop a CSV here, or click to browse</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Up to 50 MB · UTF-8 encoded · first row is headers
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onChooseCsv(SAMPLE_CSV, "motornexo-sample.csv");
          }}
        >
          <FileTextIcon className="size-3.5" /> Use sample CSV
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Or connect a source
          </p>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SOURCE_TILES.filter((t) => t.id !== "csv").map((tile) => (
            <button
              key={tile.id}
              onClick={() => onConnect(tile.id)}
              className="group rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm"
            >
              <p className="text-sm font-medium">{tile.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tile.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MappingStep({
  parsed,
  fileName,
  mapping,
  confidence,
  onChange,
  onAiSuggest,
  shimmer,
}: {
  parsed: ParsedCsv;
  fileName: string;
  mapping: Record<string, string>;
  confidence: Record<string, number>;
  onChange: (field: string, column: string) => void;
  onAiSuggest: () => void;
  shimmer: boolean;
}) {
  const mappedCount = Object.values(mapping).filter(Boolean).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Map your columns"
          description={`We auto-detected ${mappedCount} of ${FIELDS.length} fields. Adjust anything that looks off.`}
        />
        <Button variant="outline" size="sm" onClick={onAiSuggest} disabled={shimmer}>
          <SparklesIcon className={cn("size-3.5", shimmer && "animate-pulse")} />
          {shimmer ? "Suggesting…" : "AI suggest"}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <CopyIcon className="size-3.5 text-muted-foreground" />
        <span className="truncate font-medium">{fileName}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {parsed.rows.length.toLocaleString()} rows · {parsed.columns.length} columns
        </span>
      </div>

      <div className="divide-y overflow-hidden rounded-xl border">
        {FIELDS.map((f) => {
          const col = mapping[f.key] ?? "";
          const conf = confidence[f.key] ?? 0;
          return (
            <div
              key={f.key}
              className="grid grid-cols-[140px_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <div className="text-sm font-medium">{f.label}</div>
              <div className="flex items-center gap-2">
                <Select
                  value={col || "__none"}
                  onValueChange={(v) => onChange(f.key, v === "__none" ? "" : v)}
                >
                  <SelectTrigger className="w-[220px]">
                    {col ? col : <span className="text-muted-foreground">— Not mapped —</span>}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Not mapped —</SelectItem>
                    {parsed.columns.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {col && (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      conf >= 90
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                        : conf >= 60
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                          : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {conf >= 90 ? "high" : conf >= 60 ? "medium" : "manual"}
                  </span>
                )}
              </div>
              <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                {col ? parsed.rows[0]?.[col] : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ValidateStep({
  parsed,
  mapping,
}: {
  parsed: ParsedCsv;
  mapping: Record<string, string>;
}) {
  const { valid, invalid, duplicates, sample, errors } = useMemo(() => {
    const phones = new Set<string>();
    let v = 0;
    let inv = 0;
    let dup = 0;
    const errs: Record<number, string> = {};
    parsed.rows.forEach((row, i) => {
      const check = validateRow(row, mapping);
      if (!check.valid) {
        inv++;
        errs[i] = check.reason ?? "Invalid";
        return;
      }
      const phone = row[mapping.phone];
      if (phones.has(phone)) {
        dup++;
        errs[i] = "Duplicate";
        return;
      }
      phones.add(phone);
      v++;
    });
    return {
      valid: v,
      invalid: inv,
      duplicates: dup,
      sample: parsed.rows.slice(0, 50),
      errors: errs,
    };
  }, [parsed, mapping]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Review what we'll import"
        description="Invalid and duplicate rows are skipped. Valid rows are ready to go."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-emerald-500/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
            Valid
          </p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums">
            {valid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-rose-500/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-600">
            Invalid
          </p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums">
            {invalid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-amber-500/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
            Duplicates
          </p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums">
            {duplicates.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Preview · first {sample.length} rows
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {parsed.rows.length.toLocaleString()} total
          </p>
        </div>
        <div className="max-h-[44vh] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                {parsed.columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground">{c}</th>
                ))}
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => {
                const err = errors[i];
                return (
                  <tr key={i} className={cn("border-t", err && "bg-rose-500/5")}>
                    <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{i + 1}</td>
                    {parsed.columns.map((c) => (
                      <td key={c} className="px-3 py-1.5">{row[c]}</td>
                    ))}
                    <td className="px-3 py-1.5">
                      {err ? (
                        <span className="inline-flex items-center gap-1 text-rose-600">
                          <XCircleIcon className="size-3" /> {err}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2Icon className="size-3" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EnrichStep({
  options,
  setOptions,
  campaigns,
}: {
  options: { skipDuplicates: boolean; enrich: boolean; campaignId: string | null };
  setOptions: (o: typeof options) => void;
  campaigns: Array<{ id: string; name: string }>;
}) {
  const selectedCampaign = campaigns.find((c) => c.id === options.campaignId);
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Last touches before we import"
        description="Tweak how duplicates are handled and where these leads should land."
      />

      <div className="rounded-xl border bg-card">
        <label className="flex cursor-pointer items-start gap-3 border-b p-4 transition-colors hover:bg-muted/30">
          <Checkbox
            className="mt-0.5"
            checked={options.skipDuplicates}
            onCheckedChange={(c) => setOptions({ ...options, skipDuplicates: c === true })}
          />
          <div>
            <p className="text-sm font-medium">Skip duplicates</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Don&apos;t re-import phones or emails that already exist in your CRM.
            </p>
          </div>
        </label>
        <label className="flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-muted/30">
          <Checkbox
            className="mt-0.5"
            checked={options.enrich}
            onCheckedChange={(c) => setOptions({ ...options, enrich: c === true })}
          />
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium">
              <SparklesIcon className="size-3.5" /> Enrich missing fields
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Auto-fill industry, company size, and timezone from public sources.
            </p>
          </div>
        </label>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Auto-assign to campaign</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drop everyone we import straight into an active campaign.
        </p>
        <Select
          value={options.campaignId ?? "__none"}
          onValueChange={(v) =>
            setOptions({ ...options, campaignId: v === "__none" ? null : v })
          }
        >
          <SelectTrigger className="mt-3 w-full sm:w-[320px]">
            {selectedCampaign ? (
              selectedCampaign.name
            ) : (
              <span className="text-muted-foreground">Don&apos;t assign</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Don&apos;t assign</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ConfirmStep({
  validCount,
  imported,
  isPending,
}: {
  validCount: number;
  imported: number;
  isPending: boolean;
}) {
  const pct = validCount > 0 ? Math.min(100, Math.round((imported / validCount) * 100)) : 0;
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center space-y-5 rounded-xl border bg-gradient-to-b from-muted/20 to-transparent p-10 text-center">
      {isPending ? (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground/5 ring-1 ring-border">
            <Loader2Icon className="size-6 animate-spin text-foreground/70" />
          </div>
          <div>
            <p className="text-base font-semibold">
              Importing {validCount.toLocaleString()} leads…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually takes a few seconds.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle2Icon className="size-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-base font-semibold">
              Imported {imported.toLocaleString()} of {validCount.toLocaleString()} leads
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Redirecting you back to leads…</p>
          </div>
        </>
      )}
      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">{pct}%</p>
    </div>
  );
}

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [shimmer, setShimmer] = useState(false);
  const [options, setOptions] = useState({
    skipDuplicates: true,
    enrich: true,
    campaignId: null as string | null,
  });
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);

  const campaigns = useCampaigns();
  const importMut = useImportLeads();

  const acceptCsv = (text: string, name: string) => {
    const p = parseCsv(text);
    setFileName(name);
    setParsed(p);
    const { mapping: m, confidence: c } = autoMap(p.columns);
    setMapping(m);
    setConfidence(c);
    setStep(2);
  };

  const fakeOauth = (provider: string) => {
    toast.loading(`Connecting to ${provider}…`, { id: provider });
    setTimeout(() => {
      toast.success(`Connected to ${provider}. Pulling contacts…`, { id: provider });
      setTimeout(() => acceptCsv(SAMPLE_CSV, `${provider}.csv`), 700);
    }, 1100);
  };

  const aiSuggest = () => {
    setShimmer(true);
    setTimeout(() => {
      if (parsed) {
        const { mapping: m, confidence: c } = autoMap(parsed.columns);
        setMapping(m);
        setConfidence(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.max(85, v)])));
      }
      setShimmer(false);
      toast.success("AI suggestions applied");
    }, 1200);
  };

  const { validCount, invalidCount } = useMemo(() => {
    if (!parsed) return { validCount: 0, invalidCount: 0 };
    const phones = new Set<string>();
    let v = 0;
    let inv = 0;
    for (const row of parsed.rows) {
      if (!validateRow(row, mapping).valid) {
        inv++;
        continue;
      }
      const phone = row[mapping.phone];
      if (phones.has(phone)) {
        inv++;
        continue;
      }
      phones.add(phone);
      v++;
    }
    return { validCount: v, invalidCount: inv };
  }, [parsed, mapping]);

  const launchImport = async () => {
    if (!parsed) return;
    setStep(5);
    const res = await importMut.mutateAsync({
      rows: parsed.rows,
      mapping,
      options,
    });
    setImportResult({ imported: res.imported });
    toast.success(`Imported ${res.imported.toLocaleString()} leads`);
    setTimeout(() => router.push("/leads"), 1100);
  };

  const canAdvance = (() => {
    if (step === 1) return !!parsed;
    if (step === 2) return !!mapping.phone;
    if (step === 3) return validCount > 0;
    if (step === 4) return true;
    return false;
  })();

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <StepRail
        step={step}
        parsed={parsed}
        fileName={fileName}
        mapping={mapping}
        validCount={validCount}
        invalidCount={invalidCount}
      />

      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex-1 p-6 sm:p-8">
          {step === 1 && (
            <SourceStep onChooseCsv={acceptCsv} onConnect={fakeOauth} />
          )}
          {step === 2 && parsed && (
            <MappingStep
              parsed={parsed}
              fileName={fileName}
              mapping={mapping}
              confidence={confidence}
              onChange={(field, col) => {
                setMapping((prev) => ({ ...prev, [field]: col }));
                setConfidence((prev) => ({ ...prev, [field]: 100 }));
              }}
              onAiSuggest={aiSuggest}
              shimmer={shimmer}
            />
          )}
          {step === 3 && parsed && <ValidateStep parsed={parsed} mapping={mapping} />}
          {step === 4 && (
            <EnrichStep
              options={options}
              setOptions={setOptions}
              campaigns={(campaigns.data ?? []).filter((c) => c.status !== "completed")}
            />
          )}
          {step === 5 && (
            <ConfirmStep
              validCount={validCount}
              imported={importResult?.imported ?? 0}
              isPending={importMut.isPending}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(1, (s - 1) as Step) as Step)}
            disabled={step === 1 || step === 5}
          >
            <ArrowLeftIcon className="size-3.5" /> Back
          </Button>
          <p className="text-xs text-muted-foreground tabular-nums">
            Step {step} of 5
          </p>
          {step < 4 && (
            <Button
              size="sm"
              onClick={() => setStep((s) => Math.min(5, (s + 1) as Step) as Step)}
              disabled={!canAdvance}
            >
              Continue <ArrowRightIcon className="size-3.5" />
            </Button>
          )}
          {step === 4 && (
            <Button size="sm" onClick={launchImport}>
              Import {validCount.toLocaleString()} leads <ArrowRightIcon className="size-3.5" />
            </Button>
          )}
          {step === 5 && (
            <Button size="sm" variant="ghost" disabled>
              Finishing…
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

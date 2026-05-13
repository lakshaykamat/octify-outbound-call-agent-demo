"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UploadCloudIcon,
  FileTextIcon,
  SparklesIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CopyIcon,
  Loader2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

function StepDot({ active, done, label, index }: { active: boolean; done: boolean; label: string; index: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
          active && "border-foreground bg-foreground text-background",
          done && !active && "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
          !active && !done && "border-border bg-muted text-muted-foreground",
        )}
      >
        {done ? <CheckCircle2Icon className="size-3.5" /> : index}
      </div>
      <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Source", "Mapping", "Validate", "Enrich", "Confirm"];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      {labels.map((label, i) => {
        const idx = (i + 1) as Step;
        return (
          <div key={label} className="flex items-center gap-3">
            <StepDot
              index={idx}
              active={step === idx}
              done={step > idx}
              label={label}
            />
            {i < labels.length - 1 && (
              <span className="hidden h-px w-6 bg-border sm:block" />
            )}
          </div>
        );
      })}
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
    <div className="space-y-4">
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
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center transition-colors",
          dragging ? "border-foreground bg-muted/40" : "hover:bg-muted/30",
        )}
      >
        <UploadCloudIcon className="size-9 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Drop a CSV here or click to browse</p>
          <p className="text-xs text-muted-foreground">
            We&apos;ll auto-detect the columns next.
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
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Or connect a source
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SOURCE_TILES.filter((t) => t.id !== "csv").map((tile) => (
            <button
              key={tile.id}
              onClick={() => onConnect(tile.id)}
              className="rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40"
            >
              <p className="text-sm font-medium">{tile.label}</p>
              <p className="text-xs text-muted-foreground">{tile.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MappingStep({
  parsed,
  mapping,
  confidence,
  onChange,
  onAiSuggest,
  shimmer,
}: {
  parsed: ParsedCsv;
  mapping: Record<string, string>;
  confidence: Record<string, number>;
  onChange: (field: string, column: string) => void;
  onAiSuggest: () => void;
  shimmer: boolean;
}) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Column mapping</p>
          <p className="text-xs text-muted-foreground">
            We auto-detected {Object.keys(mapping).length} of {FIELDS.length} fields.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onAiSuggest} disabled={shimmer}>
          <SparklesIcon className={cn("size-3.5", shimmer && "animate-pulse")} />
          {shimmer ? "Suggesting…" : "AI suggest"}
        </Button>
      </div>

      <div className="divide-y rounded-lg border">
        {FIELDS.map((f) => {
          const col = mapping[f.key] ?? "";
          const conf = confidence[f.key] ?? 0;
          return (
            <div key={f.key} className="flex items-center gap-3 p-3">
              <div className="w-32 text-sm font-medium">{f.label}</div>
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
                    "ml-2 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
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
              <span className="ml-auto truncate text-xs text-muted-foreground">
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
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-emerald-500/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">
            Valid
          </p>
          <p className="text-2xl font-semibold tabular-nums">{valid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-rose-500/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-rose-600">
            Invalid
          </p>
          <p className="text-2xl font-semibold tabular-nums">{invalid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-amber-500/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-600">
            Duplicates
          </p>
          <p className="text-2xl font-semibold tabular-nums">{duplicates.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          Preview · first {sample.length} rows
        </div>
        <div className="max-h-[40vh] overflow-auto">
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
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4">
        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={options.skipDuplicates}
              onCheckedChange={(c) => setOptions({ ...options, skipDuplicates: c === true })}
            />
            <div>
              <p className="text-sm font-medium">Skip duplicates</p>
              <p className="text-xs text-muted-foreground">
                Don&apos;t re-import phones or emails that already exist in your CRM.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={options.enrich}
              onCheckedChange={(c) => setOptions({ ...options, enrich: c === true })}
            />
            <div>
              <p className="text-sm font-medium">
                <span className="inline-flex items-center gap-1">
                  <SparklesIcon className="size-3.5" /> Enrich missing fields
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-fill industry, company size, and timezone from public sources.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-2 text-sm font-medium">Auto-assign to campaign</p>
        <Select
          value={options.campaignId ?? "__none"}
          onValueChange={(v) =>
            setOptions({ ...options, campaignId: v === "__none" ? null : v })
          }
        >
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Don't assign" />
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
    <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
      {isPending ? (
        <>
          <Loader2Icon className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium">Importing {validCount.toLocaleString()} leads…</p>
        </>
      ) : (
        <>
          <CheckCircle2Icon className="mx-auto size-8 text-emerald-500" />
          <p className="text-sm font-medium">
            Imported {imported.toLocaleString()} of {validCount.toLocaleString()} valid leads
          </p>
        </>
      )}
      <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-muted">
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

  const validCount = useMemo(() => {
    if (!parsed) return 0;
    const phones = new Set<string>();
    let n = 0;
    for (const row of parsed.rows) {
      if (!validateRow(row, mapping).valid) continue;
      const phone = row[mapping.phone];
      if (phones.has(phone)) continue;
      phones.add(phone);
      n++;
    }
    return n;
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
    <div className="space-y-4">
      <Stepper step={step} />

      {step === 1 && (
        <SourceStep onChooseCsv={acceptCsv} onConnect={fakeOauth} />
      )}
      {step === 2 && parsed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <CopyIcon className="size-3.5 text-muted-foreground" />
            <span className="truncate font-medium">{fileName}</span>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {parsed.rows.length.toLocaleString()} rows · {parsed.columns.length} columns
            </span>
          </div>
          <MappingStep
            parsed={parsed}
            mapping={mapping}
            confidence={confidence}
            onChange={(field, col) => {
              setMapping((prev) => ({ ...prev, [field]: col }));
              setConfidence((prev) => ({ ...prev, [field]: 100 }));
            }}
            onAiSuggest={aiSuggest}
            shimmer={shimmer}
          />
        </div>
      )}
      {step === 3 && parsed && (
        <ValidateStep parsed={parsed} mapping={mapping} />
      )}
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

      <div className="flex items-center justify-between rounded-xl border bg-card p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep((s) => Math.max(1, (s - 1) as Step) as Step)}
          disabled={step === 1 || step === 5}
        >
          <ArrowLeftIcon className="size-3.5" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">
          Step {step} of 5
        </div>
        {step < 4 && (
          <Button
            size="sm"
            onClick={() => setStep((s) => Math.min(5, (s + 1) as Step) as Step)}
            disabled={!canAdvance}
          >
            Next <ArrowRightIcon className="size-3.5" />
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
  );
}

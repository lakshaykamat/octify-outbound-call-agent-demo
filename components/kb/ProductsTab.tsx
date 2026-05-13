"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Upload } from "lucide-react";
import { SectionCard } from "@/components/patterns";
import { Button } from "@/components/ui/button";
import { EditableEntry, type Field } from "./EditableEntry";
import { useExtractKbProducts, useUpdateKnowledgeBase } from "@/hooks/queries";
import type { KbProduct, KnowledgeBase } from "@/lib/mock";
import { cn } from "@/lib/utils";

const FIELDS: Field<KbProduct>[] = [
  { key: "name",        label: "Product name",  placeholder: "Groovo Suite" },
  { key: "price",       label: "Price",         placeholder: "$1,200 / month" },
  { key: "description", label: "Description",   multiline: true,  placeholder: "Short summary of what this is and who it's for." },
  { key: "pitch",       label: "One-liner pitch", multiline: true, placeholder: "Sentence the agent reaches for on a call." },
];

const EMPTY: KbProduct = { name: "", description: "", price: "", pitch: "" };

function PdfDropZone({ onAdd }: { onAdd: (next: KbProduct[]) => void }) {
  const extract = useExtractKbProducts();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  async function handleFile(file: File) {
    try {
      const res = await extract.mutateAsync(file.name);
      onAdd(res.products);
      toast.success(`Extracted ${res.products.length} products from ${file.name} (${res.pages} pages)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.click(); }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-6 text-center transition hover:border-foreground/30",
        drag && "border-primary bg-primary/[0.04]",
        extract.isPending && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {extract.isPending ? (
        <>
          <FileText className="size-6 animate-pulse text-muted-foreground" />
          <div className="text-sm font-medium">Reading PDF…</div>
          <div className="text-xs text-muted-foreground">
            Extracting products, prices, and positioning.
          </div>
        </>
      ) : (
        <>
          <Upload className="size-6 text-muted-foreground" />
          <div className="text-sm font-medium">Drop a one-pager to extract products</div>
          <div className="text-xs text-muted-foreground">
            PDF or Word · the AI fills in product cards you can edit.
          </div>
        </>
      )}
    </div>
  );
}

export function ProductsTab({ kb }: { kb: KnowledgeBase }) {
  const update = useUpdateKnowledgeBase();
  const [adding, setAdding] = useState(false);

  async function commit(next: KbProduct[]) {
    try {
      await update.mutateAsync({ products: next });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function updateAt(i: number, v: KbProduct) {
    const next = [...kb.products];
    next[i] = v;
    return commit(next).then(() => toast.success("Product updated"));
  }
  function removeAt(i: number) {
    const next = kb.products.filter((_, idx) => idx !== i);
    return commit(next).then(() => toast.success("Product removed"));
  }
  function addOne(v: KbProduct) {
    return commit([...kb.products, v]).then(() => {
      setAdding(false);
      toast.success("Product added");
    });
  }
  function addMany(vs: KbProduct[]) {
    return commit([...kb.products, ...vs]);
  }

  return (
    <SectionCard
      title="Products"
      description="What the agent can talk about, how it's priced, and the one-line pitch."
      action={
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="size-3.5" />
          Add product
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <PdfDropZone onAdd={addMany} />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {adding ? (
            <EditableEntry
              value={EMPTY}
              fields={FIELDS}
              view={() => null}
              initiallyEditing
              onCancelNew={() => setAdding(false)}
              onSave={addOne}
              onDelete={() => setAdding(false)}
            />
          ) : null}
          {kb.products.map((p, i) => (
            <EditableEntry
              key={`${p.name}-${i}`}
              value={p}
              fields={FIELDS}
              view={(v) => (
                <div>
                  <div className="flex items-baseline justify-between gap-3 pr-16">
                    <div className="text-sm font-semibold">{v.name}</div>
                    <div className="text-xs font-medium text-muted-foreground">{v.price}</div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                  <p className="mt-2 text-sm italic">&ldquo;{v.pitch}&rdquo;</p>
                </div>
              )}
              onSave={(next) => updateAt(i, next)}
              onDelete={() => removeAt(i)}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

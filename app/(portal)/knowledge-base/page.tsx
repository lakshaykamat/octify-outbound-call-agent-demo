"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorCard } from "@/components/ErrorCard";
import { ProductsTab } from "@/components/kb/ProductsTab";
import { ObjectionsTab } from "@/components/kb/ObjectionsTab";
import { CaseStudiesTab } from "@/components/kb/CaseStudiesTab";
import { FaqsTab } from "@/components/kb/FaqsTab";
import { NotesTab } from "@/components/kb/NotesTab";
import { GuardsTab } from "@/components/kb/GuardsTab";
import { useKnowledgeBase } from "@/hooks/queries";

const TAB_VALUES = ["products", "objections", "case-studies", "faqs", "notes", "guards"] as const;

export default function KnowledgeBasePage() {
  const kb = useKnowledgeBase();

  if (kb.isLoading) {
    return (
      <div className="space-y-3 px-4 lg:px-6">
        <Skeleton className="h-10 w-[420px]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }
  if (kb.isError || !kb.data) {
    return (
      <div className="px-4 lg:px-6">
        <ErrorCard
          message="Knowledge base unavailable."
          detail={kb.error instanceof Error ? kb.error.message : undefined}
        />
      </div>
    );
  }
  const data = kb.data;

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Tabs defaultValue={TAB_VALUES[0]} className="gap-0">
        <TabsList variant="line" className="h-auto w-full justify-start gap-1 border-b p-0">
          <TabsTrigger value="products" className="!flex-none px-3">Products ({data.products.length})</TabsTrigger>
          <TabsTrigger value="objections" className="!flex-none px-3">Objections ({data.objections.length})</TabsTrigger>
          <TabsTrigger value="case-studies" className="!flex-none px-3">Case studies ({data.caseStudies.length})</TabsTrigger>
          <TabsTrigger value="faqs" className="!flex-none px-3">FAQs ({data.faqs.length})</TabsTrigger>
          <TabsTrigger value="notes" className="!flex-none px-3">Notes</TabsTrigger>
          <TabsTrigger value="guards" className="!flex-none px-3">Guards</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="pt-6"><ProductsTab kb={data} /></TabsContent>
        <TabsContent value="objections" className="pt-6"><ObjectionsTab kb={data} /></TabsContent>
        <TabsContent value="case-studies" className="pt-6"><CaseStudiesTab kb={data} /></TabsContent>
        <TabsContent value="faqs" className="pt-6"><FaqsTab kb={data} /></TabsContent>
        <TabsContent value="notes" className="pt-6"><NotesTab kb={data} /></TabsContent>
        <TabsContent value="guards" className="pt-6"><GuardsTab kb={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

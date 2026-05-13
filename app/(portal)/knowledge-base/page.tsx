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
      <Tabs defaultValue={TAB_VALUES[0]}>
        <TabsList>
          <TabsTrigger value="products">Products ({data.products.length})</TabsTrigger>
          <TabsTrigger value="objections">Objections ({data.objections.length})</TabsTrigger>
          <TabsTrigger value="case-studies">Case studies ({data.caseStudies.length})</TabsTrigger>
          <TabsTrigger value="faqs">FAQs ({data.faqs.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="guards">Guards</TabsTrigger>
        </TabsList>
        <TabsContent value="products"><ProductsTab kb={data} /></TabsContent>
        <TabsContent value="objections"><ObjectionsTab kb={data} /></TabsContent>
        <TabsContent value="case-studies"><CaseStudiesTab kb={data} /></TabsContent>
        <TabsContent value="faqs"><FaqsTab kb={data} /></TabsContent>
        <TabsContent value="notes"><NotesTab kb={data} /></TabsContent>
        <TabsContent value="guards"><GuardsTab kb={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

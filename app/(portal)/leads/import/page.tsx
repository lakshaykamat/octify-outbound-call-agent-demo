import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/patterns";
import { ImportWizard } from "@/components/leads/ImportWizard";

export default function ImportLeadsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Import leads"
        description="Drag a CSV, map columns, validate, and launch into your CRM."
        actions={
          <Button variant="outline" size="sm" render={<Link href="/leads" />}>
            <ArrowLeftIcon className="size-3.5" /> Back to leads
          </Button>
        }
      />
      <div className="px-4 lg:px-6">
        <ImportWizard />
      </div>
    </>
  );
}

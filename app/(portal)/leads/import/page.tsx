import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "@/components/leads/ImportWizard";

export default function ImportLeadsPage() {
  return (
    <>
      <div className="flex items-center justify-end px-4 lg:px-6">
        <Button variant="outline" size="sm" render={<Link href="/leads" />}>
          <ArrowLeftIcon className="size-3.5" /> Back to leads
        </Button>
      </div>
      <div className="px-4 lg:px-6">
        <ImportWizard />
      </div>
    </>
  );
}

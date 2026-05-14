import Link from "next/link";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "@/components/leads/ImportWizard";

export default function ImportLeadsPage() {
  return (
    <div className="flex flex-col gap-5 px-4 lg:px-6">
      <header className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/leads"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Leads
          </Link>
          <ChevronRightIcon className="size-3.5 text-muted-foreground/60" />
          <span className="font-medium">Import</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Draft auto-saved
          </span>
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </div>
      </header>

      <ImportWizard />
    </div>
  );
}

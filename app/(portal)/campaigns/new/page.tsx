import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/patterns";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="New campaign"
        description="Define an audience, pick an agent, set a schedule, and launch."
        actions={
          <Button variant="outline" size="sm" render={<Link href="/campaigns" />}>
            <ArrowLeftIcon className="size-3.5" /> Cancel
          </Button>
        }
      />
      <div className="px-4 lg:px-6">
        <CampaignBuilder />
      </div>
    </>
  );
}

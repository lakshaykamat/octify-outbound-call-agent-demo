import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";

export default function NewCampaignPage() {
  return (
    <>
      <div className="flex items-center justify-end px-4 lg:px-6">
        <Button variant="outline" size="sm" render={<Link href="/campaigns" />}>
          <ArrowLeftIcon className="size-3.5" /> Cancel
        </Button>
      </div>
      <div className="px-4 lg:px-6">
        <CampaignBuilder />
      </div>
    </>
  );
}

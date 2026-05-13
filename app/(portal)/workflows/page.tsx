"use client";

import { PageHeader } from "@/components/patterns";
import { CrmRulesCard } from "@/components/workflows/CrmRulesCard";
import { SegmentSchedulesCard } from "@/components/workflows/SegmentSchedulesCard";
import { RetryPoliciesCard } from "@/components/workflows/RetryPoliciesCard";

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Automation"
        title="Workflows"
        description="The rules behind every call — what happens after an outcome, when the agent dials each segment, and how it retries."
      />
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <CrmRulesCard />
        <div className="grid gap-4 lg:grid-cols-2">
          <SegmentSchedulesCard />
          <RetryPoliciesCard />
        </div>
      </div>
    </>
  );
}

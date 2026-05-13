"use client";

import { PageHeader } from "@/components/patterns";
import { InboxList } from "@/components/inbox/InboxList";
import { useInboxCounts } from "@/hooks/queries";

export default function InboxPage() {
  const counts = useInboxCounts();
  return (
    <>
      <PageHeader
        eyebrow="Human-in-the-loop"
        title="Inbox"
        description="Anything that needs a human follow-up — hot replies, failed CRM writebacks, and agent errors."
        actions={
          counts.data ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {counts.data.unread} unread · {counts.data.total} total
            </span>
          ) : null
        }
      />
      <div className="px-4 lg:px-6">
        <InboxList />
      </div>
    </>
  );
}

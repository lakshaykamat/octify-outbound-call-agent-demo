"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorCard } from "@/components/ErrorCard";
import { useOrganization } from "@/hooks/queries";
import type { Organization } from "@/lib/api/types";
import { PageHeader } from "@/components/patterns";

function OrgHeader() {
  return (
    <PageHeader
      eyebrow="Profile"
      title="Organisation"
      description="Identity and positioning the agent uses on every call."
    />
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 break-words font-mono text-xs tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function OrgHeroCard({ o }: { o: Organization }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Organisation
        </span>
        <CardTitle className="text-2xl tracking-tight">{o.name}</CardTitle>
        {o.website ? (
          <CardDescription>
            <a
              href={o.website}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {o.website.replace(/^https?:\/\//, "")}
            </a>
          </CardDescription>
        ) : null}
        {o.industry ? (
          <CardAction>
            <Badge variant="secondary" className="shrink-0">
              {o.industry}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      {o.description ? (
        <CardContent>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {o.description}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function OrgIdentityCard({ o }: { o: Organization }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Organisation ID" value={o.id} />
          <Field label="Owner role" value={o.ownerRole || "—"} />
          <Field
            label="Segment"
            value={o.customerSegment ? o.customerSegment.toUpperCase() : "—"}
          />
          <Field label="Sales channel" value={o.salesChannel || "—"} />
        </dl>
      </CardContent>
    </Card>
  );
}

function ProductsCard({ o }: { o: Organization }) {
  const enabled = Object.entries(o.enabledProducts)
    .filter(([, v]) => v?.enabled)
    .map(([k]) => k);
  if (enabled.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products enabled</CardTitle>
        <CardDescription>
          {enabled.length} {enabled.length === 1 ? "product" : "products"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {enabled.map((p) => (
            <Badge key={p} variant="secondary">
              {p}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IcpCard({ o }: { o: Organization }) {
  if (o.icps.length === 0 && o.icpLocations.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ideal customer profile</CardTitle>
        {o.icpLocations.length > 0 ? (
          <CardDescription>{o.icpLocations.join(" · ")}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {o.icps.length > 0 ? (
          <ul className="divide-y">
            {o.icps.map((icp, i) => (
              <li
                key={i}
                className="py-3 text-sm leading-relaxed first:pt-0 last:pb-0"
              >
                {icp}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No ICPs configured.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizationPage() {
  const org = useOrganization();
  if (org.isError)
    return (
      <>
        <OrgHeader />
        <div className="px-4 lg:px-6">
          <ErrorCard
            message="Couldn't load organisation."
            detail={org.error instanceof Error ? org.error.message : undefined}
          />
        </div>
      </>
    );
  if (org.isLoading || !org.data) {
    return (
      <>
        <OrgHeader />
        <div className="flex flex-col gap-4 px-4 lg:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </div>
      </>
    );
  }
  const o = org.data;
  return (
    <>
    <OrgHeader />
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <OrgHeroCard o={o} />
        <div className="flex flex-col gap-4">
          <OrgIdentityCard o={o} />
          <ProductsCard o={o} />
        </div>
      </div>
      <IcpCard o={o} />
    </div>
    </>
  );
}

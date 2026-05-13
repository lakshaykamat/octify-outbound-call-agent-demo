"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/queries";
import { toast } from "sonner";
import { Download, Sparkles } from "lucide-react";

function Meter({
  label, used, included, unit,
}: { label: string; used: number; included: number; unit: string }) {
  const pct = Math.min(100, Math.round((used / included) * 100));
  const over = pct >= 90;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {used.toLocaleString()} / {included.toLocaleString()} {unit}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-amber-500" : "bg-foreground/80"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {pct}% of monthly allotment used
      </div>
    </div>
  );
}

const INVOICES = [
  { id: "INV-2026-05", period: "May 2026", amount: 1490, status: "paid" },
  { id: "INV-2026-04", period: "Apr 2026", amount: 1490, status: "paid" },
  { id: "INV-2026-03", period: "Mar 2026", amount: 1290, status: "paid" },
  { id: "INV-2026-02", period: "Feb 2026", amount: 1290, status: "paid" },
];

export function BillingSection() {
  const analytics = useAnalytics();

  if (analytics.isLoading || !analytics.data) return <Skeleton className="h-[480px]" />;

  // Derive realistic usage from the seeded total calls.
  const totalCalls = analytics.data.totalCalls ?? 6500;
  const dialMinutes = Math.round(totalCalls * 2.6); // ~2m 40s avg
  const enrichments = Math.round(totalCalls * 0.6);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Current plan</CardTitle>
              <CardDescription>Renews June 1, 2026</CardDescription>
            </div>
            <Badge>Scale</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">$1,490</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <Meter label="Dial minutes" used={dialMinutes} included={25000} unit="min" />
          <Meter label="Lead enrichments" used={enrichments} included={5000} unit="enrich" />
          <Meter label="Active campaigns" used={4} included={10} unit="campaigns" />
          <div className="flex gap-2">
            <Button onClick={() => toast.message("Redirecting to checkout…")}>
              <Sparkles className="size-3.5" /> Upgrade
            </Button>
            <Button variant="outline" onClick={() => toast.message("Payment method updated")}>
              Update payment method
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Last 4 statements</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {INVOICES.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs">{inv.id}</p>
                  <p className="text-xs text-muted-foreground">{inv.period}</p>
                </div>
                <span className="font-mono text-sm tabular-nums">${inv.amount.toLocaleString()}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => toast.success(`${inv.id}.pdf downloaded`)}
                  aria-label="Download invoice"
                >
                  <Download className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

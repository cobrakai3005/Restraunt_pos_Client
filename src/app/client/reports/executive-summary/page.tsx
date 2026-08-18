"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function ExecutiveSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Sales Summary</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          High-level executive overview of sales, taxes, discounts, refunds, payment splits, and dine-in vs takeaway share.
        </p>
      </div>
      <PosReportsHub defaultTab="executive" />
    </div>
  );
}
"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function VariationSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Variation Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Menu item variant and portion-level sales, unit pricing, quantity, and tax breakdown.
        </p>
      </div>
      <PosReportsHub defaultTab="variation" />
    </div>
  );
}

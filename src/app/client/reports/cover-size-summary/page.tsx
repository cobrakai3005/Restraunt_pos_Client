"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function CoverSizeSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cover Size Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Headcount party brackets (Solo, Pair, 4 Covers, 5-6 Group, 7+ Large Party) with APC and revenue.
        </p>
      </div>
      <PosReportsHub defaultTab="cover-size" />
    </div>
  );
}

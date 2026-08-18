"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function ItemSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Item Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Menu item performance with BOM recipe costing, gross sales, gross profit, and profit margins.
        </p>
      </div>
      <PosReportsHub defaultTab="item" />
    </div>
  );
}

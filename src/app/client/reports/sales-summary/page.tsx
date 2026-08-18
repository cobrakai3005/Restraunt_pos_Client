"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function SalesSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Periodic daily sales breakdown with gross, net sales, taxes, discounts, and tender splits.
        </p>
      </div>
      <PosReportsHub defaultTab="sales" />
    </div>
  );
}

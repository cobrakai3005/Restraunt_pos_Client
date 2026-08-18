"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function CategorySummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Category Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Category-wise quantity sold, gross revenue, taxes, net sales, and percentage share.
        </p>
      </div>
      <PosReportsHub defaultTab="category" />
    </div>
  );
}

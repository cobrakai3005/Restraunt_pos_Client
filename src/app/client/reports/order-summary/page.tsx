"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function OrderSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Complete POS order logs with covers, status, subtotal, discounts, tax, and settlement methods.
        </p>
      </div>
      <PosReportsHub defaultTab="order" />
    </div>
  );
}

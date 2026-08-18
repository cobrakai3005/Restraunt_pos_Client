"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Restaurant POS Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Comprehensive operational and financial reports for your restaurants. Filter by date, restaurant, search, and export as CSV or Excel.
        </p>
      </div>

      <PosReportsHub defaultTab="executive" />
    </div>
  );
}
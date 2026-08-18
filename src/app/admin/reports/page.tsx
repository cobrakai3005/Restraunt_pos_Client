"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Admin - POS Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select any restaurant across all clients to analyze real-time sales, profitability, category trends, and export records.
        </p>
      </div>

      <PosReportsHub hideRestaurantSelector={false} defaultTab="executive" />
    </div>
  );
}

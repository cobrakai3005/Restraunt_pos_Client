"use client";

import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

export default function GroupSummaryPage() {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Group Summary Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kitchen station performance and modifier/add-on group revenue share.
        </p>
      </div>
      <PosReportsHub defaultTab="group" />
    </div>
  );
}

import { ReportView } from "@/components/client/reports/report-view";

export const metadata = {
  title: "Executive Summary Report | Vinimay",
  description: "Revenue, profit, food cost and category share at a glance.",
};

export default function ExecutiveSummaryReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Summary Report</h1>
        <p className="text-muted-foreground mt-1">
          Revenue, profit, orders and category share at a glance. Export as CSV anytime.
        </p>
      </div>
      <ReportView reportType="summary" />
    </div>
  );
}
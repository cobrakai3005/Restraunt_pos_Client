import { ReportView } from "@/components/client/reports/report-view";

export const metadata = {
  title: "Hourly Peak Sales Report | Vinimay",
  description: "24-hour revenue and order count rush curve.",
};

export default function HourlySalesReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hourly Peak Sales Report</h1>
        <p className="text-muted-foreground mt-1">
          24-hour cycle of revenue and order counts to find lunch and dinner peaks. Export as CSV anytime.
        </p>
      </div>
      <ReportView reportType="hourly" />
    </div>
  );
}
import { ReportView } from "@/components/client/reports/report-view";

export const metadata = {
  title: "Staff Sales Report | Vinimay",
  description: "Waiter and server sales leaderboard.",
};

export default function StaffSalesReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Sales Report</h1>
        <p className="text-muted-foreground mt-1">
          Orders handled and revenue produced per server. Export as CSV anytime.
        </p>
      </div>
      <ReportView reportType="staff" />
    </div>
  );
}
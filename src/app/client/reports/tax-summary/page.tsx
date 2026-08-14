import { ReportView } from "@/components/client/reports/report-view";

export const metadata = {
  title: "GSTR Tax Summary Report | Vinimay",
  description: "CGST/SGST collection summary and payment tender breakdown.",
};

export default function TaxSummaryReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GSTR Tax Summary Report</h1>
        <p className="text-muted-foreground mt-1">
          Taxable sales base, CGST/SGST collected and payment method split. Export as CSV anytime.
        </p>
      </div>
      <ReportView reportType="tax" />
    </div>
  );
}
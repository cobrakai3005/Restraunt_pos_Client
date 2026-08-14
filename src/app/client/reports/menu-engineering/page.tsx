import { ReportView } from "@/components/client/reports/report-view";

export const metadata = {
  title: "Menu Engineering Report | Vinimay",
  description: "Menu profitability matrix with stars, plowhorses, puzzles and dogs.",
};

export default function MenuEngineeringReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menu Engineering Report</h1>
        <p className="text-muted-foreground mt-1">
          Dish-level profitability matrix using live Recipe BOM costs. Export as CSV anytime.
        </p>
      </div>
      <ReportView reportType="menu-engineering" />
    </div>
  );
}
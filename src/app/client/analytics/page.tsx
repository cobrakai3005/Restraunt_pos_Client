import { AnalyticsDashboard } from "@/components/client/AnalyticsDashboard";

export const metadata = {
  title: "Analytics | Client Dashboard",
  description: "View analytics and insights for your restaurants.",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your restaurant's performance, revenue, and staff metrics.
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}

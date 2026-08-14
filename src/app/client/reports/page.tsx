import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Utensils, Receipt, Users, Clock, Sparkles } from "lucide-react";

const reportLinks = [
  {
    icon: Utensils,
    title: "Menu Engineering",
    description: "Stars, plowhorses, puzzles and dogs with live BOM profitability.",
    href: "/client/reports/menu-engineering",
  },
  {
    icon: Receipt,
    title: "GSTR Tax Summary",
    description: "CGST/SGST collected and taxable base, ready for filing.",
    href: "/client/reports/tax-summary",
  },
  {
    icon: Users,
    title: "Staff Sales",
    description: "Waiter/server leaderboard with orders handled and revenue.",
    href: "/client/reports/staff-sales",
  },
  {
    icon: Clock,
    title: "Hourly Peak Sales",
    description: "24-hour rush curve to optimize staffing and prep.",
    href: "/client/reports/hourly-sales",
  },
  {
    icon: Sparkles,
    title: "Executive Summary",
    description: "Revenue, profit, orders and category share at a glance.",
    href: "/client/reports/executive-summary",
  },
];

export const metadata = {
  title: "Reports | Client Dashboard",
  description: "Downloadable operational reports for your restaurants.",
};

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Operational reports for your restaurant. Every report can also be exported as CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportLinks.map((r) => (
          <Link key={r.href} href={r.href} className="group">
            <Card className="h-full border-border/50 shadow-sm transition-all duration-200 group-hover:border-blue-500/40 group-hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <r.icon className="h-5 w-5 text-blue-500" /> {r.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{r.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
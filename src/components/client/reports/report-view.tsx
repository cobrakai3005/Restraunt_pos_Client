"use client";

import React, { useEffect, useMemo, useState } from "react";
import { analyticsService, AnalyticsData } from "@/services/analytics.service";
import { clientService } from "@/services/client.service";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Loader2,
  Download,
  DollarSign,
  TrendingUp,
  Receipt,
  Activity,
  Utensils,
  Users,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";

export type ReportType =
  | "menu-engineering"
  | "tax"
  | "staff"
  | "hourly"
  | "summary";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#64748b",
];

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

interface ReportViewProps {
  reportType: ReportType;
}

export function ReportView({ reportType }: ReportViewProps) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState<string>("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [data, setData] = useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const end = new Date();
    const start = new Date();

    start.setDate(start.getDate() - 7);

    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);

    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadReport();
    }
  }, [selectedRestaurantId]);

  const loadRestaurants = async () => {
    try {
      const res = await clientService.getRestaurants();

      if (res.success && res.data && res.data.restaurants) {
        setRestaurants(res.data.restaurants);

        if (res.data.restaurants.length > 0) {
          setSelectedRestaurantId(res.data.restaurants[0]._id);
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to load restaurants",
      });
    }
  };

  const loadReport = async () => {
    if (!selectedRestaurantId) return;

    try {
      setLoading(true);

      const res = await analyticsService.getDashboardAnalytics(
        selectedRestaurantId,
        startDate,
        endDate
      );

      if (res.success) {
        setData(res.data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Report Error",
        description:
          error.response?.data?.message || "Failed to load report",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (
    preset: "today" | "7d" | "30d" | "month"
  ) => {
    const end = new Date();
    const start = new Date();

    if (preset === "today") {
      // Today only
    } else if (preset === "7d") {
      start.setDate(start.getDate() - 7);
    } else if (preset === "30d") {
      start.setDate(start.getDate() - 30);
    } else if (preset === "month") {
      start.setDate(1);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleExportCsv = async () => {
    if (!selectedRestaurantId) return;

    try {
      setExporting(true);

      const blob = await analyticsService.downloadReportCsv(
        selectedRestaurantId,
        reportType,
        startDate,
        endDate
      );

      downloadBlob(
        blob,
        `${reportType}-report-${startDate}-to-${endDate}.csv`
      );

      toast({
        title: "Report Downloaded",
        description: `Exported ${reportType} CSV successfully.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "Failed to download CSV report.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ============================================================ */}
      {/* FILTER HEADER */}
      {/* ============================================================ */}

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end bg-card p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md">

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1 items-end">

          {/* Restaurant */}
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Restaurant
            </Label>

            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>

              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r._id} value={r._id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From */}
          <div className="space-y-1.5 w-full sm:w-40">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              From
            </Label>

            <Input
              className="h-10"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* To */}
          <div className="space-y-1.5 w-full sm:w-40">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              To
            </Label>

            <Input
              className="h-10"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Date Presets */}
          <div className="flex gap-1.5">

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatePreset("today")}
              className="text-xs h-10 px-2.5"
            >
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatePreset("7d")}
              className="text-xs h-10 px-2.5"
            >
              7D
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatePreset("30d")}
              className="text-xs h-10 px-2.5"
            >
              30D
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatePreset("month")}
              className="text-xs h-10 px-2.5"
            >
              Month
            </Button>

          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full xl:w-auto justify-end">

          <Button
            onClick={loadReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}

            Submit
          </Button>

          <Button
            onClick={handleExportCsv}
            disabled={exporting || !data}
            variant="outline"
            className="h-10 px-4"
          >
            <Download className="h-4 w-4 mr-2" />

            {exporting ? "Exporting..." : "Download CSV"}
          </Button>

        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex justify-center items-center p-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      )}

      {/* ============================================================ */}
      {/* REPORTS */}
      {/* ============================================================ */}

      {data && reportType === "menu-engineering" && (
        <MenuEngineeringReport data={data} />
      )}

      {data && reportType === "tax" && (
        <TaxReport data={data} />
      )}

      {data && reportType === "staff" && (
        <StaffReport data={data} />
      )}

      {data && reportType === "hourly" && (
        <HourlyReport data={data} />
      )}

      {data && reportType === "summary" && (
        <SummaryReport data={data} />
      )}

    </div>
  );
}


/* ================================================================ */
/* MENU ENGINEERING REPORT */
/* ================================================================ */

function MenuEngineeringReport({
  data,
}: {
  data: AnalyticsData;
}) {
  const items = data.menuEngineering?.items || [];

  /* ============================================================ */
  /* FILTER STATE */
  /* ============================================================ */

  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  const [selectedMenuQuadrant, setSelectedMenuQuadrant] =
    useState<string>("ALL");

  /* ============================================================ */
  /* PAGINATION STATE */
  /* ============================================================ */

  const [menuPage, setMenuPage] = useState(1);

  const [menuPageSize, setMenuPageSize] = useState(10);

  /* ============================================================ */
  /* FILTERED ITEMS */
  /* ============================================================ */

  const filteredMenuItems = useMemo(() => {
    const search = menuSearchQuery.toLowerCase().trim();

    return items.filter((item) => {

      const matchesSearch =
        !search ||
        item.itemName?.toLowerCase().includes(search) ||
        item.categoryName?.toLowerCase().includes(search) ||
        item.shortCode?.toLowerCase().includes(search) ||
        String(item.numericCode || "").includes(search);

      const matchesQuadrant =
        selectedMenuQuadrant === "ALL" ||
        item.classification === selectedMenuQuadrant;

      return matchesSearch && matchesQuadrant;
    });
  }, [
    items,
    menuSearchQuery,
    selectedMenuQuadrant,
  ]);

  /* ============================================================ */
  /* PAGINATED ITEMS */
  /* ============================================================ */

  const paginatedMenuItems = useMemo(() => {
    const start =
      (menuPage - 1) * menuPageSize;

    return filteredMenuItems.slice(
      start,
      start + menuPageSize
    );
  }, [
    filteredMenuItems,
    menuPage,
    menuPageSize,
  ]);

  /* ============================================================ */
  /* QUADRANT COUNTS */
  /* ============================================================ */

  const starCount = items.filter(
    (item) => item.classification === "STAR"
  ).length;

  const plowhorseCount = items.filter(
    (item) => item.classification === "PLOWHORSE"
  ).length;

  const puzzleCount = items.filter(
    (item) => item.classification === "PUZZLE"
  ).length;

  const dogCount = items.filter(
    (item) => item.classification === "DOG"
  ).length;

  /* ============================================================ */
  /* SELECT FILTER */
  /* ============================================================ */

  const handleQuadrantClick = (
    quadrant: string
  ) => {
    setSelectedMenuQuadrant(
      selectedMenuQuadrant === quadrant
        ? "ALL"
        : quadrant
    );

    setMenuPage(1);
  };

  return (
    <div className="space-y-6">

      {/* ======================================================== */}
      {/* QUADRANT CARDS */}
      {/* ======================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* STAR */}
        <Card
          className={`cursor-pointer transition-all border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 hover:shadow-md ${
            selectedMenuQuadrant === "STAR"
              ? "ring-2 ring-amber-500"
              : ""
          }`}
          onClick={() => handleQuadrantClick("STAR")}
        >
          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">

              <span>🌟 Stars</span>

              <Badge className="bg-amber-500 text-white">
                {starCount}
              </Badge>

            </CardTitle>

          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            High Profit &amp; High Volume. Keep quality consistent.
          </CardContent>
        </Card>


        {/* PLOWHORSE */}
        <Card
          className={`cursor-pointer transition-all border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20 hover:shadow-md ${
            selectedMenuQuadrant === "PLOWHORSE"
              ? "ring-2 ring-blue-500"
              : ""
          }`}
          onClick={() =>
            handleQuadrantClick("PLOWHORSE")
          }
        >
          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center justify-between">

              <span>🐴 Plowhorses</span>

              <Badge className="bg-blue-500 text-white">
                {plowhorseCount}
              </Badge>

            </CardTitle>

          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            High Volume, Low Margin. Optimize pricing or costs.
          </CardContent>
        </Card>


        {/* PUZZLE */}
        <Card
          className={`cursor-pointer transition-all border-purple-500/40 bg-purple-50/40 dark:bg-purple-950/20 hover:shadow-md ${
            selectedMenuQuadrant === "PUZZLE"
              ? "ring-2 ring-purple-500"
              : ""
          }`}
          onClick={() =>
            handleQuadrantClick("PUZZLE")
          }
        >
          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">

              <span>🧩 Puzzles</span>

              <Badge className="bg-purple-500 text-white">
                {puzzleCount}
              </Badge>

            </CardTitle>

          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            High Margin, Low Volume. Train staff to upsell.
          </CardContent>
        </Card>


        {/* DOG */}
        <Card
          className={`cursor-pointer transition-all border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20 hover:shadow-md ${
            selectedMenuQuadrant === "DOG"
              ? "ring-2 ring-rose-500"
              : ""
          }`}
          onClick={() =>
            handleQuadrantClick("DOG")
          }
        >
          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">

              <span>🐕 Dogs</span>

              <Badge className="bg-rose-500 text-white">
                {dogCount}
              </Badge>

            </CardTitle>

          </CardHeader>

          <CardContent className="text-xs text-muted-foreground">
            Low Profit &amp; Low Volume. Candidates for replacement.
          </CardContent>
        </Card>

      </div>


      {/* ======================================================== */}
      {/* MENU TABLE */}
      {/* ======================================================== */}

      <Card className="border-border/50 shadow-sm overflow-hidden">

        <CardHeader className="pb-4">

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">

            <div>

              <CardTitle className="text-base font-bold flex items-center gap-2">

                <Sparkles className="h-5 w-5 text-amber-500" />

                Menu Engineering &amp; Profitability Matrix

              </CardTitle>

              <CardDescription>
                Real-time profitability calculated using live Recipe BOM ingredient costs.
              </CardDescription>

            </div>


            {/* SEARCH + CLEAR */}
            <div className="flex gap-2">

              <Input
                placeholder="Search dish or category..."
                value={menuSearchQuery}
                onChange={(e) => {
                  setMenuSearchQuery(e.target.value);
                  setMenuPage(1);
                }}
                className="w-56 h-9"
              />

              {selectedMenuQuadrant !== "ALL" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMenuQuadrant("ALL");
                    setMenuPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  Clear Filter
                </Button>
              )}

            </div>

          </div>

        </CardHeader>


        <CardContent className="p-0 overflow-x-auto">

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead className="pl-6">
                  Dish Name
                </TableHead>

                <TableHead>
                  Category
                </TableHead>

                <TableHead>
                  Shortcode
                </TableHead>

                <TableHead className="text-right">
                  Qty Sold
                </TableHead>

                <TableHead className="text-right">
                  Price
                </TableHead>

                <TableHead className="text-right">
                  BOM Cost
                </TableHead>

                <TableHead className="text-right">
                  Gross Margin
                </TableHead>

                <TableHead className="text-right">
                  Margin %
                </TableHead>

                <TableHead>
                  Quadrant
                </TableHead>

                <TableHead className="pr-6">
                  Action
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {paginatedMenuItems.map(
                (item, idx) => (

                  <TableRow
                    key={`${item.menuItemId}-${item.variantName}-${idx}`}
                  >

                    <TableCell className="font-semibold pl-6">

                      {item.itemName}{" "}

                      <span className="text-xs text-muted-foreground font-normal">
                        ({item.variantName})
                      </span>

                    </TableCell>


                    <TableCell>
                      {item.categoryName}
                    </TableCell>


                    <TableCell>

                      {item.shortCode ||
                      item.numericCode ? (

                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] uppercase"
                        >

                          {[
                            item.shortCode?.toUpperCase(),

                            item.numericCode
                              ? `#${item.numericCode}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" / ")}

                        </Badge>

                      ) : (
                        "—"
                      )}

                    </TableCell>


                    <TableCell className="text-right font-bold">
                      {item.quantitySold}
                    </TableCell>


                    <TableCell className="text-right">
                      {formatCurrency(
                        item.pricePerUnit
                      )}
                    </TableCell>


                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(
                        item.unitCost
                      )}
                    </TableCell>


                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        item.profitMargin
                      )}
                    </TableCell>


                    <TableCell className="text-right font-bold">
                      {item.marginPercent}%
                    </TableCell>


                    <TableCell>

                      {item.classification ===
                        "STAR" && (
                        <Badge className="bg-amber-500 text-white">
                          🌟 Star
                        </Badge>
                      )}

                      {item.classification ===
                        "PLOWHORSE" && (
                        <Badge className="bg-blue-500 text-white">
                          🐴 Plowhorse
                        </Badge>
                      )}

                      {item.classification ===
                        "PUZZLE" && (
                        <Badge className="bg-purple-500 text-white">
                          🧩 Puzzle
                        </Badge>
                      )}

                      {item.classification ===
                        "DOG" && (
                        <Badge className="bg-rose-500 text-white">
                          🐕 Dog
                        </Badge>
                      )}

                    </TableCell>


                    <TableCell className="text-xs text-muted-foreground pr-6">
                      {item.recommendation}
                    </TableCell>

                  </TableRow>

                )
              )}


              {filteredMenuItems.length === 0 && (

                <TableRow>

                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No menu items match your filter.
                  </TableCell>

                </TableRow>

              )}

            </TableBody>

          </Table>

        </CardContent>


        {/* ====================================================== */}
        {/* PAGINATION */}
        {/* ====================================================== */}

        {filteredMenuItems.length > 0 && (

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50 bg-muted/20">

            {/* Showing */}
            <div className="text-xs text-muted-foreground">

              Showing{" "}

              <span className="font-semibold text-foreground">

                {(menuPage - 1) *
                  menuPageSize +
                  1}

              </span>

              {" "}to{" "}

              <span className="font-semibold text-foreground">

                {Math.min(
                  filteredMenuItems.length,
                  menuPage * menuPageSize
                )}

              </span>

              {" "}of{" "}

              <span className="font-semibold text-foreground">

                {filteredMenuItems.length}

              </span>

              {" "}entries

            </div>


            <div className="flex items-center gap-2">

              {/* Page Size */}
              <div className="flex items-center gap-1.5 mr-2">

                <span className="text-xs text-muted-foreground">
                  Rows:
                </span>

                <Select
                  value={String(menuPageSize)}
                  onValueChange={(value) => {
                    setMenuPageSize(
                      Number(value)
                    );
                    setMenuPage(1);
                  }}
                >

                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="10">
                      10
                    </SelectItem>

                    <SelectItem value="20">
                      20
                    </SelectItem>

                    <SelectItem value="50">
                      50
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>


              {/* Previous */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={menuPage <= 1}
                onClick={() =>
                  setMenuPage(
                    menuPage - 1
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>


              {/* Page */}
              <span className="text-xs font-medium px-2">

                Page{" "}
                {menuPage}
                {" "}of{" "}

                {Math.max(
                  1,
                  Math.ceil(
                    filteredMenuItems.length /
                      menuPageSize
                  )
                )}

              </span>


              {/* Next */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={
                  menuPage >=
                  Math.ceil(
                    filteredMenuItems.length /
                      menuPageSize
                  )
                }
                onClick={() =>
                  setMenuPage(
                    menuPage + 1
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

            </div>

          </div>

        )}

      </Card>

    </div>
  );
}


/* ================================================================ */
/* TAX REPORT */
/* ================================================================ */

function TaxReport({
  data,
}: {
  data: AnalyticsData;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <Card className="border-border/50 shadow-sm">

        <CardHeader>

          <CardTitle className="text-base font-bold flex items-center gap-2">

            <Receipt className="h-5 w-5 text-emerald-500" />

            GST Tax Collection Summary (GSTR-Ready)

          </CardTitle>

          <CardDescription>
            Breakdown of taxable sales base and tax collected for filing.
          </CardDescription>

        </CardHeader>


        <CardContent className="space-y-4">

          <div className="space-y-3">

            <div className="flex justify-between items-center py-2 border-b border-border/50">

              <span className="text-sm text-muted-foreground">
                Taxable Net Subtotal:
              </span>

              <span className="font-bold text-foreground">
                {formatCurrency(
                  data.tax.taxableSubtotal
                )}
              </span>

            </div>


            <div className="flex justify-between items-center py-2 border-b border-border/50">

              <span className="text-sm text-muted-foreground">
                CGST Collected (2.5%):
              </span>

              <span className="font-bold text-foreground">
                {formatCurrency(
                  data.tax.totalCgst
                )}
              </span>

            </div>


            <div className="flex justify-between items-center py-2 border-b border-border/50">

              <span className="text-sm text-muted-foreground">
                SGST Collected (2.5%):
              </span>

              <span className="font-bold text-foreground">
                {formatCurrency(
                  data.tax.totalSgst
                )}
              </span>

            </div>


            <div className="flex justify-between items-center py-2 border-b border-border/50">

              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Total GST (CGST + SGST):
              </span>

              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(
                  data.tax.totalTax
                )}
              </span>

            </div>


            <div className="flex justify-between items-center py-3 bg-muted/40 p-3 rounded-xl">

              <span className="text-base font-bold">
                Gross Total Revenue:
              </span>

              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatCurrency(
                  data.tax.grossTotal
                )}
              </span>

            </div>

          </div>

        </CardContent>

      </Card>


      <Card className="border-border/50 shadow-sm">

        <CardHeader>

          <CardTitle className="text-base font-bold flex items-center gap-2">

            <DollarSign className="h-5 w-5 text-blue-500" />

            Payment Tender Breakdown

          </CardTitle>

          <CardDescription>
            Total collections segmented by Cash, UPI, and Cards.
          </CardDescription>

        </CardHeader>


        <CardContent>

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>
                  Payment Method
                </TableHead>

                <TableHead className="text-right">
                  Transactions
                </TableHead>

                <TableHead className="text-right">
                  Total Amount
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {(data.tenderSplit || []).map(
                (t) => (

                  <TableRow key={t.method}>

                    <TableCell className="font-semibold uppercase">
                      {t.method}
                    </TableCell>

                    <TableCell className="text-right">
                      {t.transactionCount}
                    </TableCell>

                    <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(
                        t.totalAmount
                      )}
                    </TableCell>

                  </TableRow>

                )
              )}


              {(data.tenderSplit || []).length ===
                0 && (

                <TableRow>

                  <TableCell
                    colSpan={3}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No payment transactions recorded.
                  </TableCell>

                </TableRow>

              )}

            </TableBody>

          </Table>

        </CardContent>

      </Card>

    </div>
  );
}


/* ================================================================ */
/* STAFF REPORT */
/* ================================================================ */

function StaffReport({
  data,
}: {
  data: AnalyticsData;
}) {
  const staff = data.staffPerformance || [];

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">

      <CardHeader>

        <CardTitle className="text-base font-bold flex items-center gap-2">

          <Users className="h-5 w-5 text-blue-500" />

          Waiter / Server Sales Leaderboard

        </CardTitle>

        <CardDescription>
          Orders handled and revenue produced per server.
        </CardDescription>

      </CardHeader>


      <CardContent className="p-0 overflow-x-auto">

        <Table>

          <TableHeader>

            <TableRow>

              <TableHead className="pl-6">
                Staff Name
              </TableHead>

              <TableHead className="text-right">
                Orders
              </TableHead>

              <TableHead className="text-right">
                Total Sales
              </TableHead>

              <TableHead className="text-right pr-6">
                Avg Ticket
              </TableHead>

            </TableRow>

          </TableHeader>


          <TableBody>

            {staff.map((s) => (

              <TableRow key={s.staffId}>

                <TableCell className="font-semibold pl-6">
                  {s.staffName}
                </TableCell>

                <TableCell className="text-right">
                  {s.ordersHandled}
                </TableCell>

                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    s.revenueGenerated
                  )}
                </TableCell>

                <TableCell className="text-right text-muted-foreground pr-6">
                  {formatCurrency(
                    s.avgTicket
                  )}
                </TableCell>

              </TableRow>

            ))}


            {staff.length === 0 && (

              <TableRow>

                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  No staff sales recorded for this period.
                </TableCell>

              </TableRow>

            )}

          </TableBody>

        </Table>

      </CardContent>

    </Card>
  );
}


/* ================================================================ */
/* HOURLY REPORT */
/* ================================================================ */

function HourlyReport({
  data,
}: {
  data: AnalyticsData;
}) {
  const hourly = data.hourlySales || [];

  const peak = hourly.reduce(
    (max, h) =>
      h.revenue > max.revenue
        ? h
        : max,
    hourly[0] || {
      hour: "-",
      revenue: 0,
      orderCount: 0,
    }
  );

  return (
    <div className="space-y-6">

      <Card className="border-border/50 shadow-sm">

        <CardHeader>

          <CardTitle className="text-base font-bold flex items-center gap-2">

            <Clock className="h-5 w-5 text-blue-500" />

            Hourly Peak Time &amp; Rush Analysis (24-Hour Cycle)

          </CardTitle>

          <CardDescription>

            Peak hour:{" "}

            <span className="font-bold text-blue-600">
              {peak.hour}
            </span>

            {" "}(
            ₹
            {peak.revenue.toLocaleString(
              "en-IN"
            )}
            )

          </CardDescription>

        </CardHeader>


        <CardContent className="h-72">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart data={hourly}>

              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.15}
              />

              <XAxis
                dataKey="hour"
                fontSize={11}
              />

              <YAxis
                tickFormatter={(val) =>
                  `₹${val}`
                }
                fontSize={11}
              />

              <RechartsTooltip
                formatter={(value: any) => [
                  formatCurrency(
                    Number(value)
                  ),
                  "Revenue",
                ]}
              />

              <Bar
                dataKey="revenue"
                fill="#3b82f6"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                name="Revenue"
              />

            </BarChart>

          </ResponsiveContainer>

        </CardContent>

      </Card>


      <Card className="border-border/50 shadow-sm overflow-hidden">

        <CardHeader>

          <CardTitle className="text-base font-bold">
            Hourly Breakdown Table
          </CardTitle>

        </CardHeader>


        <CardContent className="p-0 overflow-x-auto">

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead className="pl-6">
                  Hour
                </TableHead>

                <TableHead className="text-right">
                  Revenue
                </TableHead>

                <TableHead className="text-right pr-6">
                  Order Count
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {hourly.map((h) => (

                <TableRow key={h.hour}>

                  <TableCell className="font-semibold pl-6">
                    {h.hour}
                  </TableCell>

                  <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(
                      h.revenue
                    )}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    {h.orderCount}
                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </CardContent>

      </Card>

    </div>
  );
}


/* ================================================================ */
/* SUMMARY REPORT */
/* ================================================================ */

function SummaryReport({
  data,
}: {
  data: AnalyticsData;
}) {
  const s = data.sales;

  const rows = [
    {
      label: "Total Revenue",
      value: formatCurrency(s.revenue),
      icon: (
        <DollarSign className="h-4 w-4 text-blue-500" />
      ),
    },

    {
      label: "Today Revenue",
      value: formatCurrency(
        s.todayRevenue
      ),
      icon: (
        <Activity className="h-4 w-4 text-purple-500" />
      ),
    },

    {
      label: "Food Cost (COGS)",
      value: formatCurrency(s.cost),
      icon: (
        <Utensils className="h-4 w-4 text-amber-500" />
      ),
    },

    {
      label: "Gross Profit",
      value: formatCurrency(s.profit),
      icon: (
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      ),
    },

    {
      label: "Food Cost %",
      value: `${s.foodCostPercentage}%`,
      icon: (
        <Receipt className="h-4 w-4 text-rose-500" />
      ),
    },

    {
      label: "Total Orders",
      value: String(s.totalOrders),
      icon: (
        <Receipt className="h-4 w-4 text-amber-500" />
      ),
    },

    {
      label: "Paid Orders",
      value: String(s.paidOrders),
      icon: (
        <Activity className="h-4 w-4 text-emerald-500" />
      ),
    },

    {
      label: "Cancelled Orders",
      value: String(s.cancelledOrders),
      icon: (
        <Receipt className="h-4 w-4 text-rose-500" />
      ),
    },

    {
      label: "Average Order Value",
      value: formatCurrency(
        s.averageOrderValue
      ),
      icon: (
        <TrendingUp className="h-4 w-4 text-indigo-500" />
      ),
    },

    {
      label: "Total Discounts",
      value: formatCurrency(
        s.totalDiscount
      ),
      icon: (
        <DollarSign className="h-4 w-4 text-purple-500" />
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {formatCurrency(
                s.revenue
              )}
            </div>

          </CardContent>

        </Card>


        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Profit
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                s.profit
              )}
            </div>

          </CardContent>

        </Card>


        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {s.totalOrders}
            </div>

          </CardContent>

        </Card>


        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 shadow-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Ticket (AOV)
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {formatCurrency(
                s.averageOrderValue
              )}
            </div>

          </CardContent>

        </Card>

      </div>


      {/* Executive Summary */}

      <Card className="border-border/50 shadow-sm overflow-hidden">

        <CardHeader>

          <CardTitle className="text-base font-bold flex items-center gap-2">

            <Sparkles className="h-5 w-5 text-blue-500" />

            Executive Summary

          </CardTitle>

        </CardHeader>


        <CardContent className="p-0">

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead className="pl-6">
                  Metric
                </TableHead>

                <TableHead className="pr-6 text-right">
                  Value
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {rows.map((row) => (

                <TableRow key={row.label}>

                  <TableCell className="pl-6">

                    <span className="flex items-center gap-2 font-medium">

                      {row.icon}

                      {row.label}

                    </span>

                  </TableCell>

                  <TableCell className="pr-6 text-right font-bold">
                    {row.value}
                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </CardContent>

      </Card>


      {/* Sales by Category */}

      <Card className="border-border/50 shadow-sm">

        <CardHeader>

          <CardTitle className="text-base font-bold flex items-center gap-2">

            <DollarSign className="h-5 w-5 text-indigo-500" />

            Sales by Category

          </CardTitle>

        </CardHeader>


        <CardContent className="h-64 flex items-center">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={
                  data.categorySales || []
                }
                dataKey="revenue"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
                label={({
                  name,
                  percent,
                }: any) =>
                  `${name} (${(
                    percent * 100
                  ).toFixed(0)}%)`
                }
              >

                {(data.categorySales ||
                  []
                ).map((_, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                  />

                ))}

              </Pie>


              <RechartsTooltip
                formatter={(
                  val: any
                ) => [
                  formatCurrency(
                    Number(val)
                  ),
                  "Revenue",
                ]}
              />

            </PieChart>

          </ResponsiveContainer>

        </CardContent>

      </Card>

    </div>
  );
}
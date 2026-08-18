"use client";

import React, { useEffect, useState, useMemo } from "react";
import { analyticsService, AnalyticsData } from "@/services/analytics.service";
import { clientService } from "@/services/client.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Activity,
  Download,
  Utensils,
  Receipt,
  Users,
  AlertTriangle,
  Clock,
  PieChart as PieIcon,
  Sparkles,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#64748b"];

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

// Reusable Table Pagination Bar Component
function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-xs text-muted-foreground">Rows:</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-xs font-medium px-2">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface AnalyticsDashboardProps {
  initialRestaurantId?: string;
  hideRestaurantSelector?: boolean;
}

export function AnalyticsDashboard({ initialRestaurantId, hideRestaurantSelector = false }: AnalyticsDashboardProps) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(initialRestaurantId || "");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [selectedMenuQuadrant, setSelectedMenuQuadrant] = useState<string>("ALL");

  // Pagination states for tables
  const [menuPage, setMenuPage] = useState(1);
  const [menuPageSize, setMenuPageSize] = useState(10);

  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(10);

  const [voidPage, setVoidPage] = useState(1);
  const [voidPageSize, setVoidPageSize] = useState(10);

  const { toast } = useToast();

  useEffect(() => {
    // Set default dates (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);

    if (initialRestaurantId) {
      setSelectedRestaurantId(initialRestaurantId);
    } else {
      loadRestaurants();
    }
  }, [initialRestaurantId]);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadAnalytics();
    }
  }, [selectedRestaurantId]);

  const loadRestaurants = async () => {
    try {
      const res = await clientService.getRestaurants();
      if (res.success && res.data && res.data.restaurants) {
        setRestaurants(res.data.restaurants);
        if (res.data.restaurants.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(res.data.restaurants[0]._id);
        }
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to load restaurants" });
    }
  };

  const loadAnalytics = async () => {
    if (!selectedRestaurantId) return;
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardAnalytics(selectedRestaurantId, startDate, endDate);
      if (res.success) {
        setData(res.data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analytics Error",
        description: error.response?.data?.message || "Failed to load analytics",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (preset: "today" | "7d" | "30d" | "month") => {
    const end = new Date();
    const start = new Date();

    if (preset === "today") {
      // today only
    } else if (preset === "7d") {
      start.setDate(start.getDate() - 7);
    } else if (preset === "30d") {
      start.setDate(start.getDate() - 30);
    } else if (preset === "month") {
      start.setDate(1);
    }

    const s = start.toISOString().split("T")[0];
    const e = end.toISOString().split("T")[0];
    setStartDate(s);
    setEndDate(e);
  };

  const handleExportCsv = async (reportType: "menu-engineering" | "tax" | "staff" | "hourly" | "summary") => {
    if (!selectedRestaurantId) return;
    try {
      setExporting(true);
      const blob = await analyticsService.downloadReportCsv(selectedRestaurantId, reportType, startDate, endDate);
      downloadBlob(blob, `${reportType}-report-${startDate}-to-${endDate}.csv`);
      toast({ title: "Report Downloaded", description: `Exported ${reportType} CSV successfully.` });
    } catch {
      toast({ variant: "destructive", title: "Export Error", description: "Failed to download CSV report." });
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  // Filtered & Paginated Menu Engineering Items
  const filteredMenuItems = useMemo(() => {
    return (
      data?.menuEngineering.items.filter((item) => {
        const matchesSearch =
          item.itemName.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
          item.categoryName.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
          (item.shortCode && item.shortCode.toLowerCase().includes(menuSearchQuery.toLowerCase())) ||
          (item.numericCode && item.numericCode.includes(menuSearchQuery));
        const matchesQuadrant = selectedMenuQuadrant === "ALL" || item.classification === selectedMenuQuadrant;
        return matchesSearch && matchesQuadrant;
      }) || []
    );
  }, [data, menuSearchQuery, selectedMenuQuadrant]);

  const paginatedMenuItems = useMemo(() => {
    const start = (menuPage - 1) * menuPageSize;
    return filteredMenuItems.slice(start, start + menuPageSize);
  }, [filteredMenuItems, menuPage, menuPageSize]);

  // Paginated Staff Items
  const paginatedStaff = useMemo(() => {
    if (!data?.staffPerformance) return [];
    const start = (staffPage - 1) * staffPageSize;
    return data.staffPerformance.slice(start, start + staffPageSize);
  }, [data, staffPage, staffPageSize]);

  // Paginated Void Items
  const paginatedVoids = useMemo(() => {
    if (!data?.voidAudit) return [];
    const start = (voidPage - 1) * voidPageSize;
    return data.voidAudit.slice(start, start + voidPageSize);
  }, [data, voidPage, voidPageSize]);

  return (
    <div className="space-y-6 pb-12">
      {/* Filters Header */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end bg-card p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1 items-end">
          {!hideRestaurantSelector && (
            <div className="space-y-1.5 w-full sm:w-56">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurant</Label>
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
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
          )}

          <div className="space-y-1.5 w-full sm:w-40">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</Label>
            <Input className="h-10" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-1.5 w-full sm:w-40">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
            <Input className="h-10" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {/* Quick Presets */}
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => handleDatePreset("today")} className="text-xs h-10 px-2.5">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDatePreset("7d")} className="text-xs h-10 px-2.5">
              7D
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDatePreset("30d")} className="text-xs h-10 px-2.5">
              30D
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDatePreset("month")} className="text-xs h-10 px-2.5">
              Month
            </Button>
          </div>
        </div>

        <div className="flex gap-2 w-full xl:w-auto justify-end">
          <Button onClick={loadAnalytics} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>

          <Select onValueChange={(val: any) => handleExportCsv(val)}>
            <SelectTrigger className="h-10 w-44" disabled={exporting || !data}>
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export Report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="menu-engineering">🍔 Menu Engineering (CSV)</SelectItem>
              <SelectItem value="tax">💰 GSTR Tax Summary (CSV)</SelectItem>
              <SelectItem value="staff">🧑‍🍳 Staff Sales (CSV)</SelectItem>
              <SelectItem value="hourly">⏰ Hourly Peak Sales (CSV)</SelectItem>
              <SelectItem value="summary">📊 Executive Summary (CSV)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && !data && (
        <div className="flex justify-center items-center p-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      )}

      {data && (
        <Tabs defaultValue="overview" className="space-y-6 max-w-full overflow-hidden">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-auto flex flex-wrap gap-1 w-full max-w-full">
            <TabsTrigger value="overview" className="gap-2 rounded-lg py-2">
              <Activity className="h-4 w-4" /> Overview &amp; Peaks
            </TabsTrigger>
            <TabsTrigger value="pos-reports" className="gap-2 rounded-lg py-2">
              <FileSpreadsheet className="h-4 w-4" /> POS Reports Hub
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2 rounded-lg py-2">
              <Utensils className="h-4 w-4" /> Menu Matrix &amp; Stars
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2 rounded-lg py-2">
              <Receipt className="h-4 w-4" /> Tax &amp; Payments
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2 rounded-lg py-2">
              <Users className="h-4 w-4" /> Staff &amp; Void Audit
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {/* ========================================================================= */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Total Revenue
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.sales.revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Today: <span className="font-bold text-foreground">{formatCurrency(data.sales.todayRevenue)}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Gross Profit
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.sales.profit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Food Cost (COGS): <span className="font-bold text-foreground">{formatCurrency(data.sales.cost)}</span> ({data.sales.foodCostPercentage}%)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Total Orders
                    <Receipt className="h-4 w-4 text-amber-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                    {data.sales.totalOrders}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paid: <span className="font-bold text-foreground">{data.sales.paidOrders}</span> · Cancelled: <span className="font-bold text-rose-500">{data.sales.cancelledOrders}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Avg Ticket Size (AOV)
                    <Activity className="h-4 w-4 text-purple-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                    {formatCurrency(data.sales.averageOrderValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Discounts: <span className="font-bold text-foreground">{formatCurrency(data.sales.totalDiscount)}</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Hourly Peak Rush Curve */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" /> Hourly Peak Time &amp; Rush Analysis (24-Hour Cycle)
                </CardTitle>
                <CardDescription>Identify your lunch and dinner peak hours to optimize staffing and prep.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="hour" fontSize={11} />
                    <YAxis tickFormatter={(val) => `₹${val}`} fontSize={11} />
                    <RechartsTooltip formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Share & Order Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-indigo-500" /> Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categorySales}
                        dataKey="revenue"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {data.categorySales.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-teal-500" /> Dine-In vs Takeaway Share
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.orderTypeSplit}
                        dataKey="revenue"
                        nameKey="orderType"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                        label={({ name, percent }: any) => `${name.replace("_", " ")} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {data.orderTypeSplit.map((_, index) => (
                          <Cell key={`type-${index}`} fill={index === 0 ? "#10b981" : "#f59e0b"} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: MENU ENGINEERING MATRIX */}
          {/* ========================================================================= */}
          <TabsContent value="menu" className="space-y-6">
            {/* 4 Quadrants Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card
                className={`cursor-pointer transition-all border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 ${
                  selectedMenuQuadrant === "STAR" ? "ring-2 ring-amber-500" : ""
                }`}
                onClick={() => {
                  setSelectedMenuQuadrant(selectedMenuQuadrant === "STAR" ? "ALL" : "STAR");
                  setMenuPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                    🌟 Stars
                    <Badge className="bg-amber-500 text-white">
                      {data.menuEngineering.items.filter((i) => i.classification === "STAR").length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  High Profit &amp; High Volume. Keep recipe quality consistent and maintain high visibility.
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20 ${
                  selectedMenuQuadrant === "PLOWHORSE" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => {
                  setSelectedMenuQuadrant(selectedMenuQuadrant === "PLOWHORSE" ? "ALL" : "PLOWHORSE");
                  setMenuPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center justify-between">
                    🐴 Plowhorses
                    <Badge className="bg-blue-500 text-white">
                      {data.menuEngineering.items.filter((i) => i.classification === "PLOWHORSE").length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  High Volume, Low Margin. Try slightly raising price or optimizing ingredient portion costs.
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-purple-500/40 bg-purple-50/40 dark:bg-purple-950/20 ${
                  selectedMenuQuadrant === "PUZZLE" ? "ring-2 ring-purple-500" : ""
                }`}
                onClick={() => {
                  setSelectedMenuQuadrant(selectedMenuQuadrant === "PUZZLE" ? "ALL" : "PUZZLE");
                  setMenuPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                    🧩 Puzzles
                    <Badge className="bg-purple-500 text-white">
                      {data.menuEngineering.items.filter((i) => i.classification === "PUZZLE").length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  High Margin, Low Volume. Train staff to upsell and recommend on special promo boards.
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20 ${
                  selectedMenuQuadrant === "DOG" ? "ring-2 ring-rose-500" : ""
                }`}
                onClick={() => {
                  setSelectedMenuQuadrant(selectedMenuQuadrant === "DOG" ? "ALL" : "DOG");
                  setMenuPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                    🐕 Dogs
                    <Badge className="bg-rose-500 text-white">
                      {data.menuEngineering.items.filter((i) => i.classification === "DOG").length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Low Profit &amp; Low Volume. Candidates for reformulation or menu replacement.
                </CardContent>
              </Card>
            </div>

            {/* Detailed Menu Performance Table with Pagination */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" /> Menu Engineering &amp; Profitability Matrix
                  </CardTitle>
                  <CardDescription>
                    Real-time profitability calculated using live Recipe BOM ingredient costs.
                  </CardDescription>
                </div>
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
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Dish Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Shortcode</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">BOM Cost</TableHead>
                      <TableHead className="text-right">Gross Margin</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead>Quadrant</TableHead>
                      <TableHead className="pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMenuItems.map((item, idx) => (
                      <TableRow key={`${item.menuItemId}-${item.variantName}-${idx}`}>
                        <TableCell className="font-semibold pl-6">
                          {item.itemName} <span className="text-xs text-muted-foreground font-normal">({item.variantName})</span>
                        </TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>
                          {item.shortCode || item.numericCode ? (
                            <Badge variant="outline" className="font-mono text-[10px] uppercase">
                              {[item.shortCode?.toUpperCase(), item.numericCode ? `#${item.numericCode}` : null].filter(Boolean).join(" / ")}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">{item.quantitySold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.pricePerUnit)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(item.unitCost)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.profitMargin)}
                        </TableCell>
                        <TableCell className="text-right font-bold">{item.marginPercent}%</TableCell>
                        <TableCell>
                          {item.classification === "STAR" && <Badge className="bg-amber-500 text-white">🌟 Star</Badge>}
                          {item.classification === "PLOWHORSE" && <Badge className="bg-blue-500 text-white">🐴 Plowhorse</Badge>}
                          {item.classification === "PUZZLE" && <Badge className="bg-purple-500 text-white">🧩 Puzzle</Badge>}
                          {item.classification === "DOG" && <Badge className="bg-rose-500 text-white">🐕 Dog</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground pr-6">{item.recommendation}</TableCell>
                      </TableRow>
                    ))}
                    {filteredMenuItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No menu items match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>

              {/* Table Pagination */}
              <TablePagination
                currentPage={menuPage}
                totalItems={filteredMenuItems.length}
                pageSize={menuPageSize}
                onPageChange={setMenuPage}
                onPageSizeChange={(size) => {
                  setMenuPageSize(size);
                  setMenuPage(1);
                }}
              />
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 3: TAX & PAYMENTS */}
          {/* ========================================================================= */}
          <TabsContent value="tax" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GSTR Tax Summary Card */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-500" /> GST Tax Collection Summary (GSTR-Ready)
                  </CardTitle>
                  <CardDescription>Breakdown of taxable sales base and tax collected for filing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Taxable Net Subtotal:</span>
                      <span className="font-bold text-foreground">{formatCurrency(data.tax.taxableSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">CGST Collected (2.5%):</span>
                      <span className="font-bold text-foreground">{formatCurrency(data.tax.totalCgst)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">SGST Collected (2.5%):</span>
                      <span className="font-bold text-foreground">{formatCurrency(data.tax.totalSgst)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total GST (CGST + SGST):</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.tax.totalTax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-muted/40 p-3 rounded-xl">
                      <span className="text-base font-bold">Gross Total Revenue:</span>
                      <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(data.tax.grossTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Tender Split */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" /> Payment Tender Breakdown
                  </CardTitle>
                  <CardDescription>Total collections segmented by Cash, UPI, and Cards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tenderSplit.map((t) => (
                        <TableRow key={t.method}>
                          <TableCell className="font-semibold uppercase">{t.method}</TableCell>
                          <TableCell className="text-right">{t.transactionCount}</TableCell>
                          <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(t.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.tenderSplit.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                            No payment transactions recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 4: STAFF PERFORMANCE & VOID AUDIT */}
          {/* ========================================================================= */}
          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waiter Leaderboard with Pagination */}
              <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" /> Waiter / Server Sales Leaderboard
                    </CardTitle>
                    <CardDescription>Orders handled and revenue produced per server.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Staff Name</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Total Sales</TableHead>
                          <TableHead className="text-right pr-6">Avg Ticket</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedStaff.map((s) => (
                          <TableRow key={s.staffId}>
                            <TableCell className="font-semibold pl-6">{s.staffName}</TableCell>
                            <TableCell className="text-right">{s.ordersHandled}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(s.revenueGenerated)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground pr-6">{formatCurrency(s.avgTicket)}</TableCell>
                          </TableRow>
                        ))}
                        {data.staffPerformance.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No staff sales recorded for this period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </div>

                <TablePagination
                  currentPage={staffPage}
                  totalItems={data.staffPerformance.length}
                  pageSize={staffPageSize}
                  onPageChange={setStaffPage}
                />
              </Card>

              {/* Fraud & Void Audit Log with Pagination */}
              <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-rose-500" /> Void &amp; Cancellation Audit Log
                    </CardTitle>
                    <CardDescription>Track cancelled items and orders for fraud prevention.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Order #</TableHead>
                          <TableHead>Cancelled By</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right pr-6">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedVoids.map((v) => (
                          <TableRow key={v._id}>
                            <TableCell className="font-mono text-xs pl-6">#{v.orderNumber || v._id.slice(-4)}</TableCell>
                            <TableCell className="font-semibold text-rose-600 dark:text-rose-400">{v.cancelledByName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{v.cancelReason}</TableCell>
                            <TableCell className="text-right font-bold pr-6">{formatCurrency(v.grandTotal)}</TableCell>
                          </TableRow>
                        ))}
                        {data.voidAudit.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No cancelled orders found. Clean record! 🎉
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </div>

                <TablePagination
                  currentPage={voidPage}
                  totalItems={data.voidAudit.length}
                  pageSize={voidPageSize}
                  onPageChange={setVoidPage}
                />
              </Card>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 5: COMPREHENSIVE POS REPORTS HUB */}
          {/* ========================================================================= */}
          <TabsContent value="pos-reports" className="space-y-6">
            <PosReportsHub
              initialRestaurantId={selectedRestaurantId}
              hideRestaurantSelector={hideRestaurantSelector}
              defaultTab="executive"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

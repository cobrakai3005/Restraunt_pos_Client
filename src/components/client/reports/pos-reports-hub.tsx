"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  posReportsService,
  PosReportType,
  ExecutiveSummaryData,
  SalesSummaryData,
  CategorySummaryData,
  ItemSummaryData,
  OrderSummaryData,
  GroupSummaryData,
  VariationSummaryData,
  CoverSizeSummaryData,
} from "@/services/posReports.service";
import { clientService } from "@/services/client.service";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/context/auth-context";
import { useDebounce } from "@/hooks/use-debounce";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Utensils,
  Layers,
  Sparkles,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  Calendar,
  Percent,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

interface PosReportsHubProps {
  initialRestaurantId?: string;
  hideRestaurantSelector?: boolean;
  defaultTab?: PosReportType;
}

export function PosReportsHub({
  initialRestaurantId,
  hideRestaurantSelector = false,
  defaultTab = "executive",
}: PosReportsHubProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(initialRestaurantId || "");

  // Active Tab
  const [activeTab, setActiveTab] = useState<PosReportType>(defaultTab);

  // Date Filter State
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [datePreset, setDatePreset] = useState<string>("today");

  // Loading & Exporting State
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Search Filter in Tables with Debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Reset pagination when debounced search query changes
  useEffect(() => {
    setItemPage(1);
    setVariationPage(1);
    setOrderPage(1);
  }, [debouncedSearchQuery]);

  // Report Data States
  const [executiveData, setExecutiveData] = useState<ExecutiveSummaryData | null>(null);
  const [salesData, setSalesData] = useState<SalesSummaryData | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySummaryData | null>(null);
  const [itemData, setItemData] = useState<ItemSummaryData | null>(null);
  const [orderData, setOrderData] = useState<OrderSummaryData | null>(null);
  const [groupData, setGroupData] = useState<GroupSummaryData | null>(null);
  const [variationData, setVariationData] = useState<VariationSummaryData | null>(null);
  const [coverSizeData, setCoverSizeData] = useState<CoverSizeSummaryData | null>(null);

  // Pagination for Order Summary
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(20);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState("ALL");

  // Pagination for Item Summary & Variation Summary
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize] = useState(25);
  const [variationPage, setVariationPage] = useState(1);
  const [variationPageSize] = useState(25);

  // Load Restaurants List
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        if (user?.role === "MASTER_ADMIN" || user?.role === "MASTER_USER") {
          const res = await adminService.getAllRestaurants();
          if (res.success && res.data?.restaurants) {
            setRestaurants(res.data.restaurants);
            if (!selectedRestaurantId && res.data.restaurants.length > 0) {
              setSelectedRestaurantId(res.data.restaurants[0]._id);
            }
          }
        } else {
          const res = await clientService.getRestaurants();
          if (res.success && res.data?.restaurants) {
            setRestaurants(res.data.restaurants);
            if (!selectedRestaurantId && res.data.restaurants.length > 0) {
              const saved = typeof window !== "undefined" ? localStorage.getItem("vinimay_active_restaurant_id") : null;
              const matched = res.data.restaurants.find((r: any) => r._id === saved);
              setSelectedRestaurantId(matched ? matched._id : res.data.restaurants[0]._id);
            }
          }
        }
      } catch (err) {
        console.error("Error loading restaurants", err);
      }
    };

    if (!initialRestaurantId) {
      fetchRestaurants();
    } else {
      setSelectedRestaurantId(initialRestaurantId);
    }
  }, [initialRestaurantId, user]);

  // Date Preset Handler
  const applyDatePreset = (preset: "today" | "yesterday" | "week" | "month" | "custom") => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "today") {
      const d = now.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const d = y.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === "week") {
      const start = new Date();
      start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  // Main Report Fetcher for Active Tab
  const fetchReportData = useCallback(async () => {
    if (!selectedRestaurantId) return;
    setLoading(true);
    try {
      if (activeTab === "executive") {
        const res = await posReportsService.getExecutiveSummary(selectedRestaurantId, startDate, endDate);
        setExecutiveData(res.data);
      } else if (activeTab === "sales") {
        const res = await posReportsService.getSalesSummary(selectedRestaurantId, startDate, endDate);
        setSalesData(res.data);
      } else if (activeTab === "category") {
        const res = await posReportsService.getCategorySummary(selectedRestaurantId, startDate, endDate);
        setCategoryData(res.data);
      } else if (activeTab === "item") {
        const res = await posReportsService.getItemSummary(selectedRestaurantId, startDate, endDate);
        setItemData(res.data);
      } else if (activeTab === "order") {
        const res = await posReportsService.getOrderSummary(selectedRestaurantId, {
          startDate,
          endDate,
          page: orderPage,
          limit: orderPageSize,
          status: orderStatusFilter !== "ALL" ? orderStatusFilter : undefined,
          orderType: orderTypeFilter !== "ALL" ? orderTypeFilter : undefined,
          search: debouncedSearchQuery.trim() || undefined,
        });
        setOrderData(res.data);
      } else if (activeTab === "group") {
        const res = await posReportsService.getGroupSummary(selectedRestaurantId, startDate, endDate);
        setGroupData(res.data);
      } else if (activeTab === "variation") {
        const res = await posReportsService.getVariationSummary(selectedRestaurantId, startDate, endDate);
        setVariationData(res.data);
      } else if (activeTab === "cover-size") {
        const res = await posReportsService.getCoverSizeSummary(selectedRestaurantId, startDate, endDate);
        setCoverSizeData(res.data);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error Loading Report",
        description: err.response?.data?.message || err.message || "Failed to load report data.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    selectedRestaurantId,
    startDate,
    endDate,
    activeTab,
    orderPage,
    orderPageSize,
    orderStatusFilter,
    orderTypeFilter,
    debouncedSearchQuery,
    toast,
  ]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Export Download Handler
  const handleExport = async (format: "csv" | "excel") => {
    if (!selectedRestaurantId) return;
    setExporting(true);
    try {
      const blob = await posReportsService.downloadReportExport(
        selectedRestaurantId,
        activeTab,
        format,
        startDate,
        endDate
      );
      const ext = format === "excel" ? "xls" : "csv";
      downloadBlob(blob, `${activeTab}-report-${startDate}-to-${endDate}.${ext}`);
      toast({
        title: "Report Exported",
        description: `Downloaded ${activeTab} report in ${format.toUpperCase()} format successfully.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to generate report export.",
      });
    } finally {
      setExporting(false);
    }
  };

  // Filtered views for search query with debouncing
  const filteredCategoryRows = useMemo(() => {
    if (!categoryData?.rows) return [];
    if (!debouncedSearchQuery.trim()) return categoryData.rows;
    return categoryData.rows.filter((r) =>
      r.categoryName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [categoryData, debouncedSearchQuery]);

  const filteredItemRows = useMemo(() => {
    if (!itemData?.rows) return [];
    if (!debouncedSearchQuery.trim()) return itemData.rows;
    const q = debouncedSearchQuery.toLowerCase();
    return itemData.rows.filter(
      (r) =>
        r.itemName.toLowerCase().includes(q) ||
        r.variantName.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q) ||
        (r.shortCode && r.shortCode.toLowerCase().includes(q)) ||
        (r.numericCode && r.numericCode.includes(q))
    );
  }, [itemData, debouncedSearchQuery]);

  const filteredVariationRows = useMemo(() => {
    if (!variationData?.rows) return [];
    if (!debouncedSearchQuery.trim()) return variationData.rows;
    const q = debouncedSearchQuery.toLowerCase();
    return variationData.rows.filter(
      (r) =>
        r.itemName.toLowerCase().includes(q) ||
        r.variantName.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
    );
  }, [variationData, debouncedSearchQuery]);

  const paginatedItemRows = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize;
    return filteredItemRows.slice(start, start + itemPageSize);
  }, [filteredItemRows, itemPage, itemPageSize]);

  const paginatedVariationRows = useMemo(() => {
    const start = (variationPage - 1) * variationPageSize;
    return filteredVariationRows.slice(start, start + variationPageSize);
  }, [filteredVariationRows, variationPage, variationPageSize]);

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-hidden">
      {/* ── Global Filter & Toolbar ── */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end bg-card p-4 sm:p-5 rounded-2xl border border-border/60 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto flex-1 items-stretch sm:items-end">
          {!hideRestaurantSelector && restaurants.length > 0 && (
            <div className="space-y-1.5 w-full sm:w-52 shrink-0">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-blue-500" /> Restaurant
              </Label>
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger className="h-10 rounded-xl font-semibold">
                  <SelectValue placeholder="Select Restaurant" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {restaurants.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Date Presets */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-500" /> Quick Dates
            </Label>
            <div className="flex flex-wrap gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyDatePreset("today")}
                className={`text-xs h-8 px-2.5 rounded-lg font-bold transition-all ${
                  datePreset === "today" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                }`}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyDatePreset("yesterday")}
                className={`text-xs h-8 px-2.5 rounded-lg font-bold transition-all ${
                  datePreset === "yesterday" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                }`}
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyDatePreset("week")}
                className={`text-xs h-8 px-2.5 rounded-lg font-bold transition-all ${
                  datePreset === "week" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                }`}
              >
                This Week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyDatePreset("month")}
                className={`text-xs h-8 px-2.5 rounded-lg font-bold transition-all ${
                  datePreset === "month" ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                }`}
              >
                This Month
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 w-full sm:w-36">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From</Label>
            <Input
              className="h-10 rounded-xl font-medium"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
            />
          </div>

          <div className="space-y-1.5 w-full sm:w-36">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To</Label>
            <Input
              className="h-10 rounded-xl font-medium"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
            />
          </div>
        </div>

        {/* Action Controls & Export Dropdown */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={exporting || loading}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 shadow-sm"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>Export Report</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-1.5 w-48 shadow-xl">
              <DropdownMenuItem onClick={() => handleExport("csv")} className="rounded-lg gap-2 cursor-pointer font-semibold text-xs">
                <FileText className="h-4 w-4 text-emerald-500" /> Export CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")} className="rounded-lg gap-2 cursor-pointer font-semibold text-xs">
                <FileSpreadsheet className="h-4 w-4 text-blue-500" /> Export Excel (.xls)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tabs Navigation for 8 Reports ── */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as PosReportType)} className="space-y-6 w-full max-w-full">
        <div className="w-full max-w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5 w-full h-auto p-1.5 rounded-2xl bg-muted/60 border border-border/50 shadow-sm">
            <TabsTrigger value="executive" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <Sparkles className="h-4 w-4 shrink-0" /> <span className="truncate">1. Executive</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <TrendingUp className="h-4 w-4 shrink-0" /> <span className="truncate">2. Sales</span>
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <Layers className="h-4 w-4 shrink-0" /> <span className="truncate">3. Category</span>
            </TabsTrigger>
            <TabsTrigger value="item" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <Utensils className="h-4 w-4 shrink-0" /> <span className="truncate">4. Item BOM</span>
            </TabsTrigger>
            <TabsTrigger value="order" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <Receipt className="h-4 w-4 shrink-0" /> <span className="truncate">5. Orders</span>
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <Filter className="h-4 w-4 shrink-0" /> <span className="truncate">6. Groups</span>
            </TabsTrigger>
            <TabsTrigger value="variation" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <ArrowUpDown className="h-4 w-4 shrink-0" /> <span className="truncate">7. Variations</span>
            </TabsTrigger>
            <TabsTrigger value="cover-size" className="gap-1.5 rounded-xl py-2 px-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all w-full justify-center">
              <Users className="h-4 w-4 shrink-0" /> <span className="truncate">8. Cover Size</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center p-20 gap-3 text-muted-foreground bg-card/50 rounded-2xl border border-border/40">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            <p className="font-semibold text-sm">Aggregating real-time POS reports...</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT 1: EXECUTIVE SALES SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "executive" && executiveData && (
          <TabsContent value="executive" className="space-y-6 mt-0">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Total Revenue (Grand Total)
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {formatCurrency(executiveData.summary.totalSales)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Gross: <span className="font-bold text-foreground">{formatCurrency(executiveData.summary.grossSales)}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Net Sales
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(executiveData.summary.netSales)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Discounts: <span className="font-bold text-rose-500">-{formatCurrency(executiveData.summary.totalDiscounts)}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Total Covers (Guests)
                    <Users className="h-4 w-4 text-amber-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {executiveData.summary.totalCovers} Covers
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Completed Orders: <span className="font-bold text-foreground">{executiveData.summary.completedOrders}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 shadow-sm relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Avg Spend Per Cover (APC)
                    <Percent className="h-4 w-4 text-purple-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {formatCurrency(executiveData.summary.averageSpendPerCover)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    AOV: <span className="font-bold text-foreground">{formatCurrency(executiveData.summary.averageOrderValue)}</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary KPI Breakdown Table & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Breakup Table */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-500" /> Billing Breakdown Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border/40 text-sm font-semibold">
                      <span className="text-muted-foreground">Gross Sales (Items + Modifiers)</span>
                      <span className="font-bold">{formatCurrency(executiveData.summary.grossSales)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40 text-sm font-semibold">
                      <span className="text-muted-foreground">Total Discounts Applied</span>
                      <span className="font-bold text-rose-500">-{formatCurrency(executiveData.summary.totalDiscounts)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40 text-sm font-semibold">
                      <span className="text-muted-foreground">Cancelled / Refunded Amount</span>
                      <span className="font-bold text-rose-500">-{formatCurrency(executiveData.summary.refunds)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40 text-sm font-bold bg-muted/30 px-2 rounded-lg">
                      <span>Net Sales</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(executiveData.summary.netSales)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40 text-sm font-semibold">
                      <span className="text-muted-foreground">Total GST (CGST: {formatCurrency(executiveData.summary.totalCgst)}, SGST: {formatCurrency(executiveData.summary.totalSgst)})</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">+{formatCurrency(executiveData.summary.totalTax)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40 text-sm font-semibold">
                      <span className="text-muted-foreground">Packaging Charges (Takeaway)</span>
                      <span className="font-bold">+{formatCurrency(executiveData.summary.packagingCharges)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-border text-base font-black bg-blue-500/10 px-3 rounded-xl text-blue-700 dark:text-blue-300">
                      <span>Grand Total Revenue</span>
                      <span>{formatCurrency(executiveData.summary.totalSales)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods & Order Types Split */}
              <div className="space-y-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-500" /> Tender / Payment-wise Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {executiveData.paymentBreakdown.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">No payment data recorded in this date range.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {executiveData.paymentBreakdown.map((p, idx) => (
                          <div key={p.method} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="font-bold text-sm">{p.method}</span>
                              <span className="text-xs text-muted-foreground">({p.count} txns)</span>
                            </div>
                            <span className="font-extrabold text-sm text-foreground">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" /> Order Type Split (Dine-in vs Takeaway)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {executiveData.orderTypeBreakdown.map((ot) => (
                        <div key={ot.orderType} className="p-4 rounded-xl bg-muted/40 border border-border/40 text-center space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ot.orderType}</p>
                          <p className="text-xl font-black text-foreground">{formatCurrency(ot.sales)}</p>
                          <p className="text-xs text-muted-foreground font-semibold">{ot.count} Orders · {ot.covers} Covers</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 2: SALES SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "sales" && salesData && (
          <TabsContent value="sales" className="space-y-6 mt-0">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" /> Periodic Daily Sales Breakdown
                </CardTitle>
                <CardDescription>Day-by-day chronological breakdown of gross, net sales, taxes, discounts, and covers.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-extrabold text-xs">Date</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Orders</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Covers</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Gross Sales</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Discounts</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Refunds</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Tax (GST)</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Net Sales</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Grand Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm font-medium">
                            No sales data found for the selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        salesData.rows.map((row) => (
                          <TableRow key={row.date} className="hover:bg-muted/30">
                            <TableCell className="font-bold text-xs">{row.date}</TableCell>
                            <TableCell className="text-center font-semibold text-xs">{row.completedOrders} / {row.orderCount}</TableCell>
                            <TableCell className="text-center font-semibold text-xs text-amber-600 dark:text-amber-400">{row.covers}</TableCell>
                            <TableCell className="text-right font-medium text-xs">{formatCurrency(row.grossSales)}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-rose-500">{row.discounts > 0 ? `-${formatCurrency(row.discounts)}` : "₹0"}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-rose-500">{row.refunds > 0 ? `-${formatCurrency(row.refunds)}` : "₹0"}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-blue-600 dark:text-blue-400">+{formatCurrency(row.tax)}</TableCell>
                            <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(row.netSales)}</TableCell>
                            <TableCell className="text-right font-extrabold text-xs text-foreground">{formatCurrency(row.grandTotal)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Total Summary Footer Row */}
                {salesData.rows.length > 0 && (
                  <div className="bg-muted/80 p-4 border-t-2 border-border flex flex-wrap items-center justify-between gap-4 text-xs font-black">
                    <span className="uppercase tracking-wider text-muted-foreground">Total Period Summary</span>
                    <div className="flex flex-wrap items-center gap-6">
                      <span>Orders: <strong className="text-foreground">{salesData.totals.completedOrders}</strong></span>
                      <span>Covers: <strong className="text-amber-600 dark:text-amber-400">{salesData.totals.covers}</strong></span>
                      <span>Gross: <strong className="text-foreground">{formatCurrency(salesData.totals.grossSales)}</strong></span>
                      <span>Discounts: <strong className="text-rose-500">-{formatCurrency(salesData.totals.discounts)}</strong></span>
                      <span>Tax: <strong className="text-blue-600">{formatCurrency(salesData.totals.tax)}</strong></span>
                      <span>Net Sales: <strong className="text-emerald-600 text-sm">{formatCurrency(salesData.totals.netSales)}</strong></span>
                      <span>Grand Total: <strong className="text-blue-700 dark:text-blue-300 text-sm">{formatCurrency(salesData.totals.grandTotal)}</strong></span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 3: CATEGORY SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "category" && categoryData && (
          <TabsContent value="category" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter category name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>
              <div className="text-xs text-muted-foreground font-semibold">
                Total Categories: <span className="font-bold text-foreground">{categoryData.rows.length}</span>
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-extrabold text-xs">Category Name</TableHead>
                      <TableHead className="font-extrabold text-xs text-center">Qty Sold</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Gross Sales</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Tax (GST)</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Net Sales</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Revenue Share (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategoryRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm font-medium">
                          No category sales found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategoryRows.map((c) => (
                        <TableRow key={c.categoryName} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-xs">{c.categoryName}</TableCell>
                          <TableCell className="text-center font-semibold text-xs">{c.quantitySold} units</TableCell>
                          <TableCell className="text-right font-medium text-xs">{formatCurrency(c.grossSales)}</TableCell>
                          <TableCell className="text-right font-medium text-xs text-blue-600 dark:text-blue-400">+{formatCurrency(c.taxAmount)}</TableCell>
                          <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(c.netSales)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-extrabold text-xs">{c.salesPercentage}%</span>
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, c.salesPercentage)}%` }} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 4: ITEM SUMMARY (BOM & PROFITABILITY) */}
        {/* ========================================================================= */}
        {!loading && activeTab === "item" && itemData && (
          <TabsContent value="item" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter dish name, variant or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>
              <div className="text-xs text-muted-foreground font-semibold">
                Total Menu Items Sold: <span className="font-bold text-foreground">{itemData.rows.length}</span>
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-extrabold text-xs">Menu Item</TableHead>
                        <TableHead className="font-extrabold text-xs">Variant</TableHead>
                        <TableHead className="font-extrabold text-xs">Category</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Qty Sold</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Avg Price</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Gross Sales</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">BOM Cost / Unit</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Total Cost</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Gross Profit</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Profit %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItemRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-10 text-muted-foreground text-sm font-medium">
                            No menu item sales found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItemRows.map((item) => (
                          <TableRow key={`${item.menuItemId}-${item.variantName}`} className="hover:bg-muted/30">
                            <TableCell className="font-bold text-xs">
                              {item.itemName}
                              {item.shortCode && <span className="ml-1 text-[10px] font-mono text-muted-foreground">({item.shortCode.toUpperCase()})</span>}
                            </TableCell>
                            <TableCell className="font-medium text-xs text-muted-foreground">{item.variantName}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[10px]">{item.categoryName}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">{item.quantitySold}</TableCell>
                            <TableCell className="text-right font-medium text-xs">{formatCurrency(item.averageSellingPrice)}</TableCell>
                            <TableCell className="text-right font-bold text-xs">{formatCurrency(item.grossSales)}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-muted-foreground">{formatCurrency(item.unitCost)}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-muted-foreground">{formatCurrency(item.totalCost)}</TableCell>
                            <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(item.profit)}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-extrabold ${
                                  item.profitPercentage >= 60
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : item.profitPercentage >= 40
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                }`}
                              >
                                {item.profitPercentage}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {filteredItemRows.length > itemPageSize && (
                  <div className="p-3 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Showing <strong className="text-foreground">{(itemPage - 1) * itemPageSize + 1}</strong> to{" "}
                      <strong className="text-foreground">{Math.min(itemPage * itemPageSize, filteredItemRows.length)}</strong> of{" "}
                      <strong className="text-foreground">{filteredItemRows.length}</strong> items
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={itemPage <= 1}
                        onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <span className="font-bold text-xs px-2">
                        {itemPage} / {Math.ceil(filteredItemRows.length / itemPageSize)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={itemPage >= Math.ceil(filteredItemRows.length / itemPageSize)}
                        onClick={() => setItemPage((p) => p + 1)}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Footer Totals */}
                {itemData.rows.length > 0 && (
                  <div className="bg-muted/80 p-4 border-t-2 border-border flex flex-wrap items-center justify-between gap-4 text-xs font-black">
                    <span className="uppercase tracking-wider text-muted-foreground">Item Totals</span>
                    <div className="flex flex-wrap items-center gap-6">
                      <span>Total Units: <strong className="text-foreground">{itemData.totals.totalQuantity}</strong></span>
                      <span>Total Gross: <strong className="text-foreground">{formatCurrency(itemData.totals.totalGrossSales)}</strong></span>
                      <span>Total COGS: <strong className="text-muted-foreground">{formatCurrency(itemData.totals.totalCost)}</strong></span>
                      <span>Total Profit: <strong className="text-emerald-600 text-sm">{formatCurrency(itemData.totals.totalProfit)}</strong></span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 5: ORDER SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "order" && orderData && (
          <TabsContent value="order" className="space-y-6 mt-0">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Order # or Customer..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setOrderPage(1);
                    }}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>

                <Select
                  value={orderStatusFilter}
                  onValueChange={(val) => {
                    setOrderStatusFilter(val);
                    setOrderPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 w-36 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="BILLED">Billed</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={orderTypeFilter}
                  onValueChange={(val) => {
                    setOrderTypeFilter(val);
                    setOrderPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 w-36 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Order Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="DINE_IN">Dine In</SelectItem>
                    <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                Total Orders Found: <span className="font-bold text-foreground">{orderData.pagination.totalRecords}</span>
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-extrabold text-xs">Order #</TableHead>
                        <TableHead className="font-extrabold text-xs">Date &amp; Time</TableHead>
                        <TableHead className="font-extrabold text-xs">Type</TableHead>
                        <TableHead className="font-extrabold text-xs">Table</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Covers</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Status</TableHead>
                        <TableHead className="font-extrabold text-xs">Waiter</TableHead>
                        <TableHead className="font-extrabold text-xs">Customer</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Subtotal</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Discount</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Tax</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Grand Total</TableHead>
                        <TableHead className="font-extrabold text-xs">Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderData.orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={13} className="text-center py-10 text-muted-foreground text-sm font-medium">
                            No orders found matching criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        orderData.orders.map((o) => (
                          <TableRow key={o._id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">#{o.orderNumber}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-medium">
                              {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{o.orderType}</TableCell>
                            <TableCell className="text-xs font-bold">{o.tableNumber}</TableCell>
                            <TableCell className="text-center font-bold text-xs text-amber-600 dark:text-amber-400">{o.covers}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-extrabold ${
                                  o.status === "PAID"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : o.status === "BILLED"
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    : o.status === "CANCELLED"
                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                }`}
                              >
                                {o.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs truncate max-w-[100px]">{o.waiterName}</TableCell>
                            <TableCell className="text-xs truncate max-w-[110px]">{o.customerName}</TableCell>
                            <TableCell className="text-right font-medium text-xs">{formatCurrency(o.subtotal)}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-rose-500">{o.discount > 0 ? `-${formatCurrency(o.discount)}` : "₹0"}</TableCell>
                            <TableCell className="text-right font-medium text-xs text-blue-600">+{formatCurrency(o.totalTax)}</TableCell>
                            <TableCell className="text-right font-extrabold text-xs text-foreground">{formatCurrency(o.grandTotal)}</TableCell>
                            <TableCell className="text-xs font-semibold text-muted-foreground truncate max-w-[90px]">{o.paymentMethods}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Bar */}
                <div className="p-3 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Page <strong className="text-foreground">{orderData.pagination.page}</strong> of <strong className="text-foreground">{orderData.pagination.totalPages || 1}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={orderPage <= 1}
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      className="h-8 text-xs font-bold rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={orderPage >= orderData.pagination.totalPages}
                      onClick={() => setOrderPage((p) => p + 1)}
                      className="h-8 text-xs font-bold rounded-lg"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 6: GROUP SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "group" && groupData && (
          <TabsContent value="group" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kitchen Station Groups */}
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-blue-500" /> Kitchen Station Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-extrabold text-xs">Station</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Items Prepared</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Gross Sales</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Share %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupData.stationGroups.map((g) => (
                        <TableRow key={g.groupName}>
                          <TableCell className="font-bold text-xs">{g.groupName}</TableCell>
                          <TableCell className="text-center font-semibold text-xs">{g.quantitySold}</TableCell>
                          <TableCell className="text-right font-bold text-xs">{formatCurrency(g.grossSales)}</TableCell>
                          <TableCell className="text-right font-extrabold text-xs text-blue-600">{g.salesPercentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Modifier / Add-on Groups */}
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-emerald-500" /> Add-ons &amp; Modifier Groups
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-extrabold text-xs">Modifier Group</TableHead>
                        <TableHead className="font-extrabold text-xs text-center">Selections</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Sales Value</TableHead>
                        <TableHead className="font-extrabold text-xs text-right">Share %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupData.modifierGroups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm font-medium">
                            No modifier group sales recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        groupData.modifierGroups.map((g) => (
                          <TableRow key={g.groupName}>
                            <TableCell className="font-bold text-xs">{g.groupName}</TableCell>
                            <TableCell className="text-center font-semibold text-xs">{g.quantitySold}</TableCell>
                            <TableCell className="text-right font-bold text-xs">{formatCurrency(g.grossSales)}</TableCell>
                            <TableCell className="text-right font-extrabold text-xs text-emerald-600">{g.salesPercentage}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 7: VARIATION SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "variation" && variationData && (
          <TabsContent value="variation" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter item or variant size..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>
              <div className="text-xs text-muted-foreground font-semibold">
                Total Variations Sold: <span className="font-bold text-foreground">{variationData.rows.length}</span>
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-extrabold text-xs">Menu Item</TableHead>
                      <TableHead className="font-extrabold text-xs">Variant (Size/Portion)</TableHead>
                      <TableHead className="font-extrabold text-xs">Category</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Unit Price</TableHead>
                      <TableHead className="font-extrabold text-xs text-center">Qty Sold</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Gross Sales</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Tax</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Net Sales</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Sales Share %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVariationRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm font-medium">
                          No variation sales found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedVariationRows.map((v) => (
                        <TableRow key={`${v.menuItemId}-${v.variantName}`} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-xs">{v.itemName}</TableCell>
                          <TableCell className="font-semibold text-xs text-blue-600 dark:text-blue-400">{v.variantName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{v.categoryName}</TableCell>
                          <TableCell className="text-right font-medium text-xs">{formatCurrency(v.unitPrice)}</TableCell>
                          <TableCell className="text-center font-bold text-xs">{v.quantitySold}</TableCell>
                          <TableCell className="text-right font-bold text-xs">{formatCurrency(v.grossSales)}</TableCell>
                          <TableCell className="text-right font-medium text-xs text-blue-600">+{formatCurrency(v.taxAmount)}</TableCell>
                          <TableCell className="text-right font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(v.netSales)}</TableCell>
                          <TableCell className="text-right font-bold text-xs">{v.salesPercentage}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {filteredVariationRows.length > variationPageSize && (
                  <div className="p-3 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Showing <strong className="text-foreground">{(variationPage - 1) * variationPageSize + 1}</strong> to{" "}
                      <strong className="text-foreground">{Math.min(variationPage * variationPageSize, filteredVariationRows.length)}</strong> of{" "}
                      <strong className="text-foreground">{filteredVariationRows.length}</strong> variations
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={variationPage <= 1}
                        onClick={() => setVariationPage((p) => Math.max(1, p - 1))}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <span className="font-bold text-xs px-2">
                        {variationPage} / {Math.ceil(filteredVariationRows.length / variationPageSize)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={variationPage >= Math.ceil(filteredVariationRows.length / variationPageSize)}
                        onClick={() => setVariationPage((p) => p + 1)}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* REPORT 8: COVER SIZE SUMMARY */}
        {/* ========================================================================= */}
        {!loading && activeTab === "cover-size" && coverSizeData && (
          <TabsContent value="cover-size" className="space-y-6 mt-0">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> Party Size &amp; Cover Distribution Summary
                </CardTitle>
                <CardDescription>
                  Exact headcount metrics showing orders, guests served, revenue, and Spend Per Cover (APC) by party size brackets.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-extrabold text-xs">Party Size (Covers Bracket)</TableHead>
                      <TableHead className="font-extrabold text-xs text-center">Orders Count</TableHead>
                      <TableHead className="font-extrabold text-xs text-center">Total Covers (Guests)</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Gross Sales</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Net Sales</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Grand Total</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Avg Spend / Cover (APC)</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Avg Order Value (AOV)</TableHead>
                      <TableHead className="font-extrabold text-xs text-right">Revenue Share %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverSizeData.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm font-medium">
                          No cover size data recorded for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      coverSizeData.rows.map((row) => (
                        <TableRow key={row.coverBracket} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-xs flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{row.coverBracket}</span>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-xs">{row.orderCount}</TableCell>
                          <TableCell className="text-center font-bold text-xs text-amber-600 dark:text-amber-400">{row.totalCovers}</TableCell>
                          <TableCell className="text-right font-medium text-xs">{formatCurrency(row.grossSales)}</TableCell>
                          <TableCell className="text-right font-semibold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(row.netSales)}</TableCell>
                          <TableCell className="text-right font-bold text-xs">{formatCurrency(row.grandTotal)}</TableCell>
                          <TableCell className="text-right font-black text-xs text-purple-600 dark:text-purple-400">{formatCurrency(row.averageSpendPerCover)}</TableCell>
                          <TableCell className="text-right font-medium text-xs">{formatCurrency(row.averageOrderValue)}</TableCell>
                          <TableCell className="text-right font-extrabold text-xs">{row.salesPercentage}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Footer Totals */}
                {coverSizeData.rows.length > 0 && (
                  <div className="bg-muted/80 p-4 border-t-2 border-border flex flex-wrap items-center justify-between gap-4 text-xs font-black">
                    <span className="uppercase tracking-wider text-muted-foreground">Overall Cover Metrics</span>
                    <div className="flex flex-wrap items-center gap-6">
                      <span>Total Orders: <strong className="text-foreground">{coverSizeData.totals.totalOrders}</strong></span>
                      <span>Total Guests (Covers): <strong className="text-amber-600 dark:text-amber-400 text-sm">{coverSizeData.totals.totalCovers}</strong></span>
                      <span>Total Net: <strong className="text-emerald-600">{formatCurrency(coverSizeData.totals.totalNetSales)}</strong></span>
                      <span>Overall APC: <strong className="text-purple-600 text-sm">{formatCurrency(coverSizeData.totals.overallAverageSpendPerCover)} / guest</strong></span>
                      <span>Grand Total: <strong className="text-blue-700 dark:text-blue-300 text-sm">{formatCurrency(coverSizeData.totals.totalGrandTotal)}</strong></span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

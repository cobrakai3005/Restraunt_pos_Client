"use client";

import React, { useEffect, useState, useMemo } from "react";
import { clientService } from "@/services/client.service";
import { orderService, DuePaymentRecord, Order } from "@/services/order.service";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Download,
  Search,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  History,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DueReceivablesReportPage() {
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data & Summary
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({
    totalOutstandingDue: 0,
    totalCollectedDue: 0,
    activeDueCount: 0,
    settledDueCount: 0,
  });

  // Modal States
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<Order | null>(null);
  const [collectOrder, setCollectOrder] = useState<Order | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectMethod, setCollectMethod] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("CASH");
  const [collectNotes, setCollectNotes] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // 1. Fetch restaurants
  useEffect(() => {
    async function loadRestaurants() {
      try {
        const res = await clientService.getRestaurants();
        const list = Array.isArray(res) ? res : res.data || [];
        setRestaurants(list);
        if (list.length > 0) {
          setSelectedRestaurantId(list[0]._id);
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error loading restaurants",
          description: err.message,
        });
      }
    }
    loadRestaurants();
  }, [toast]);

  // 2. Fetch Due / Credit Orders
  const fetchDueOrders = async () => {
    if (!selectedRestaurantId) return;
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await orderService.getDueOrders(selectedRestaurantId, params);

      if (res?.success) {
        setOrders(res.data || []);
        setTotalItems(res.meta?.total || 0);
        setTotalPages(res.meta?.pages || 1);
        if (res.summary) {
          setSummary(res.summary);
        }
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to fetch credit records",
        description: err.response?.data?.message || err.message,
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDueOrders();
  }, [selectedRestaurantId, page, limit, statusFilter, fromDate, toDate]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDueOrders();
  };

  // Open Collect Credit Payment Modal
  const handleOpenCollect = (order: Order) => {
    setCollectOrder(order);
    const remaining = order.financials?.dueAmount || 0;
    setCollectAmount(remaining > 0 ? String(remaining) : "");
    setCollectMethod("CASH");
    setCollectNotes("");
  };

  // Submit Due Payment
  const handleSubmitDuePayment = async () => {
    if (!collectOrder || !selectedRestaurantId) return;
    const amt = parseFloat(collectAmount);
    const remaining = collectOrder.financials?.dueAmount || 0;

    if (isNaN(amt) || amt <= 0) {
      return toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid credit collection amount greater than 0.",
      });
    }

    if (amt > remaining) {
      return toast({
        variant: "destructive",
        title: "Amount Exceeds Credit",
        description: `Payment amount (₹${amt.toFixed(2)}) cannot exceed outstanding credit (₹${remaining.toFixed(2)}).`,
      });
    }

    try {
      setIsSubmittingPayment(true);
      await orderService.addDuePayment(selectedRestaurantId, collectOrder._id, {
        amount: amt,
        method: collectMethod,
        notes: collectNotes,
      });

      toast({
        title: "Credit Payment Collected! 🎉",
        description: `₹${amt.toFixed(2)} recorded via ${collectMethod}.`,
      });

      setCollectOrder(null);
      await fetchDueOrders();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.response?.data?.message || err.message || "Failed to record payment",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    if (!selectedRestaurantId) return;
    try {
      setIsExporting(true);
      // Fetch full list without pagination limit for export
      const res = await orderService.getDueOrders(selectedRestaurantId, {
        limit: 5000,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      const exportList: Order[] = res?.data || [];
      if (exportList.length === 0) {
        return toast({
          title: "No Data",
          description: "No credit records found matching the current filters.",
        });
      }

      const headers = [
        "Invoice / Order #",
        "Date",
        "Customer Name",
        "Customer Phone",
        "Grand Total (INR)",
        "Paid Amount (INR)",
        "Outstanding Credit (INR)",
        "Credit Status",
        "Payment History (Method - Amount - Date)",
      ];

      const rows = exportList.map((o) => {
        const paymentsSummary = (o.financials?.duePayments || [])
          .map(
            (p) =>
              `${p.method}: Rs.${p.amount} on ${new Date(p.receivedAt).toLocaleDateString("en-IN")}`
          )
          .join(" | ");

        return [
          `"${o._id.slice(-6).toUpperCase()}"`,
          `"${new Date(o.createdAt).toLocaleString("en-IN")}"`,
          `"${(o.customerDetails?.name || "Walk-in Guest").replace(/"/g, '""')}"`,
          `"${o.customerDetails?.phone || "N/A"}"`,
          o.financials?.grandTotal || 0,
          o.financials?.paidAmount || 0,
          o.financials?.dueAmount || 0,
          `"${o.financials?.dueStatus || "NONE"}"`,
          `"${paymentsSummary.replace(/"/g, '""')}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Credit_Receivables_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Exported",
        description: `Exported ${exportList.length} credit records to CSV.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-amber-500" />
            Credit & Receivables Report
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track customer credit balances, payment logs, and collect outstanding dues in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {restaurants.length > 1 && (
            <Select
              value={selectedRestaurantId}
              onValueChange={(val) => {
                setSelectedRestaurantId(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px] h-10 font-semibold">
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
          )}

          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting || isLoading || orders.length === 0}
            className="gap-2 font-bold h-10 shadow-xs"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/20 dark:to-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Outstanding Credit
              </p>
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                ₹{summary.totalOutstandingDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Unsettled receivables</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:to-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Collected Credit
              </p>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                ₹{summary.totalCollectedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total recovered dues</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Credit Orders
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.activeDueCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pending / partial balance</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Settled Orders
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.settledDueCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Fully paid credit orders</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Check className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            {/* Search */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Search Customer / Invoice</Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Customer name, phone, or invoice #"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs font-medium rounded-xl"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">Credit Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending (Full Credit)</SelectItem>
                  <SelectItem value="PARTIAL">Partial Credit</SelectItem>
                  <SelectItem value="PAID">Settled (Paid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 text-xs font-medium rounded-xl"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 text-xs font-medium rounded-xl"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                <TableRow>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Date & Time</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Invoice / Order</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Customer Details</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Grand Total</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Paid</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Outstanding</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8} className="h-14 text-center">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse mx-auto w-3/4" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreditCard className="w-8 h-8 opacity-40 text-slate-400" />
                        <p className="font-semibold text-sm">No credit / due records found</p>
                        <p className="text-xs">Adjust your search filters or date range.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => {
                    const dueAmt = Number(o.financials?.dueAmount || 0);
                    const paidAmt = Number(o.financials?.paidAmount || 0);
                    const grandTotal = Number(o.financials?.grandTotal || 0);
                    const dueStatus = o.financials?.dueStatus || "NONE";
                    const paymentCount = o.financials?.duePayments?.length || 0;

                    return (
                      <TableRow key={o._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                        {/* Date */}
                        <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>

                        {/* Invoice # */}
                        <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          #ORD-{o._id.slice(-4).toUpperCase()}
                          <div className="text-[10px] text-muted-foreground font-sans">
                            {o.orderType}
                          </div>
                        </TableCell>

                        {/* Customer */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {o.customerDetails?.name || "Walk-in Guest"}
                              </div>
                              {o.customerDetails?.phone && (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" /> {o.customerDetails.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Grand Total */}
                        <TableCell className="text-right text-xs font-bold text-slate-900 dark:text-white">
                          ₹{grandTotal.toFixed(2)}
                        </TableCell>

                        {/* Paid */}
                        <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{paidAmt.toFixed(2)}
                        </TableCell>

                        {/* Outstanding Credit */}
                        <TableCell className="text-right text-xs font-black text-amber-600 dark:text-amber-400">
                          ₹{dueAmt.toFixed(2)}
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-center">
                          {dueStatus === "PAID" && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 text-[10px] font-black uppercase">
                              Settled ✓
                            </Badge>
                          )}
                          {dueStatus === "PARTIAL" && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 text-[10px] font-black uppercase">
                              Partial Credit
                            </Badge>
                          )}
                          {dueStatus === "PENDING" && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 text-[10px] font-black uppercase">
                              Pending Credit
                            </Badge>
                          )}
                          {dueStatus === "NONE" && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-slate-400">
                              Standard
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {paymentCount > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrderForHistory(o)}
                                className="h-8 text-xs font-bold px-2.5 rounded-lg text-slate-600 dark:text-slate-300"
                                title="View payment logs"
                              >
                                <History className="w-3.5 h-3.5 mr-1" /> {paymentCount}
                              </Button>
                            )}

                            {dueAmt > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenCollect(o)}
                                className="h-8 text-xs font-extrabold px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                              >
                                Collect
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/60 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <span>Rows per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[70px] h-8 text-xs font-bold rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                {totalItems === 0
                  ? "Showing 0 of 0 orders"
                  : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, totalItems)} of ${totalItems} orders`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-xs font-bold px-2">
                Page {page} of {totalPages || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Dialog */}
      {selectedOrderForHistory && (
        <Dialog
          open={Boolean(selectedOrderForHistory)}
          onOpenChange={(open) => !open && setSelectedOrderForHistory(null)}
        >
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Payment Collection History
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border/60 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    #ORD-{selectedOrderForHistory._id.slice(-4).toUpperCase()}
                  </span>
                  <div className="text-muted-foreground">
                    {selectedOrderForHistory.customerDetails?.name || "Walk-in Guest"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-amber-600">
                    Remaining: ₹{(selectedOrderForHistory.financials?.dueAmount || 0).toFixed(2)}
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    Total: ₹{(selectedOrderForHistory.financials?.grandTotal || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {(selectedOrderForHistory.financials?.duePayments || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/50 bg-white dark:bg-slate-950 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div>
                      <div className="font-black text-emerald-600 dark:text-emerald-400">
                        + ₹{p.amount.toFixed(2)} via {p.method}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(p.receivedAt).toLocaleString("en-IN")}
                      </div>
                      {p.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          "{p.notes}"
                        </div>
                      )}
                    </div>
                    {p.receivedBy && typeof p.receivedBy === "object" && (
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {p.receivedBy.contactName || "Staff"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Collect Credit Modal */}
      {collectOrder && (
        <Dialog open={Boolean(collectOrder)} onOpenChange={(open) => !open && setCollectOrder(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Collect Outstanding Credit
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
                  <span>Invoice #</span>
                  <span className="font-mono font-bold">#ORD-{collectOrder._id.slice(-4).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
                  <span>Customer</span>
                  <span className="font-bold">{collectOrder.customerDetails?.name || "Walk-in Guest"}</span>
                </div>
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
                  <span>Total Order Bill</span>
                  <span className="font-bold">₹{collectOrder.financials?.grandTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
                  <span>Paid so far</span>
                  <span className="font-bold text-emerald-600">₹{(collectOrder.financials?.paidAmount || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100">Outstanding Due</span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-300">
                    ₹{(collectOrder.financials?.dueAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount to Collect (₹)</Label>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(String(collectOrder.financials?.dueAmount || 0))}
                    className="text-[10px] font-bold text-amber-600 hover:underline"
                  >
                    Pay Full ₹{(collectOrder.financials?.dueAmount || 0).toFixed(0)}
                  </button>
                </div>
                <Input
                  type="number"
                  min="1"
                  max={collectOrder.financials?.dueAmount || 0}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-11 font-bold text-base rounded-xl"
                />
              </div>

              {/* Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Received Via</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["CASH", "UPI", "CARD", "OTHER"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCollectMethod(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                        collectMethod === m
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {m === "CASH" ? "💵 Cash" : m === "UPI" ? "📱 UPI" : m === "CARD" ? "💳 Card" : "📄 Other"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes (Optional)</Label>
                <Input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="e.g., Reference number / received by"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <Button
                className="w-full h-12 font-extrabold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl shadow-md disabled:opacity-50"
                disabled={isSubmittingPayment || !collectAmount || parseFloat(collectAmount) <= 0}
                onClick={handleSubmitDuePayment}
              >
                {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                {isSubmittingPayment ? "Processing..." : `Confirm Collection ₹${parseFloat(collectAmount || "0").toFixed(2)}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

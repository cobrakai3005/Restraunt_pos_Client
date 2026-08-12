"use client";
import React, { useEffect, useState, useCallback } from "react";
import { 
  ShieldCheck, 
  Search, 
  Unlock, 
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { employeeService } from "@/services/employee.service";

function AuditSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-3.5 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-3.5 w-28 ml-auto" />
        </div>
      </div>

      {/* Summary cards skeleton — 3 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-7 w-28 mt-2" />
          </Card>
        ))}
      </div>

      {/* Orders list card skeleton */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-16 rounded-xl" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: format Date → "YYYY-MM-DD" for <input type="date">
const toInputDate = (d: Date) => d.toISOString().slice(0, 10);

export function ManagerAuditTab() {
  const today = toInputDate(new Date());

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo]   = useState<string>(today);

  const extractArray = (res: any, key?: string) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (key && Array.isArray(res.data?.[key])) return res.data[key];
    if (key && Array.isArray(res[key])) return res[key];
    return [];
  };

  const fetchAuditOrders = useCallback(async (from = dateFrom, to = dateTo) => {
    setLoading(true);
    try {
      const res = await employeeService.getOrders({
        limit: 500,
        page: 1,
        startDate: from,
        endDate: to,
      });
      const extracted = extractArray(res, "orders");
      setOrders(extracted);
      setTotalOrders(res?.meta?.totalRecords ?? res?.meta?.total ?? extracted.length);
    } catch (err) {
      console.error("Failed to load audit orders:", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchAuditOrders();
  }, [fetchAuditOrders]);

  const handleReopen = async (orderId: string) => {
    setReopeningId(orderId);
    try {
      await employeeService.reopenOrder(orderId);
      await fetchAuditOrders(dateFrom, dateTo);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to re-open order");
    } finally {
      setReopeningId(null);
    }
  };

  const safeOrdersList = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrdersList.filter(o => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    if (!matchesStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o._id).toLowerCase().includes(q);
      const matchTable = o.tableId?.tableNumber?.toLowerCase().includes(q);
      const matchWaiter = o.waiterId?.contactName?.toLowerCase().includes(q);
      const matchCustomer = o.customerDetails?.name?.toLowerCase().includes(q);
      return matchId || matchTable || matchWaiter || matchCustomer;
    }
    return true;
  });

  const billedCount = orders.filter(o => o.status === "BILLED").length;
  const paidCount = orders.filter(o => o.status === "PAID").length;
  const openCount = orders.filter(o => o.status === "OPEN").length;

  if (loading) return <AuditSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-purple-500" /> Manager Overrides & Audit Log
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
              Audit settled bills, authorize order re-opens, and monitor shift transactions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Table, Waiter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-48 sm:w-56 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAuditOrders(dateFrom, dateTo)}
              disabled={loading}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          <CalendarDays className="h-4 w-4 text-purple-500 shrink-0" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Date Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 font-medium">From</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 font-medium">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={e => setDateTo(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {(dateFrom !== today || dateTo !== today) && (
            <button
              onClick={() => { setDateFrom(today); setDateTo(today); }}
              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 underline"
            >
              Reset to Today
            </button>
          )}
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {loading ? "Loading..." : `${orders.length} orders fetched`}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 p-4 shadow-sm">
          <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Currently Billed (Awaiting Payment)</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{billedCount} Orders</div>
        </Card>

        <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 p-4 shadow-sm">
          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase">Paid & Settled Shift Orders</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{paidCount} Orders</div>
        </Card>

        <Card className="bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 p-4 shadow-sm">
          <div className="text-xs font-bold text-purple-800 dark:text-purple-400 uppercase">Manager Authorizations</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">Re-opening billed orders resets status to OPEN for cashier corrections.</div>
        </Card>
      </div>

      {/* Audit Orders List */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white">Shift Order Register & Authorization Audit</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredOrders.length} of {totalOrders || orders.length} orders
              </CardDescription>
            </div>
            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {(["ALL", "OPEN", "BILLED", "PAID"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                    statusFilter === s
                      ? s === "OPEN" ? "bg-red-500 text-white border-red-500"
                        : s === "BILLED" ? "bg-amber-500 text-white border-amber-500"
                        : s === "PAID" ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-slate-500"
                  }`}
                >
                  {s === "ALL" ? `All (${orders.length})` : s === "OPEN" ? `Open (${openCount})` : s === "BILLED" ? `Billed (${billedCount})` : `Paid (${paidCount})`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-semibold">No orders match your search query.</div>
          ) : (
            <ScrollArea className="h-[600px] overflow-y-auto pr-1">
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const isBilled = order.status === "BILLED";
                  const isPaid = order.status === "PAID";
                  const isOpen = order.status === "OPEN";

                  return (
                    <div
                      key={order._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          #{order._id?.slice(-4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                            <span>{order.orderType === "DINE_IN" ? `Table ${order.tableId?.tableNumber}` : order.orderType}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                isOpen ? "bg-red-100 text-red-700 border-red-300" : isBilled ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-2">
                            <span>Waiter: {order.waiterId?.contactName || "Counter"}</span>
                            <span>• Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>• Grand Total: <strong className="text-slate-900 dark:text-white font-mono">₹{order.financials?.grandTotal || 0}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isBilled && (
                          <Button
                            size="sm"
                            onClick={() => handleReopen(order._id)}
                            disabled={reopeningId === order._id}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl gap-1.5 text-xs shadow-md"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            {reopeningId === order._id ? "Re-opening..." : "Re-Open Order"}
                          </Button>
                        )}
                        {isPaid && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 text-xs font-bold px-3 py-1">
                            ✓ Paid & Settled
                          </Badge>
                        )}
                        {isOpen && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-300 text-xs font-bold px-3 py-1">
                            Live Open
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

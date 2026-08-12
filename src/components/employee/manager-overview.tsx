"use client";
import React, { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Flame, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  RefreshCw,
  ChefHat,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employeeService } from "@/services/employee.service";

interface ManagerOverviewProps {
  onNavigateToFloor: () => void;
  onNavigateToAudit: () => void;
}

export function ManagerOverview({ onNavigateToFloor, onNavigateToAudit }: ManagerOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const extractArray = (res: any, key?: string) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (key && Array.isArray(res.data?.[key])) return res.data[key];
    if (key && Array.isArray(res[key])) return res[key];
    return [];
  };

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [ordersRes, analyticsRes] = await Promise.allSettled([
        employeeService.getOrders({ limit: 100 }),
        employeeService.getAnalytics()
      ]);

      if (ordersRes.status === "fulfilled") {
        setOrders(extractArray(ordersRes.value, "orders"));
      }
      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        setAnalytics(analyticsRes.value.data);
      }
    } catch (error) {
      console.error("Failed to load manager overview:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Compute live shift metrics
  const safeOrdersList = Array.isArray(orders) ? orders : [];
  const activeOrders = safeOrdersList.filter(o => o.status === "OPEN" || o.status === "BILLED");
  const billedOrders = safeOrdersList.filter(o => o.status === "BILLED" || o.status === "PAID");
  const openOrders = safeOrdersList.filter(o => o.status === "OPEN");

  const todayRevenue = orders
    .filter(o => o.status === "PAID" || o.status === "BILLED")
    .reduce((sum, o) => sum + (o.financials?.grandTotal || 0), 0);

  const avgOrderValue = billedOrders.length > 0 ? Math.round(todayRevenue / billedOrders.length) : 0;

  // Extract all KOTs from open orders to detect delayed tickets (>15 mins)
  const allOpenKots = openOrders.flatMap(order => 
    (order.kots || []).map((kot: any) => ({ ...kot, order }))
  );

  const getTimeElapsedMinutes = (dateStr: string) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 60000);
  };

  const delayedKots = allOpenKots.filter(kot => {
    const elapsed = getTimeElapsedMinutes(kot.createdAt);
    const isPendingOrCooking = kot.items.some((i: any) => i.itemStatus === "PENDING" || i.itemStatus === "PREPARING");
    return elapsed >= 15 && isPendingOrCooking;
  });

  // Extract top selling dishes count
  const itemMap: Record<string, { name: string; count: number; totalSales: number }> = {};
  orders.forEach(o => {
    (o.kots || []).forEach((kot: any) => {
      (kot.items || []).forEach((item: any) => {
        const name = item.menuItemId?.name || "Dish Item";
        if (!itemMap[name]) itemMap[name] = { name, count: 0, totalSales: 0 };
        itemMap[name].count += item.quantity || 1;
        itemMap[name].totalSales += (item.variantPrice || 0) * (item.quantity || 1);
      });
    });
  });

  const topSellingItems = Object.values(itemMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" /> Live Shift Commander
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
            Real-time shift summary, sales performance & kitchen bottleneck alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverviewData}
            disabled={loading}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh Feed
          </Button>
          <Button
            onClick={onNavigateToFloor}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md gap-2"
          >
            <Users className="h-4 w-4" /> View Live Floor
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/50 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Shift Revenue</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">₹{todayRevenue.toLocaleString('en-IN')}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <TrendingUp className="h-3.5 w-3.5" /> Live total from {billedOrders.length} bills
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/50 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Active Shift Orders</span>
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{activeOrders.length}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-blue-700 dark:text-blue-400 font-semibold">
                <span>{openOrders.length} Open • {activeOrders.length - openOrders.length} Billed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/20 border-purple-200 dark:border-purple-900/50 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Avg Order Value (AOV)</span>
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">₹{avgOrderValue}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-purple-700 dark:text-purple-400 font-semibold">
                <span>Per completed table / takeaway ticket</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delayed Kitchen Warning */}
        <Card className={`border shadow-md ${
          delayedKots.length > 0
            ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/30 border-red-300 dark:border-red-900/60"
            : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800"
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${delayedKots.length > 0 ? "text-red-700 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}>
                Delayed Kitchen Tickets
              </span>
              <div className={`p-2 rounded-xl ${delayedKots.length > 0 ? "bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-3xl font-black font-mono ${delayedKots.length > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                {delayedKots.length}
              </div>
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${delayedKots.length > 0 ? "text-red-700 dark:text-red-400" : "text-slate-500"}`}>
                {delayedKots.length > 0 ? "⚠️ Tickets cooking for >15 minutes!" : "✓ Kitchen running smoothly"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Delayed KOTs Alert & Top Selling Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Delayed Kitchen Bottlenecks Alert Widget */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" /> Kitchen Speed & Bottleneck Oversight
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Active tickets requiring manager attention or expedited preparation
              </CardDescription>
            </div>
            {delayedKots.length > 0 && (
              <Badge variant="destructive" className="font-extrabold animate-pulse px-3 py-1 text-xs">
                {delayedKots.length} Urgent Tickets
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {delayedKots.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 opacity-80" />
                <p className="font-bold text-slate-700 dark:text-slate-200">No delayed tickets in the kitchen!</p>
                <p className="text-xs max-w-sm text-slate-500">All orders are currently being prepared within expected cooking times.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {delayedKots.map((kot, idx) => {
                  const elapsed = getTimeElapsedMinutes(kot.createdAt);
                  return (
                    <div
                      key={kot._id || idx}
                      className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                          #{kot.kotNumber}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Order #{kot.order._id?.slice(-4)}</span>
                            <Badge variant="outline" className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 text-[10px]">
                              {kot.order.orderType === "DINE_IN" ? `Table ${kot.order.tableId?.tableNumber}` : kot.order.orderType}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-2">
                            <span>Wait Time: <strong className="text-red-600 dark:text-red-400 font-mono font-bold">{elapsed} mins</strong></span>
                            <span>• {kot.items.length} item(s)</span>
                            {kot.order.waiterId && <span>• Waiter: {kot.order.waiterId.contactName}</span>}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={onNavigateToFloor}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shrink-0 gap-1.5"
                      >
                        Inspect Order <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right 1 Col: Shift Top Selling Items */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Shift Top Selling Dishes
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Most requested menu items during this shift
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {topSellingItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                No order item data yet for this shift.
              </div>
            ) : (
              <div className="space-y-3">
                {topSellingItems.map((dish, i) => (
                  <div
                    key={dish.name}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20 font-mono">
                        #{i + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{dish.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">₹{dish.totalSales} total revenue</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold">
                      {dish.count} sold
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

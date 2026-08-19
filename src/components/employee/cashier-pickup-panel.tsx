"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Search,
  UtensilsCrossed,
  User as UserIcon,
  ChefHat,
  Filter,
  CheckCheck,
} from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface DashboardProps {
  user: User;
  embedded?: boolean;
}

interface KotItem {
  _id: string;
  menuItemId: {
    _id: string;
    name: string;
  };
  variantName?: string;
  quantity: number;
  selectedModifiers?: {
    name: string;
    price: number;
    groupName?: string;
  }[];
  notes?: string;
  isComplimentary?: boolean;
  itemStatus: "PENDING" | "PREPARING" | "READY" | "SERVED";
}

interface Kot {
  _id: string;
  kotNumber: number;
  items: KotItem[];
  createdAt: string;
}

interface Order {
  _id: string;
  orderNumber: number;
  tableId?: {
    _id?: string;
    tableNumber: string;
  };
  customerDetails?: {
    name?: string;
    phone?: string;
  };
  waiterId?: {
    contactName: string;
  };
  orderType: string;
  status: string;
  kots: Kot[];
  createdAt: string;
}

type FilterType = "ALL" | "DINE_IN" | "TAKEAWAY" | "URGENT";

export function CashierPickupPanel({ user, embedded }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await employeeService.getOrders({ status: "OPEN,BILLED", kitchen: "true" });
      const activeList: Order[] = res.data || [];
      // Keep orders that have at least one unserved item
      setOrders(
        activeList.filter((o) =>
          o.kots?.some((k) => k.items?.some((i) => i.itemStatus !== "SERVED"))
        )
      );
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to fetch orders", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    if (!socket) return;

    const handleItemStatusUpdate = (data: { orderId: string; kotItemId: string; itemStatus: string }) => {
      if (!data?.orderId || !data?.kotItemId) return;
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id === data.orderId) {
            return {
              ...o,
              kots: (o.kots || []).map((kot) => ({
                ...kot,
                items: (kot.items || []).map((item) =>
                  item._id === data.kotItemId ? { ...item, itemStatus: data.itemStatus as any } : item
                ),
              })),
            };
          }
          return o;
        })
      );
      fetchOrders();
    };

    socket.on("new_kot", fetchOrders);
    socket.on("item_status_update", handleItemStatusUpdate);
    socket.on("order_billed", fetchOrders);
    socket.on("order_settled", fetchOrders);

    return () => {
      socket.off("new_kot", fetchOrders);
      socket.off("item_status_update", handleItemStatusUpdate);
      socket.off("order_billed", fetchOrders);
      socket.off("order_settled", fetchOrders);
    };
  }, []);

  const markServed = async (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setUpdating((prev) => ({ ...prev, [key]: true }));
    try {
      await employeeService.updateKotItemStatus(orderId, itemId, "SERVED");
      toast({ title: "Item handed over & marked served" });
      fetchOrders();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      toast({ variant: "destructive", title: "Error picking up item", description: message });
    } finally {
      setUpdating((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const markAllReadyServed = async (orderId: string, readyItems: KotItem[]) => {
    for (const item of readyItems) {
      setUpdating((prev) => ({ ...prev, [`${orderId}_${item._id}`]: true }));
    }
    try {
      await Promise.all(
        readyItems.map((item) =>
          employeeService.updateKotItemStatus(orderId, item._id, "SERVED")
        )
      );
      toast({ title: `All ${readyItems.length} ready item(s) handed over!` });
      fetchOrders();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      toast({ variant: "destructive", title: "Error picking up items", description: message });
    } finally {
      setUpdating((prev) => {
        const next = { ...prev };
        readyItems.forEach((item) => delete next[`${orderId}_${item._id}`]);
        return next;
      });
    }
  };

  const getTimeElapsed = (dateString: string) => {
    return Math.max(0, Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000));
  };

  // Group items by Order so 1 Order = 1 Card
  const groupedOrders = useMemo(() => {
    return orders
      .map((order) => {
        const allItems: { item: KotItem; kotNumber: number; kotCreatedAt: string }[] = [];
        (order.kots || []).forEach((kot) => {
          (kot.items || []).forEach((item) => {
            allItems.push({ item, kotNumber: kot.kotNumber, kotCreatedAt: kot.createdAt });
          });
        });

        const readyItems = allItems.filter(({ item }) => item.itemStatus === "READY").map(x => x.item);
        const pendingItems = allItems.filter(
          ({ item }) => item.itemStatus === "PENDING" || item.itemStatus === "PREPARING"
        ).map(x => x.item);
        const servedItems = allItems.filter(({ item }) => item.itemStatus === "SERVED").map(x => x.item);

        const earliestKotDate =
          order.kots?.[0]?.createdAt || order.createdAt || new Date().toISOString();
        const minutesOld = getTimeElapsed(earliestKotDate);

        return {
          order,
          allItems,
          readyItems,
          pendingItems,
          servedItems,
          minutesOld,
          isUrgent: minutesOld >= 12,
        };
      })
      .filter((grouped) => grouped.readyItems.length > 0 || grouped.pendingItems.length > 0)
      .sort((a, b) => {
        // Ready orders first, then by wait time descending
        if (a.readyItems.length > 0 && b.readyItems.length === 0) return -1;
        if (b.readyItems.length > 0 && a.readyItems.length === 0) return 1;
        return b.minutesOld - a.minutesOld;
      });
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return groupedOrders.filter(({ order, minutesOld, readyItems }) => {
      // 1. Tab filter
      if (activeFilter === "DINE_IN" && order.orderType !== "DINE_IN") return false;
      if (activeFilter === "TAKEAWAY" && order.orderType === "DINE_IN") return false;
      if (activeFilter === "URGENT" && minutesOld < 12) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tableNum =
          typeof order.tableId === "object"
            ? order.tableId?.tableNumber?.toLowerCase()
            : (order as any).tableNumber?.toLowerCase();
        const orderNum = String(order.orderNumber || order._id.slice(-4)).toLowerCase();
        const custName = order.customerDetails?.name?.toLowerCase() || "";
        const waiterName = order.waiterId?.contactName?.toLowerCase() || "";
        const hasItemMatch = order.kots?.some((k) =>
          k.items?.some((i) => i.menuItemId?.name?.toLowerCase().includes(q))
        );

        return (
          tableNum?.includes(q) ||
          orderNum.includes(q) ||
          custName.includes(q) ||
          waiterName.includes(q) ||
          hasItemMatch
        );
      }

      return true;
    });
  }, [groupedOrders, activeFilter, searchQuery]);

  // Overall statistics
  const totalReadyCount = useMemo(() => {
    return groupedOrders.reduce((sum, g) => sum + g.readyItems.length, 0);
  }, [groupedOrders]);

  const dineInReadyCount = useMemo(() => {
    return groupedOrders.filter((g) => g.order.orderType === "DINE_IN" && g.readyItems.length > 0).length;
  }, [groupedOrders]);

  const takeawayReadyCount = useMemo(() => {
    return groupedOrders.filter((g) => g.order.orderType !== "DINE_IN" && g.readyItems.length > 0).length;
  }, [groupedOrders]);

  const urgentCount = useMemo(() => {
    return groupedOrders.filter((g) => g.isUrgent && g.readyItems.length > 0).length;
  }, [groupedOrders]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[350px] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
          <p className="font-semibold text-sm">Loading Food Pickup Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full bg-slate-50/80 dark:bg-slate-950 p-5 lg:p-6 flex flex-col transition-colors ${
        embedded ? "border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm" : ""
      }`}
    >
      {/* ── Top Header & Statistics ── */}
      <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/20">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Food Pickup &amp; Dispatch
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hand over ready kitchen dishes to waiters &amp; guests
              </p>
            </div>
          </div>
        </div>

        {/* Global Ready Counter Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 font-black text-xs">
            <ShoppingBag className="h-4 w-4" />
            <span>{totalReadyCount} Items Ready</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{groupedOrders.length} Active Tickets</span>
          </div>
        </div>
      </div>

      {/* ── Action Bar: Filter Tabs & Live Search ── */}
      <div className="mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
              activeFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            All ({groupedOrders.length})
          </button>

          <button
            onClick={() => setActiveFilter("DINE_IN")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
              activeFilter === "DINE_IN"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Dine-In ({dineInReadyCount})
          </button>

          <button
            onClick={() => setActiveFilter("TAKEAWAY")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
              activeFilter === "TAKEAWAY"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Takeaway ({takeawayReadyCount})
          </button>

          {urgentCount > 0 && (
            <button
              onClick={() => setActiveFilter("URGENT")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                activeFilter === "URGENT"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse"
                  : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Urgent &gt;12m ({urgentCount})
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search table, order, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* ── Order Ticket Cards Grid ── */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 p-8">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCheck className="h-10 w-10 opacity-70" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              {searchQuery ? "No matching pickup tickets found" : "All Caught Up! No Dishes Waiting"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm">
              {searchQuery
                ? "Try clearing your search query to see all active orders."
                : "Kitchen dishes will appear here instantly as soon as the chef marks them Ready."}
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5 pb-6">
            {filteredOrders.map(({ order, allItems, readyItems, pendingItems, servedItems, minutesOld, isUrgent }) => {
              const tableNum =
                typeof order.tableId === "object"
                  ? order.tableId?.tableNumber
                  : (order as any).tableNumber || "";
              const orderIdSlice = order.orderNumber ? `#${order.orderNumber}` : `#${order._id?.slice(-4)}`;
              const isTakeaway = order.orderType !== "DINE_IN";
              const isUpdatingAll = readyItems.some((i) => updating[`${order._id}_${i._id}`]);
              const allReady = readyItems.length > 0 && pendingItems.length === 0;

              return (
                <Card
                  key={order._id}
                  className={`flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                    isUrgent
                      ? "border-rose-300 dark:border-rose-800/60 bg-gradient-to-b from-rose-50/70 to-white dark:from-rose-950/20 dark:to-slate-900"
                      : allReady
                      ? "border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  {/* Card Header */}
                  <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Table or Takeaway Badge */}
                          {isTakeaway ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-sm gap-1">
                              <ShoppingBag className="h-3 w-3" /> Takeaway
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-sm gap-1">
                              <UtensilsCrossed className="h-3 w-3" /> Table {tableNum || "—"}
                            </Badge>
                          )}

                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                            {orderIdSlice}
                          </span>
                        </div>

                        {/* Customer / Waiter Subtitle */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {order.customerDetails?.name ? (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <UserIcon className="h-3 w-3 text-slate-400" />
                              {order.customerDetails.name}
                            </span>
                          ) : order.waiterId?.contactName ? (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <ChefHat className="h-3 w-3 text-slate-400" />
                              Waiter: {order.waiterId.contactName}
                            </span>
                          ) : (
                            <span>Walk-in Guest</span>
                          )}
                        </div>
                      </div>

                      {/* Timer & Urgency Badge */}
                      <div
                        className={`flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-lg border shrink-0 ${
                          isUrgent
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 animate-pulse"
                            : minutesOld > 6
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{minutesOld}m</span>
                      </div>
                    </div>

                    {/* Progress indicator bar */}
                    <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {readyItems.length}
                        </strong>{" "}
                        Ready • {pendingItems.length} In Kitchen • {servedItems.length} Picked Up
                      </span>
                    </div>
                  </CardHeader>

                  {/* Card Items List */}
                  <CardContent className="p-3.5 flex-1 space-y-2">
                    {allItems.map(({ item, kotNumber }) => {
                      const key = `${order._id}_${item._id}`;
                      const isReady = item.itemStatus === "READY";
                      const isServed = item.itemStatus === "SERVED";
                      const isPending = item.itemStatus === "PENDING" || item.itemStatus === "PREPARING";
                      const isItemUpdating = !!updating[key];

                      return (
                        <div
                          key={item._id}
                          className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all duration-200 ${
                            isReady
                              ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 shadow-sm"
                              : isServed
                              ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-60"
                              : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/40"
                          }`}
                        >
                          {/* Quantity Badge & Dish Name */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span
                              className={`h-7 min-w-[1.75rem] px-1.5 flex items-center justify-center rounded-lg font-black text-xs shrink-0 shadow-sm ${
                                isReady
                                  ? "bg-emerald-600 text-white"
                                  : isServed
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                  : "bg-amber-500 text-white"
                              }`}
                            >
                              {item.quantity}x
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold leading-snug text-slate-900 dark:text-white break-words">
                                {item.menuItemId?.name || "Item"}
                                {item.variantName && item.variantName !== "Standard" && (
                                  <span className="ml-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                    {item.variantName}
                                  </span>
                                )}
                                {item.isComplimentary && (
                                  <span className="ml-1 text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                                    FOC
                                  </span>
                                )}
                              </p>

                              {/* Modifier / Add-on Badges */}
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedModifiers.map((m: any, mIdx: number) => (
                                    <span
                                      key={mIdx}
                                      className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs"
                                    >
                                      +{m.name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Cooking Notes */}
                              {item.notes && (
                                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 mt-1 inline-block">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Button / State Badge */}
                          <div className="shrink-0">
                            {isReady ? (
                              <Button
                                size="sm"
                                onClick={() => markServed(order._id, item._id)}
                                disabled={isItemUpdating}
                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all gap-1.5"
                              >
                                {isItemUpdating ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                <span>{isItemUpdating ? "Serving" : "Hand Over"}</span>
                              </Button>
                            ) : isServed ? (
                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1 pr-1">
                                <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> Served
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/50 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                <Flame className="h-3 w-3 animate-pulse" /> Cooking
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>

                  {/* Card Bottom Quick Action */}
                  {readyItems.length > 0 && (
                    <div className="p-3.5 pt-0 mt-auto">
                      <Button
                        onClick={() => markAllReadyServed(order._id, readyItems)}
                        disabled={isUpdatingAll}
                        className="w-full h-10 rounded-xl font-extrabold text-xs tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all gap-1.5"
                      >
                        {isUpdatingAll ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PackageCheck className="h-4 w-4" />
                        )}
                        <span>
                          {isUpdatingAll
                            ? "Handing Over..."
                            : `Hand Over All Ready (${readyItems.length})`}
                        </span>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

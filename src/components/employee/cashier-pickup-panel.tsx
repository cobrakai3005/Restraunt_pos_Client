"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Clock, Flame, Loader2, PackageCheck, ShoppingBag } from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
  notes?: string;
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
    tableNumber: string;
  };
  waiterId?: {
    contactName: string;
  };
  orderType: string;
  status: string;
  kots: Kot[];
  createdAt: string;
}

export function CashierPickupPanel({ user, embedded }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const resOpen = await employeeService.getOrders({ status: "OPEN" });
      const resBilled = await employeeService.getOrders({ status: "BILLED" });
      const all = [...(resOpen.data || []), ...(resBilled.data || [])];
      setOrders(all.filter(o => o.status !== "PAID"));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to fetch orders", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    if (socket) {
      socket.on("new_kot", fetchOrders);
      socket.on("item_status_update", fetchOrders);
      socket.on("order_billed", fetchOrders);
    }
    return () => {
      if (socket) {
        socket.off("new_kot", fetchOrders);
        socket.off("item_status_update", fetchOrders);
        socket.off("order_billed", fetchOrders);
      }
      disconnectSocket();
    };
  }, [toast]);

  const markServed = async (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setUpdating(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: "" }));
    try {
      await employeeService.updateKotItemStatus(orderId, itemId, "SERVED");
      toast({ title: "Item picked up & served" });
      fetchOrders();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      setErrors(prev => ({ ...prev, [key]: message }));
      toast({ variant: "destructive", title: "Error picking up item", description: message });
    } finally {
      setUpdating(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const markAllServed = async (orderId: string, items: KotItem[]) => {
    const readyItems = items.filter(i => i.itemStatus === "READY");
    for (const item of readyItems) {
      const key = `${orderId}_${item._id}`;
      setUpdating(prev => ({ ...prev, [key]: true }));
    }
    try {
      await Promise.all(readyItems.map(item => employeeService.updateKotItemStatus(orderId, item._id, "SERVED")));
      toast({ title: `${readyItems.length} item(s) picked up & served` });
      fetchOrders();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      toast({ variant: "destructive", title: "Error picking up items", description: message });
    } finally {
      setUpdating(prev => {
        const next = { ...prev };
        readyItems.forEach(item => delete next[`${orderId}_${item._id}`]);
        return next;
      });
    }
  };

  const getTimeElapsed = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-400">Loading pickup board...</p>
      </div>
    );
  }

  // Build a list of KOTs that have at least one READY item
  const readyKots = orders.flatMap(order =>
    (order.kots || []).map(kot => ({ order, kot }))
  )
    .filter(({ kot }) => kot.items.some(i => i.itemStatus === "READY"))
    .sort((a, b) => new Date(a.kot.createdAt).getTime() - new Date(b.kot.createdAt).getTime());

  const readyItemCount = readyKots.reduce(
    (sum, { kot }) => sum + kot.items.filter(i => i.itemStatus === "READY").length,
    0
  );

  return (
    <div className={`h-full w-full bg-slate-50 dark:bg-slate-950 p-6 flex flex-col transition-colors ${embedded ? "border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden" : ""}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="h-6 w-6 text-emerald-500" />
            Ready for Pickup
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Hand over ready food to waiters &amp; guests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="h-9 px-4 text-sm font-bold bg-emerald-600 dark:bg-emerald-500 text-white">
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            {readyItemCount} Ready
          </Badge>
          <Badge variant="outline" className="h-9 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <Flame className="mr-1.5 h-4 w-4 text-orange-500" />
            {readyKots.length} Tickets
          </Badge>
        </div>
      </div>

      {readyKots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
          <PackageCheck className="h-16 w-16 opacity-30" />
          <p className="text-lg font-semibold">No items waiting for pickup</p>
          <p className="text-sm text-slate-500 dark:text-slate-500">Kitchen items will appear here the moment they are marked ready.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
            {readyKots.map(({ order, kot }) => {
              const minutesOld = getTimeElapsed(kot.createdAt);
              const readyItems = kot.items.filter(i => i.itemStatus === "READY");
              const isUpdatingAll = readyItems.some(i => updating[`${order._id}_${i._id}`]);
              const isUrgent = minutesOld > 15;

              return (
                <Card key={kot._id} className={`flex flex-col border overflow-hidden transition-colors ${isUrgent ? 'border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/10' : 'border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-900'} shadow-sm`}>
                  <CardHeader className={`px-5 py-3.5 border-b flex-row items-center justify-between gap-3 ${isUrgent ? 'border-red-200 dark:border-red-900/50 bg-red-100/60 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/20'}`}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-2xl font-black ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>#{kot.kotNumber}</span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Order #{order._id?.slice(-4)}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                            {order.orderType === "DINE_IN" ? `Table ${order.tableId?.tableNumber}` : order.orderType}
                          </Badge>
                          {order.waiterId && (
                            <Badge variant="outline" className="border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px]">
                              {order.waiterId.contactName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold text-sm ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      <Clock className="h-4 w-4" /> {minutesOld}m
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-2.5">
                    {kot.items.map(item => {
                      const key = `${order._id}_${item._id}`;
                      const isReady = item.itemStatus === "READY";
                      const isServed = item.itemStatus === "SERVED";
                      return (
                        <div
                          key={item._id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${isReady
                            ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20'
                            : isServed
                              ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 opacity-70'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'}`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`font-black text-lg px-2.5 rounded-md min-w-[2.75rem] text-center border ${isReady ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                              {item.quantity}x
                            </div>
                            <div className="min-w-0">
                              <p className="text-slate-900 dark:text-white font-semibold leading-tight truncate">
                                {item.menuItemId?.name || "Unknown Item"}
                                {item.variantName && item.variantName !== "Standard" && (
                                  <span className="text-slate-400 dark:text-slate-500 font-medium ml-1.5 text-xs">({item.variantName})</span>
                                )}
                              </p>
                              {item.notes && (
                                <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-semibold bg-red-100 dark:bg-red-950/40 inline-block px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isReady ? (
                              <>
                                <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white text-[10px]">
                                  <PackageCheck className="mr-1 h-3 w-3" /> READY
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => markServed(order._id, item._id)}
                                  disabled={!!updating[key]}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg shadow-md shadow-emerald-900/20"
                                >
                                  {updating[key] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  {updating[key] ? "Picking" : "Pick Up"}
                                </Button>
                              </>
                            ) : isServed ? (
                              <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px]">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> SERVED
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-300 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 text-[10px]">
                                <Flame className="mr-1 h-3 w-3" /> {item.itemStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {errors[`${order._id}_${kot.items[0]?._id}`] && (
                      <p className="text-red-600 dark:text-red-400 text-xs font-semibold bg-red-100 dark:bg-red-950/30 px-3 py-1.5 rounded border border-red-200 dark:border-red-900/50">
                        {errors[`${order._id}_${kot.items[0]?._id}`]}
                      </p>
                    )}
                  </CardContent>

                  <div className="px-4 pb-4 pt-0">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                      disabled={readyItems.length === 0 || isUpdatingAll}
                      onClick={() => markAllServed(order._id, kot.items)}
                    >
                      {isUpdatingAll ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PackageCheck className="mr-2 h-4 w-4" />
                      )}
                      {isUpdatingAll ? "Picking Up..." : `Pick Up All (${readyItems.length})`}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

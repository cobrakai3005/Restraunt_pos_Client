"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Clock, CheckCircle2, Flame, Loader2 } from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  user: User;
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
  status: string;
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
  kots: Kot[];
  createdAt: string;
}

export function ChefDashboard({ user }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchActiveOrders = async () => {
    try {
      const res = await employeeService.getOrders({ status: "OPEN" });
      setOrders(res.data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to fetch orders", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    const socket = connectSocket();
    if (socket) {
      socket.on("new_kot", fetchActiveOrders);
      socket.on("item_status_update", fetchActiveOrders);
    }
    return () => {
      if (socket) {
        socket.off("new_kot", fetchActiveOrders);
        socket.off("item_status_update", fetchActiveOrders);
      }
      disconnectSocket();
    };
  }, [toast]);

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: string) => {
    const key = `${orderId}_${itemId}`;
    setUpdating(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: "" }));
    try {
      await employeeService.updateKotItemStatus(orderId, itemId, newStatus);
      toast({ title: "Ticket updated" });
      fetchActiveOrders();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      setErrors(prev => ({ ...prev, [key]: message }));
      toast({ variant: "destructive", title: "Error updating status", description: message });
    } finally {
      setUpdating(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const getTimeElapsed = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading KDS...</p>
      </div>
    );
  }

  // Extract all KOTs from active orders
  const allKots = orders.flatMap(order => 
    (order.kots || []).map(kot => ({ ...kot, order }))
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const pendingKots = allKots.filter(k => k.items.some(i => i.itemStatus === "PENDING" || i.itemStatus === "PREPARING"));
  const readyKots = allKots.filter(k => k.items.every(i => i.itemStatus === "READY" || i.itemStatus === "SERVED") && k.items.some(i => i.itemStatus === "READY"));

  return (
    <div className="h-[calc(100vh-120px)] bg-slate-50 dark:bg-slate-950 -mx-8 -my-8 p-6 flex flex-col transition-colors">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Kitchen Display System
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Managing live tickets for {user.username}
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        
        {/* PENDING TICKETS */}
        <Card className="flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-orange-600 dark:text-orange-500 flex items-center justify-between text-lg">
              Incoming Tickets
              <Badge variant="outline" className="text-orange-600 dark:text-orange-500 border-orange-500 bg-orange-50 dark:bg-orange-500/10">
                {pendingKots.length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {pendingKots.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-20">
                  No active tickets in kitchen.
                </div>
              ) : (
                pendingKots.map(kot => {
                  const minutesOld = getTimeElapsed(kot.createdAt);
                  const isUrgent = minutesOld > 15;

                  return (
                    <div key={kot._id} className={`rounded-xl border ${isUrgent ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'} overflow-hidden transition-colors`}>
                      <div className={`px-4 py-2 flex justify-between items-center border-b ${isUrgent ? 'border-red-200 dark:border-red-900/50 bg-red-100 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${isUrgent ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>#{kot.kotNumber}</span>
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Order #{kot.order._id?.slice(-4)}
                          </span>
                          <Badge variant="outline" className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {kot.order.orderType === "DINE_IN" ? `Table ${kot.order.tableId?.tableNumber}` : kot.order.orderType}
                          </Badge>
                          {kot.order.waiterId && (
                            <Badge variant="outline" className="border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                              {kot.order.waiterId.contactName}
                            </Badge>
                          )}
                        </div>
                        <div className={`flex items-center gap-1.5 font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          <Clock className="h-4 w-4" /> {minutesOld}m
                        </div>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        {kot.items.map(item => {
                          if (item.itemStatus === "READY" || item.itemStatus === "SERVED") return null;
                          
                          return (
                            <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="font-black text-xl text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-3 rounded-md min-w-[3rem] text-center border border-blue-200 dark:border-blue-800/30">
                                  {item.quantity}x
                                </div>
                                <div className="flex-1">
                                  <p className="text-slate-900 dark:text-white font-medium text-lg leading-none">{item.menuItemId.name}</p>
                                  {item.notes && (
                                    <p className="text-red-600 dark:text-red-400 text-sm mt-1.5 font-semibold bg-red-100 dark:bg-red-950/30 inline-block px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50">
                                      Note: {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex gap-2">
                                  {item.itemStatus === "PENDING" && (
                                    <Button 
                                      onClick={() => updateItemStatus(kot.order._id, item._id, "PREPARING")}
                                      disabled={!!updating[`${kot.order._id}_${item._id}`]}
                                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6"
                                    >
                                      {updating[`${kot.order._id}_${item._id}`] ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : "Cook"}
                                    </Button>
                                  )}
                                  {item.itemStatus === "PREPARING" && (
                                    <Button 
                                      onClick={() => updateItemStatus(kot.order._id, item._id, "READY")}
                                      disabled={!!updating[`${kot.order._id}_${item._id}`]}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6"
                                    >
                                      {updating[`${kot.order._id}_${item._id}`] ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" /> Updating
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-4 w-4" /> Ready
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                                {errors[`${kot.order._id}_${item._id}`] && (
                                  <p className="text-red-600 dark:text-red-400 text-xs font-semibold bg-red-100 dark:bg-red-950/30 px-2 py-1 rounded border border-red-200 dark:border-red-900/50">
                                    {errors[`${kot.order._id}_${item._id}`]}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* READY FOR PICKUP */}
        <Card className="flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-emerald-600 dark:text-emerald-500 flex items-center justify-between text-lg">
              Ready for Pickup
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10">
                {readyKots.length} Ready
              </Badge>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {readyKots.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-20">
                  No items waiting for pickup.
                </div>
              ) : (
                readyKots.map(kot => (
                  <div key={kot._id} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="px-4 py-2 flex justify-between items-center border-b border-emerald-200 dark:border-emerald-900/50 bg-emerald-100 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">#{kot.kotNumber}</span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-200/50">
                          Order #{kot.order._id?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-800/30 text-emerald-600 dark:text-emerald-300">
                          {kot.order.orderType === "DINE_IN" ? `Table ${kot.order.tableId?.tableNumber}` : kot.order.orderType}
                        </Badge>
                        {kot.order.waiterId && (
                          <Badge variant="outline" className="border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            {kot.order.waiterId.contactName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <p className="text-emerald-100/70 text-sm italic text-center">
                        All {kot.items.length} items are marked ready and waiting for waiter.
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

      </div>
    </div>
  );
}

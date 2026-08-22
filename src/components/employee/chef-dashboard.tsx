"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Clock, CheckCircle2, Flame, Loader2, Eye, AlertCircle, ChefHat, UserCheck, Menu, Trash2 } from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { LogWastageDialog } from "@/components/client/log-wastage-dialog";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface DashboardProps {
  user: User;
  embedded?: boolean;
  onOpenDrawer?: () => void;
}

interface KotItem {
  _id: string;
  menuItemId: {
    _id?: string;
    name: string;
    station?: string;
    imageUrl?: string;
  };
  variantName?: string;
  quantity: number;
  selectedModifiers?: {
    name: string;
    price: number;
    groupName?: string;
  }[];
  notes?: string;
  station?: string;
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

export function ChefDashboard({ user, embedded, onOpenDrawer }: DashboardProps) {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedKot, setSelectedKot] = useState<any | null>(null);
  const [gridDensity, setGridDensity] = useState<"normal" | "compact">("normal");
  const [filterUrgency, setFilterUrgency] = useState<"ALL" | "URGENT" | "COOKING" | "PENDING">("ALL");
  const [selectedStation, setSelectedStation] = useState<string>((user as any)?.station || "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [isWastageDialogOpen, setIsWastageDialogOpen] = useState(false);
  const [selectedWastageItem, setSelectedWastageItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const fetchActiveOrders = async () => {
    try {
      const res = await queryClient.fetchQuery({
        queryKey: ["orders", "kitchen"],
        queryFn: () => employeeService.getOrders({ status: "OPEN,BILLED", kitchen: "true" }),
      });
      setOrders(
        (res.data || []).filter(
          (o: any) => o.status === "OPEN" || o.status === "BILLED"
        )
      );
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to fetch orders", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    const refreshKitchen = () => { queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] }); fetchActiveOrders(); };
    const socket = connectSocket();
    if (socket) {
      socket.on("new_kot", refreshKitchen); socket.on("item_status_update", refreshKitchen); socket.on("order_billed", refreshKitchen); socket.on("order_settled", refreshKitchen);
    }
    return () => {
      if (socket) {
        socket.off("new_kot", refreshKitchen); socket.off("item_status_update", refreshKitchen); socket.off("order_billed", refreshKitchen); socket.off("order_settled", refreshKitchen);
      }
    };
  }, [queryClient, toast]);

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: string) => {
    const key = `${orderId}_${itemId}`;
    setUpdating(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: "" }));
    try {
      await employeeService.updateKotItemStatus(orderId, itemId, newStatus);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Ticket updated" });
      fetchActiveOrders();

      // Update selectedKot state in real-time if modal is open
      setSelectedKot((prev: any) => {
        if (!prev || prev.order._id !== orderId) return prev;
        return {
          ...prev,
          items: prev.items.map((i: KotItem) => i._id === itemId ? { ...i, itemStatus: newStatus } : i)
        };
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      setErrors(prev => ({ ...prev, [key]: message }));
      toast({ variant: "destructive", title: "Error updating status", description: message });
    } finally {
      setUpdating(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const markAllReady = async (kot: any) => {
    const pendingItems = kot.items.filter((i: KotItem) => i.itemStatus !== "READY" && i.itemStatus !== "SERVED");
    for (const item of pendingItems) {
      await updateItemStatus(kot.order._id, item._id, "READY");
    }
  };

  const getTimeElapsed = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center bg-slate-50 dark:bg-slate-950">
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
    <div className={`h-full w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 lg:p-6 flex flex-col overflow-hidden transition-colors ${embedded ? "border border-slate-200 dark:border-slate-800 rounded-xl" : ""}`}>
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {onOpenDrawer && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenDrawer}
              title="Open Restaurant POS Menu & Settings"
              className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Flame className="h-6 w-6 md:h-7 md:w-7 text-orange-500 animate-pulse" />
              Kitchen Display System (KDS)
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-0.5 font-medium">
              Live Ticket Terminal • Chef {(user as any)?.contactName || user.username} {(user as any)?.station ? `(Assigned: ${(user as any).station})` : "(All Stations)"}
            </p>
          </div>
        </div>

        {/* Top Controls: Search, Station, Filter, Density */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Station Filter */}
          <Select value={selectedStation} onValueChange={(val) => setSelectedStation(val)}>
            <SelectTrigger className="h-9 md:h-10 w-[190px] md:w-[215px] bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs rounded-xl text-amber-600 dark:text-amber-400 font-bold focus:ring-blue-500 shadow-sm">
              <SelectValue placeholder="Select Station" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
              <SelectItem value="ALL" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                👨‍🍳 All Kitchen Stations
              </SelectItem>
              <SelectItem value="MAIN_KITCHEN" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🍳 Main Kitchen
              </SelectItem>
              <SelectItem value="OVEN" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🍕 Oven / Pizza
              </SelectItem>
              <SelectItem value="TANDOOR" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🔥 Tandoor
              </SelectItem>
              <SelectItem value="GRILL" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🍖 Grill
              </SelectItem>
              <SelectItem value="BAR" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🍹 Bar &amp; Beverages
              </SelectItem>
              <SelectItem value="BAKERY" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🍰 Bakery
              </SelectItem>
              <SelectItem value="COLD_KITCHEN" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                🥗 Cold Kitchen
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search KOT #, Table, Dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 md:h-10 w-36 sm:w-48 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Urgency Filter */}
          <div className="flex gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold shadow-sm">
            <button
              onClick={() => setFilterUrgency("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterUrgency === "ALL" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
            >
              All ({pendingKots.length})
            </button>
            <button
              onClick={() => setFilterUrgency("URGENT")}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterUrgency === "URGENT" ? "bg-red-600 text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
            >
              Urgent ({pendingKots.filter(k => getTimeElapsed(k.createdAt) > 15).length})
            </button>
          </div>

          {/* Density Switcher */}
          <div className="flex gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold shadow-sm">
            <button
              onClick={() => setGridDensity("normal")}
              className={`px-2.5 py-1 rounded-lg transition-all ${gridDensity === "normal" ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
            >
              Standard
            </button>
            <button
              onClick={() => setGridDensity("compact")}
              className={`px-2.5 py-1 rounded-lg transition-all ${gridDensity === "compact" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              title="Dense Grid View for 40+ KOTs"
            >
              ⚡ Dense
            </button>
          </div>

          {/* Quick Log Wastage Button for Kitchen */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await inventoryService.getInventoryItems();
                setInventoryList(res.data || []);
                setIsWastageDialogOpen(true);
              } catch (e) {
                console.error(e);
              }
            }}
            className="h-8 md:h-9 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 bg-white dark:bg-slate-950 text-xs font-bold rounded-xl shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Log Kitchen Waste
          </Button>
        </div>
      </div>

      <div className={`flex-1 grid gap-4 lg:gap-6 min-h-0 ${
        gridDensity === "compact" ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-[1fr_350px]"
      }`}>
        
        {/* PENDING TICKETS SECTION */}
        <Card className={`h-full flex flex-col border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 shadow-xl overflow-hidden backdrop-blur-xl min-h-0 ${
          gridDensity === "compact" ? "lg:col-span-3" : "lg:col-span-1"
        }`}>
          <CardHeader className="border-b border-slate-200 dark:border-slate-800/80 pb-3.5 bg-slate-50/80 dark:bg-slate-900/60 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2 text-base md:text-lg font-extrabold">
              <ChefHat className="h-5 w-5 text-orange-500" /> Incoming KOT Tickets
            </CardTitle>
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 font-mono text-xs">
              {pendingKots.length} Tickets
            </Badge>
          </CardHeader>

          <ScrollArea className="flex-1 min-h-0 p-4">
            {pendingKots.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-500 py-12 gap-3">
                <CheckCircle2 className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                <p className="font-semibold text-sm text-slate-600 dark:text-slate-400">All clear! No pending orders in kitchen.</p>
              </div>
            ) : (
              <div className={`grid ${
                gridDensity === "compact"
                  ? "grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5"
                  : "grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
              }`}>
                {pendingKots.filter(kot => {
                  const minutesOld = getTimeElapsed(kot.createdAt);
                  if (filterUrgency === "URGENT" && minutesOld <= 15) return false;
                  if (filterUrgency === "COOKING" && !kot.items.some(i => i.itemStatus === "PREPARING")) return false;
                  if (filterUrgency === "PENDING" && !kot.items.some(i => i.itemStatus === "PENDING")) return false;

                  if (selectedStation !== "ALL") {
                    const hasMatchingStation = kot.items.some((i: KotItem) => (i.station || i.menuItemId?.station || "MAIN_KITCHEN") === selectedStation);
                    if (!hasMatchingStation) return false;
                  }

                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchKot = String(kot.kotNumber).includes(q);
                    const matchOrder = String(kot.order._id).toLowerCase().includes(q);
                    const matchTable = kot.order.tableId?.tableNumber?.toLowerCase().includes(q);
                    const matchItem = kot.items.some((i: KotItem) => i.menuItemId?.name?.toLowerCase().includes(q));
                    return matchKot || matchOrder || matchTable || matchItem;
                  }
                  return true;
                }).map(kot => {
                  const minutesOld = getTimeElapsed(kot.createdAt);
                  const isUrgent = minutesOld > 15;
                  const isModerate = minutesOld > 8 && !isUrgent;

                  return (
                    <div
                      key={kot._id}
                      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl ${
                        isUrgent
                          ? 'border-red-400/80 bg-red-50/90 dark:border-red-500/60 dark:bg-red-950/40 ring-1 ring-red-500/30'
                          : isModerate
                          ? 'border-amber-300/80 bg-amber-50/90 dark:border-amber-500/40 dark:bg-amber-950/20'
                          : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div className={`px-4 py-3 flex items-center justify-between border-b ${
                        isUrgent ? 'border-red-200 bg-red-100/80 dark:border-red-900/50 dark:bg-red-900/40' : 'border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">#{kot.kotNumber}</span>
                          <div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">Order #{kot.order._id?.slice(-4)}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2 py-0">
                                {kot.order.orderType === "DINE_IN" ? `Table ${kot.order.tableId?.tableNumber}` : kot.order.orderType}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                          isUrgent ? 'bg-red-500 text-white animate-pulse shadow-md' : isModerate ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <Clock className="h-3.5 w-3.5" /> {minutesOld}m
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="p-4 space-y-3 flex-1">
                        {kot.items.map((item: KotItem) => {
                          if (item.itemStatus === "READY" || item.itemStatus === "SERVED") return null;

                          const isUpdating = !!updating[`${kot.order._id}_${item._id}`];

                          return (
                            <div key={item._id} className="flex items-start justify-between gap-3 text-sm pb-3 border-b border-slate-200/80 dark:border-slate-800/60 last:border-0 last:pb-0">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* {item.menuItemId?.imageUrl && (
                                  <img
                                    src={item.menuItemId.imageUrl}
                                    alt={item.menuItemId?.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-700/80 shrink-0"
                                  />
                                )} */}
                                <span className="font-black text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-900/50 px-2.5 py-1 rounded-lg text-sm shrink-0">
                                  {item.quantity}x
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 dark:text-white leading-snug break-words flex flex-wrap items-center gap-1.5">
                                    <span>{item.menuItemId?.name}</span>
                                    {item.variantName && item.variantName !== "Standard" && (
                                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({item.variantName})</span>
                                    )}
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700/60 font-mono uppercase">
                                      👨‍🍳 {item.station || item.menuItemId?.station || "MAIN_KITCHEN"}
                                    </span>
                                  </div>

                                  {/* Dynamic Modifier / Add-on Badges for Kitchen */}
                                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {item.selectedModifiers.map((m, mIdx) => (
                                        <span
                                          key={mIdx}
                                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60 shadow-xs flex items-center gap-1"
                                        >
                                          ✨ {m.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {item.notes && (
                                    <div className="text-xs text-red-700 dark:text-red-300 font-semibold bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 p-2 rounded-xl mt-1.5 break-words whitespace-normal">
                                      ⚠️ {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Item Action Button */}
                              <div className="shrink-0 pt-0.5">
                                {item.itemStatus === "PENDING" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateItemStatus(kot.order._id, item._id, "PREPARING")}
                                    disabled={isUpdating}
                                    className={`font-extrabold bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-md ${
                                      gridDensity === "compact" ? "h-6 px-2 text-[10px]" : "h-8 px-3 text-xs"
                                    }`}
                                  >
                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cook"}
                                  </Button>
                                )}
                                {item.itemStatus === "PREPARING" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateItemStatus(kot.order._id, item._id, "READY")}
                                    disabled={isUpdating}
                                    className={`font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md ${
                                      gridDensity === "compact" ? "h-6 px-2 text-[10px]" : "h-8 px-3 text-xs"
                                    }`}
                                  >
                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ready"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer Actions */}
                      <div className={`bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 ${
                        gridDensity === "compact" ? "p-1.5" : "p-3"
                      }`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedKot(kot)}
                          className={`font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl ${
                            gridDensity === "compact" ? "h-7 px-2 text-[10px]" : "h-9 px-3 text-xs"
                          }`}
                        >
                          <Eye className={`text-blue-600 dark:text-blue-400 ${gridDensity === "compact" ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1.5"}`} /> Details
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => markAllReady(kot)}
                          className={`font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-md gap-1 ${
                            gridDensity === "compact" ? "h-7 px-2 text-[10px]" : "h-9 px-4 text-xs"
                          }`}
                        >
                          <CheckCircle2 className={gridDensity === "compact" ? "h-3 w-3" : "h-4 w-4"} /> All Ready
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* READY TICKETS SECTION */}
        <Card className="h-full flex flex-col border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 shadow-xl overflow-hidden backdrop-blur-xl min-h-0">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800/80 pb-3.5 bg-slate-50/80 dark:bg-slate-900/60 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-base md:text-lg font-extrabold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Ready for Pickup
            </CardTitle>
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 font-mono text-xs">
              {readyKots.length} Ready
            </Badge>
          </CardHeader>

          <ScrollArea className="flex-1 min-h-0 p-4">
            {readyKots.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12 gap-3">
                <Clock className="h-12 w-12 text-slate-300 dark:text-slate-700 opacity-50" />
                <p className="font-semibold text-sm text-slate-500 dark:text-slate-400">No items waiting for pickup.</p>
              </div>
            ) : (
              <div className={`grid ${
                gridDensity === "compact"
                  ? "grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5"
                  : "grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
              }`}>
                {readyKots.map(kot => (
                  <div
                    key={kot._id}
                    className="rounded-2xl border border-emerald-300/80 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/20 p-4 flex flex-col justify-between min-h-[120px] cursor-pointer hover:border-emerald-500 transition-all shadow-md"
                    onClick={() => setSelectedKot(kot)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-xl text-emerald-700 dark:text-emerald-400">#{kot.kotNumber}</span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">Order #{kot.order._id?.slice(-4)}</span>
                      </div>
                      <Badge variant="outline" className="border-emerald-300 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs font-bold">
                        {kot.order.orderType === "DINE_IN" ? `Table ${kot.order.tableId?.tableNumber}` : kot.order.orderType}
                      </Badge>
                    </div>

                    <div className="text-xs text-emerald-800 dark:text-emerald-200/80 font-medium my-2">
                      All {kot.items.length} item(s) cooked & waiting for pickup
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-200 dark:border-emerald-900/30">
                      <span>{kot.order.waiterId ? `Waiter: ${kot.order.waiterId.contactName}` : 'Counter'}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> View Details</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

      </div>

      {/* 1-CLICK ORDER DETAIL MODAL */}
      <Dialog open={!!selectedKot} onOpenChange={(open) => !open && setSelectedKot(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
          {selectedKot && (
            <>
              <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      KOT #{selectedKot.kotNumber}
                      <Badge variant="outline" className="border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold">
                        Order #{selectedKot.order._id?.slice(-4)}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
                      <span>{selectedKot.order.orderType === "DINE_IN" ? `Table ${selectedKot.order.tableId?.tableNumber}` : selectedKot.order.orderType}</span>
                      {selectedKot.order.waiterId && (
                        <span>• Served by <strong className="text-slate-800 dark:text-slate-200">{selectedKot.order.waiterId.contactName}</strong></span>
                      )}
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{getTimeElapsed(selectedKot.createdAt)}m ago</span>
                  </div>
                </div>
              </DialogHeader>

              {/* Items List */}
              <ScrollArea className="max-h-[60vh] py-4 pr-2">
                <div className="space-y-3">
                  {selectedKot.items.map((item: KotItem) => {
                    const isUpdating = !!updating[`${selectedKot.order._id}_${item._id}`];

                    return (
                      <div key={item._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {item.menuItemId?.imageUrl && (
                            <img
                              src={item.menuItemId.imageUrl}
                              alt={item.menuItemId?.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700/80 shrink-0 shadow-md"
                            />
                          )}
                          <div className="font-black text-2xl text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/50 min-w-[3.5rem] h-12 rounded-xl flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{item.menuItemId?.name}</h4>
                            {item.variantName && item.variantName !== "Standard" && (
                              <Badge variant="outline" className="text-xs text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700">
                                Variant: {item.variantName}
                              </Badge>
                            )}
                            {item.notes && (
                              <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                <span>Instruction: {item.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions per item */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.itemStatus === "PENDING" && (
                            <Button
                              onClick={() => updateItemStatus(selectedKot.order._id, item._id, "PREPARING")}
                              disabled={isUpdating}
                              className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-5 h-11 rounded-xl shadow-lg"
                            >
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Cooking"}
                            </Button>
                          )}
                          {item.itemStatus === "PREPARING" && (
                            <Button
                              onClick={() => updateItemStatus(selectedKot.order._id, item._id, "READY")}
                              disabled={isUpdating}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 h-11 rounded-xl shadow-lg gap-2"
                            >
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Mark Ready</>}
                            </Button>
                          )}
                          {item.itemStatus === "READY" && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-extrabold">
                              ✓ Ready
                            </Badge>
                          )}
                          {item.itemStatus === "SERVED" && (
                            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-extrabold">
                              Served
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedKot(null)}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Close
                </Button>
                {selectedKot.items.some((i: KotItem) => i.itemStatus !== "READY" && i.itemStatus !== "SERVED") && (
                  <Button
                    onClick={() => markAllReady(selectedKot)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-emerald-900/30 gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" /> Mark Entire Ticket Ready
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Chef Quick Raw Item Selector */}
      <Dialog open={isWastageDialogOpen && !selectedWastageItem} onOpenChange={setIsWastageDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Select Wasted Raw Material
            </DialogTitle>
            <DialogDescription>
              Choose the kitchen raw ingredient that was spoiled, burnt, or dropped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <SearchableSelect
              options={inventoryList.map((item) => ({
                value: item._id,
                label: item.name,
                subLabel: `Current Stock: ${item.currentStock} ${item.unit} • ₹${item.costPerUnit}/${item.unit}`,
                badge: `${item.currentStock} ${item.unit}`,
              }))}
              value=""
              onChange={(id) => {
                const found = inventoryList.find(i => i._id === id);
                if (found) {
                  setSelectedWastageItem(found);
                  setIsWastageDialogOpen(false);
                }
              }}
              placeholder="Search & select raw material (e.g. Milk, Paneer)..."
              searchPlaceholder="Type to search kitchen ingredients..."
              className="h-11 text-sm font-medium"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Wastage Modal */}
      <LogWastageDialog
        open={!!selectedWastageItem}
        onOpenChange={(open) => !open && setSelectedWastageItem(null)}
        item={selectedWastageItem}
        restaurantId=""
        onSuccess={() => {
          setSelectedWastageItem(null);
          toast({ title: "Recorded", description: "Kitchen wastage recorded and stock updated." });
        }}
      />
    </div>
  );
}

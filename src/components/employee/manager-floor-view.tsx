"use client";
import React, { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  RefreshCw,
  Unlock,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { employeeService } from "@/services/employee.service";

function FloorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top controls bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter pills */}
          <div className="flex gap-1 p-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>

      {/* Table cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ManagerFloorView() {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [reopening, setReopening] = useState(false);

  const extractArray = (res: any, key?: string) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (key && Array.isArray(res.data?.[key])) return res.data[key];
    if (key && Array.isArray(res[key])) return res[key];
    return [];
  };

  const fetchFloorData = async () => {
    setLoading(true);
    try {
      const [tablesRes, ordersRes, empRes] = await Promise.allSettled([
        employeeService.getTables(),
        employeeService.getOrders({ limit: 100 }),
        employeeService.getEmployees()
      ]);

      if (tablesRes.status === "fulfilled") {
        setTables(extractArray(tablesRes.value, "tables"));
      }
      if (ordersRes.status === "fulfilled") {
        setOrders(extractArray(ordersRes.value, "orders"));
      }
      if (empRes.status === "fulfilled") {
        setEmployees(extractArray(empRes.value, "employees"));
      }
    } catch (err) {
      console.error("Failed to load floor view data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorData();
  }, []);

  // Map active order to each table
  const tableOrderMap: Record<string, any> = {};
  (Array.isArray(orders) ? orders : []).forEach(order => {
    if (order.tableId?._id && (order.status === "OPEN" || order.status === "BILLED")) {
      tableOrderMap[order.tableId._id] = order;
    }
  });

  const getTimeElapsedMinutes = (dateStr: string) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 60000);
  };

  const safeTablesList = Array.isArray(tables) ? tables : [];
  const filteredTables = safeTablesList.filter(t => {
    const activeOrder = tableOrderMap[t._id];
    const status = activeOrder ? activeOrder.status : "AVAILABLE";

    if (statusFilter !== "ALL" && status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTable = t.tableNumber?.toLowerCase().includes(q) || t.section?.toLowerCase().includes(q);
      const matchWaiter = activeOrder?.waiterId?.contactName?.toLowerCase().includes(q);
      return matchTable || matchWaiter;
    }
    return true;
  });

  const handleReopen = async (orderId: string) => {
    setReopening(true);
    try {
      await employeeService.reopenOrder(orderId);
      await fetchFloorData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to re-open order");
    } finally {
      setReopening(false);
    }
  };

  if (loading) return <FloorSkeleton />;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" /> Real-time Floor Operations
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
            Monitor active table occupancy, turnaround times & waiter section assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filters */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-sm">
            {["ALL", "OPEN", "BILLED", "AVAILABLE"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === status
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {status === "ALL" ? `All (${tables.length})` : status === "OPEN" ? "🔴 Open" : status === "BILLED" ? "🟡 Billed" : "🟢 Available"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search table or waiter..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-44 sm:w-56 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFloorData}
            disabled={loading}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 opacity-60" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No tables match your filter criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map(t => {
            const activeOrder = tableOrderMap[t._id];
            const isOpen = activeOrder?.status === "OPEN";
            const isBilled = activeOrder?.status === "BILLED";
            const elapsedMins = activeOrder ? getTimeElapsedMinutes(activeOrder.createdAt) : 0;
            const itemsCount = activeOrder ? (activeOrder.kots || []).reduce((acc: number, k: any) => acc + (k.items?.length || 0), 0) : 0;
            const grandTotal = activeOrder?.financials?.grandTotal || 0;

            return (
              <Card
                key={t._id}
                onClick={() => setSelectedTable({ table: t, order: activeOrder })}
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md border ${
                  isOpen
                    ? "bg-red-50/80 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 hover:border-red-400"
                    : isBilled
                    ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 hover:border-amber-400"
                    : "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400"
                }`}
              >
                <CardContent className="p-4 flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">Table {t.tableNumber}</h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t.section || "Main Dining"} • {t.capacity || 4} Seats</p>
                    </div>

                    <Badge
                      variant="outline"
                      className={`font-bold text-[10px] px-2 py-0.5 ${
                        isOpen
                          ? "bg-red-100 text-red-700 dark:bg-red-950 text-red-400 border-red-300"
                          : isBilled
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 text-amber-400 border-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-emerald-400 border-emerald-300"
                      }`}
                    >
                      {isOpen ? "🔴 Open" : isBilled ? "🟡 Billed" : "🟢 Available"}
                    </Badge>
                  </div>

                  {activeOrder ? (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Order:</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{grandTotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Time / Items:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{elapsedMins}m • {itemsCount} items</span>
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800 truncate">
                        👤 {activeOrder.waiterId?.contactName || "Counter Waiter"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium py-2 text-center border-t border-slate-200 dark:border-slate-800/60">
                      Clean & ready for new guests
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table Detail Drawer Modal */}
      <Dialog open={!!selectedTable} onOpenChange={open => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl">
          {selectedTable && (
            <>
              <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                      Table {selectedTable.table.tableNumber} Operations
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      {selectedTable.table.section || "Main Dining Area"} • Capacity: {selectedTable.table.capacity || 4} Seats
                    </DialogDescription>
                  </div>
                  {selectedTable.order && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-3 py-1 ${
                        selectedTable.order.status === "OPEN"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {selectedTable.order.status === "OPEN" ? "🔴 Live Order Open" : "🟡 Bill Generated"}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              {selectedTable.order ? (
                <div className="space-y-4 py-3">
                  {/* Order Meta Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Waiter:</span>
                      <strong className="text-slate-900 dark:text-white truncate block">{selectedTable.order.waiterId?.contactName || "Counter"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Duration:</span>
                      <strong className="text-slate-900 dark:text-white block font-mono">{getTimeElapsedMinutes(selectedTable.order.createdAt)} mins</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Grand Total:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 block font-mono">₹{selectedTable.order.financials?.grandTotal || 0}</strong>
                    </div>
                  </div>

                  {/* KOT Items List */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Ordered Dishes & Items</h4>
                    <ScrollArea className="max-h-56 pr-2">
                      <div className="space-y-2">
                        {(selectedTable.order.kots || []).flatMap((kot: any) => kot.items || []).map((item: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              {item.menuItemId?.imageUrl && (
                                <img src={item.menuItemId.imageUrl} alt={item.menuItemId?.name} className="w-10 h-10 rounded-lg object-cover border" />
                              )}
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{item.quantity}x {item.menuItemId?.name || "Item"}</div>
                                <div className="text-[11px] text-slate-500">{item.variantName} • 👨‍🍳 {item.station}</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(item.variantPrice || 0) * (item.quantity || 1)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Actions */}
                  {selectedTable.order.status === "BILLED" && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <Button
                        onClick={() => handleReopen(selectedTable.order._id)}
                        disabled={reopening}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl gap-2 text-xs"
                      >
                        <Unlock className="h-4 w-4" /> Re-Open Order for Edits
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  This table is currently vacant and clean for new guests.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

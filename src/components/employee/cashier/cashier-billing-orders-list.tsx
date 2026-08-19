"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Receipt, Search } from "lucide-react";
import { Order, calculateOrderFinancials } from "./types";

interface CashierBillingOrdersListProps {
  orders: Order[];
  filteredOrders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pendingCount: number;
}

export function CashierBillingOrdersList({
  filteredOrders,
  selectedOrder,
  setSelectedOrder,
  searchQuery,
  setSearchQuery,
  pendingCount,
}: CashierBillingOrdersListProps) {
  return (
    <div className="w-[260px] lg:w-[500px] shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
        <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
          <Receipt className="h-4 w-4 text-emerald-500" />
          Pending Bills
          {pendingCount > 0 && (
            <span className="ml-auto bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="cashier-search-input"
            placeholder="Search order #, table, customer... (F2)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10 h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 pointer-events-none">
            F2
          </kbd>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 grid grid-cols-4 gap-2 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="col-span-4 text-center text-slate-400 dark:text-slate-600 py-10 text-sm">
              No pending orders.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?._id === order._id;
              const grandTotal = calculateOrderFinancials(order).grandTotal;
              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-2 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/30 shadow-md"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      #{order._id?.slice(-4)}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        order.status === "BILLED"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {order.orderType === "DINE_IN"
                      ? (order.tableIds && Array.isArray(order.tableIds) && order.tableIds.length > 1
                          ? `Table ${order.tableId?.tableNumber} (+${order.tableIds.length - 1} merged)`
                          : `Table ${order.tableId?.tableNumber || "?"}`)
                      : order.orderType}
                  </div>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    ₹{grandTotal.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* ── Bottom Pending Summary Strip ── */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-xs font-bold shrink-0">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-emerald-500" />
          Pending to Collect ({filteredOrders.length})
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
          ₹
          {filteredOrders
            .reduce((sum, ord) => sum + calculateOrderFinancials(ord).grandTotal, 0)
            .toFixed(0)}
        </span>
      </div>
    </div>
  );
}

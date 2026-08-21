"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Receipt, Search, Printer, Loader2, CheckCircle2 } from "lucide-react";
import { Order, calculateOrderFinancials } from "./types";

interface CashierBillingOrdersListProps {
  orders: Order[];
  filteredOrders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pendingCount: number;
  // Paid orders toggle
  showPaidOrders: boolean;
  onTogglePaidOrders: () => void;
  paidOrders: Order[];
  isFetchingPaid: boolean;
  onViewReceipt: (order: Order) => void;
}

export function CashierBillingOrdersList({
  filteredOrders,
  selectedOrder,
  setSelectedOrder,
  searchQuery,
  setSearchQuery,
  pendingCount,
  showPaidOrders,
  onTogglePaidOrders,
  paidOrders,
  isFetchingPaid,
  onViewReceipt,
}: CashierBillingOrdersListProps) {
  // Also filter paid orders by the same search query
  const filteredPaid = searchQuery.trim()
    ? paidOrders.filter((o) => {
      const q = searchQuery.toLowerCase();
      return (
        o._id?.toLowerCase().includes(q) ||
        String(o.tableId?.tableNumber || "").includes(q) ||
        o.customerDetails?.name?.toLowerCase().includes(q) ||
        o.customerDetails?.phone?.includes(q)
      );
    })
    : paidOrders;

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

        {/* Paid Today Toggle */}
        <button
          onClick={onTogglePaidOrders}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${showPaidOrders
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className={`h-3.5 w-3.5 ${showPaidOrders ? "text-emerald-500" : "text-slate-400"}`} />
            Show Paid Today
          </span>
          {showPaidOrders && isFetchingPaid ? (
            <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
          ) : showPaidOrders ? (
            <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
              {paidOrders.length}
            </span>
          ) : null}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Active Orders (OPEN + BILLED) */}
          {filteredOrders.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-600 py-8 text-sm">
              No pending orders.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?._id === order._id;
              const grandTotal = calculateOrderFinancials(order).grandTotal;
              return (
                // <div
                //   key={order._id}
                //   onClick={() => setSelectedOrder(order)}
                //   className={`p-2 rounded-xl cursor-pointer border transition-all ${
                //     isSelected
                //       ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/30 shadow-md"
                //       : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                //   }`}
                // >
                //   <div className="flex justify-between items-center mb-2">
                //     <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                //       #{order._id?.slice(-4)}
                //     </span>
                //     <span
                //       className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                //         order.status === "BILLED"
                //           ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                //           : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                //       }`}
                //     >
                //       {order.status}
                //     </span>
                //   </div>
                //   <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                //     {order.orderType === "DINE_IN"
                //       ? (order.tableIds && Array.isArray(order.tableIds) && order.tableIds.length > 1
                //           ? `Table ${order.tableId?.tableNumber} (+${order.tableIds.length - 1} merged)`
                //           : `Table ${order.tableId?.tableNumber || "?"}`)
                //       : order.orderType}
                //   </div>
                //   <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                //     ₹{grandTotal.toFixed(2)}
                //   </div>
                // </div>

                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`group relative p-3 rounded-2xl cursor-pointer border transition-all duration-200 overflow-hidden ${isSelected
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10 scale-[1.02]"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                >
                  {/* Accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${order.status === "BILLED"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                      }`}
                  />

                  <div className="pl-2">
                    {/* Header row */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                        <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                          #{order._id?.slice(-4)}
                        </span>
                      </div>

                      <span
                        className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${order.status === "BILLED"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${order.status === "BILLED"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-amber-500 animate-pulse"
                            }`}
                        />
                        {order.status}
                      </span>
                    </div>

                    {/* Order type / table info */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-2">
                      <svg
                        className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        {order.orderType === "DINE_IN" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6M2 7h20l-2 5H4L2 7zM12 2v5" />
                        )}
                      </svg>
                      <span className="truncate">
                        {order.orderType === "DINE_IN"
                          ? order.tableIds && Array.isArray(order.tableIds) && order.tableIds.length > 1
                            ? `Table ${order.tableId?.tableNumber} +${order.tableIds.length - 1} merged`
                            : `Table ${order.tableId?.tableNumber || "?"}`
                          : order.orderType}
                      </span>
                    </div>

                    {/* Footer: total + arrow */}
                    <div className="flex items-end justify-between">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs font-bold text-blue-500/70 dark:text-blue-400/70">₹</span>
                        <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                          {grandTotal.toFixed(2)}
                        </span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-300 dark:text-slate-700 transition-all ${isSelected ? "text-blue-500 dark:text-blue-400 translate-x-0.5" : "group-hover:translate-x-0.5 group-hover:text-blue-400"
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Paid Today Section */}
          {showPaidOrders && (
            <>
              <div className="flex items-center gap-2 pt-3 pb-1">
                <div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-900/40" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Paid Today
                </span>
                <div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-900/40" />
              </div>

              {isFetchingPaid ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                </div>
              ) : filteredPaid.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-600 py-6 text-xs">
                  No paid orders today.
                </div>
              ) : (
                filteredPaid.map((order) => {
                  const grandTotal = calculateOrderFinancials(order).grandTotal;
                  return (
                    <div
                      key={order._id}
                      className="p-2 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                          #{order._id?.slice(-4)}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
                          ✓ PAID
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {order.orderType === "DINE_IN"
                          ? `Table ${order.tableId?.tableNumber || "?"}`
                          : order.orderType}
                        {order.customerDetails?.name &&
                          order.customerDetails.name !== "Walk-in Guest" &&
                          order.customerDetails.name !== "Walk-in Customer" && (
                            <span className="ml-1 text-slate-400">· {order.customerDetails.name}</span>
                          )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] font-bold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt(order);
                          }}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Pending Summary Strip */}
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

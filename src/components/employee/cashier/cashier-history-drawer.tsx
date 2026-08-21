"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Search,
  Printer,
  Loader2,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  Split,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { employeeService } from "@/services/employee.service";
import { Order, calculateOrderFinancials } from "./types";

interface CashierHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (order: Order) => void;
}

type DateFilter = "today" | "yesterday" | "custom";

function getISTDateString(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
}

function paymentIcon(method: string) {
  const m = (method || "").toUpperCase();
  if (m === "CASH") return <Banknote className="h-3 w-3" />;
  if (m === "UPI") return <Smartphone className="h-3 w-3" />;
  if (m === "CARD") return <CreditCard className="h-3 w-3" />;
  if (m === "SPLIT") return <Split className="h-3 w-3" />;
  return <CheckCircle2 className="h-3 w-3" />;
}

export function CashierHistoryDrawer({
  isOpen,
  onClose,
  onViewReceipt,
}: CashierHistoryDrawerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState(getISTDateString());

  const fetchOrders = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const res = await employeeService.getOrders({
        status: "PAID",
        startDate: date,
        endDate: date,
        limit: 200,
      });
      const getList = (r: any): Order[] =>
        Array.isArray(r) ? r
        : Array.isArray(r?.data) ? r.data
        : Array.isArray(r?.data?.orders) ? r.data.orders
        : Array.isArray(r?.orders) ? r.orders
        : [];
      setOrders(getList(res));
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when drawer opens or date filter changes
  useEffect(() => {
    if (!isOpen) return;
    const date =
      dateFilter === "today"
        ? getISTDateString(0)
        : dateFilter === "yesterday"
        ? getISTDateString(-1)
        : customDate;
    fetchOrders(date);
  }, [isOpen, dateFilter, customDate, fetchOrders]);

  // Filtered orders by search
  const filtered = searchQuery.trim()
    ? orders.filter((o) => {
        const q = searchQuery.toLowerCase();
        return (
          o._id?.toLowerCase().includes(q) ||
          String(o.tableId?.tableNumber || "").includes(q) ||
          o.customerDetails?.name?.toLowerCase().includes(q) ||
          o.customerDetails?.phone?.includes(q)
        );
      })
    : orders;

  const totalCollected = filtered.reduce(
    (sum, o) => sum + calculateOrderFinancials(o).grandTotal,
    0
  );

  const dateLabel =
    dateFilter === "today"
      ? "Today"
      : dateFilter === "yesterday"
      ? "Yesterday"
      : customDate;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] p-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
            <History className="h-5 w-5 text-blue-600" />
            Order History
          </SheetTitle>
        </SheetHeader>

        {/* ── Date Filter ── */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
          <div className="flex gap-2">
            {(["today", "yesterday"] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold capitalize transition-all ${
                  dateFilter === f
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => setDateFilter("custom")}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                dateFilter === "custom"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Custom
            </button>
          </div>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg"
                onClick={() => {
                  const d = new Date(customDate);
                  d.setDate(d.getDate() - 1);
                  setCustomDate(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                max={getISTDateString(0)}
                className="h-8 text-xs flex-1 rounded-lg"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg"
                onClick={() => {
                  const d = new Date(customDate);
                  d.setDate(d.getDate() + 1);
                  const next = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
                  if (next <= getISTDateString(0)) setCustomDate(next);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search order #, table, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* ── Orders List ── */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 gap-3">
                <History className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No paid orders for {dateLabel}</p>
              </div>
            ) : (
              filtered.map((order) => {
                const grandTotal = calculateOrderFinancials(order).grandTotal;
                const payMethod =
                  order.financials?.payments?.[0]?.method ||
                  (order as any)?.paymentMethod ||
                  "";
                const customerName = order.customerDetails?.name;
                const hasCustomer =
                  customerName &&
                  customerName !== "Walk-in Guest" &&
                  customerName !== "Walk-in Customer";
                const dueAmount = Number(order.financials?.dueAmount || 0);
                const isDue = dueAmount > 0;

                return (
                  <div
                    key={order._id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 space-y-2"
                  >
                    {/* Row 1: Order ID + Status badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        #{order._id?.slice(-6)}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isDue
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {isDue ? "CREDIT/PARTIAL" : "✓ PAID"}
                      </span>
                    </div>

                    {/* Row 2: Table + Customer */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>
                        {order.orderType === "DINE_IN"
                          ? `Table ${order.tableId?.tableNumber || "?"}`
                          : order.orderType}
                      </span>
                      {hasCustomer && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="truncate max-w-[120px]">{customerName}</span>
                        </>
                      )}
                      <span className="ml-auto text-[10px] text-slate-400">
                        {new Date(order.createdAt || "").toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>

                    {/* Row 3: Amount + Payment method + Receipt */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          ₹{grandTotal.toFixed(0)}
                        </span>
                        {payMethod && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-lg">
                            {paymentIcon(payMethod)}
                            {payMethod}
                          </span>
                        )}
                        {isDue && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Due ₹{dueAmount.toFixed(0)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px] font-bold border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        onClick={() => onViewReceipt(order)}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* ── Footer Summary ── */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                {filtered.length} order{filtered.length !== 1 ? "s" : ""} · {dateLabel}
              </span>
              <span className="font-black text-emerald-700 dark:text-emerald-400 text-base">
                ₹{totalCollected.toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

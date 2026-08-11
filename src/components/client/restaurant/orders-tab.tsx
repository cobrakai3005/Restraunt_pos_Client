"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ReceiptText, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700 border-amber-200",
  BILLED: "bg-blue-100 text-blue-700 border-blue-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

const PAGE_SIZE = 10;
const REFRESH_MS = 15000;

const countOrderItems = (order: any): number =>
  (order.kots || []).reduce(
    (sum: number, kot: any) => sum + kot.items.reduce((si: number, it: any) => si + (it.quantity || 0), 0),
    0
  );

const formatTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function OrdersTab({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [view, setView] = useState<"table" | "cards">("table");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(
    async (status = statusFilter, currentPage = page, silent = false) => {
      if (!restaurantId) return;
      if (!silent) setIsLoading(true);
      try {
        const res = await restaurantService.getOrders(restaurantId, {
          page: currentPage,
          limit: PAGE_SIZE,
          status: status !== "ALL" ? status : undefined,
        });
        if (res.success) {
          setOrders(res.data || []);
          const meta = res.meta;
          setTotalRecords(meta?.totalRecords ?? res.data?.length ?? 0);
          setTotalPages(meta?.totalPages ?? 1);
        }
      } catch (err) {
        if (!silent) {
          toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [restaurantId, statusFilter, page, toast]
  );

  useEffect(() => {
    if (restaurantId) fetchOrders(statusFilter, page);
  }, [restaurantId, statusFilter, page, fetchOrders]);

  // Live polling while the tab is mounted
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(statusFilter, page, true), REFRESH_MS);
    return () => clearInterval(interval);
  }, [statusFilter, page, fetchOrders]);

  const totalAmount = orders.reduce((sum, o) => sum + (o.financials?.grandTotal || 0), 0);
  const totalItems = orders.reduce((sum, o) => sum + countOrderItems(o), 0);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 px-3 py-1 text-sm">
            {totalRecords} orders
          </Badge>
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 px-3 py-1 text-sm">
            {totalItems} items
          </Badge>
          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 px-3 py-1 text-sm">
            ₹{totalAmount.toFixed(2)} total
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="BILLED">Billed</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className="h-7 px-2"
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("cards")}
              className="h-7 px-2"
              title="Card/Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchOrders(statusFilter, page)} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card text-card-foreground">
          <span className="text-sm text-slate-500">Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-card-foreground">
          <ReceiptText className="h-8 w-8 text-slate-300" />
          <span className="text-sm text-slate-500">No orders found.</span>
        </div>
      ) : view === "table" ? (
        <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card text-card-foreground p-2 shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold tracking-wider text-slate-500">
                <th className="py-4 pl-6 pr-4">ORDER</th>
                <th className="py-4 px-4">TYPE</th>
                <th className="py-4 px-4">TABLE</th>
                <th className="py-4 px-4">WAITER</th>
                <th className="py-4 px-4">ITEMS</th>
                <th className="py-4 px-4">AMOUNT</th>
                <th className="py-4 pr-6 pl-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => (
                <tr key={order._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">#{String(order._id).slice(-6).toUpperCase()}</span>
                      <span className="text-xs text-slate-500">{formatTime(order.createdAt)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-700">{order.orderType}</span>
                  </td>
                  <td className="py-4 px-4">
                    {order.tableId?.tableNumber ? (
                      <span className="text-sm font-medium text-slate-700">Table {order.tableId.tableNumber}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600">{order.waiterId?.contactName || "—"}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-700">{countOrderItems(order)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-foreground">
                      ₹{(order.financials?.grandTotal || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 pr-6 pl-4 text-right">
                    <Badge variant="outline" className={STATUS_STYLES[order.status] || ""}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">#{String(order._id).slice(-6).toUpperCase()}</span>
                  <span className="text-xs text-slate-500">{formatTime(order.createdAt)}</span>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[order.status] || ""}>
                  {order.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Order Type</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{order.orderType}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-slate-500">Table</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Waiter</span>
                  <span className="text-sm font-medium text-slate-700">{order.waiterId?.contactName || "—"}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-slate-500">Items</span>
                  <span className="text-sm font-medium text-slate-700">{countOrderItems(order)}</span>
                </div>
              </div>

              <div className="mt-auto border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-lg font-bold text-foreground">₹{(order.financials?.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

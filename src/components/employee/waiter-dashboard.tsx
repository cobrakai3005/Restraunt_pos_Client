"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { OrderTakingPanel } from "./order-taking-panel";

interface DashboardProps {
  user: User;
}

interface ReadyItem {
  itemId: string;
  orderId: string;
  itemName: string;
  quantity: number;
  tableLabel: string;
}

export function WaiterDashboard({ user }: DashboardProps) {
  const { toast } = useToast();
  const [readyItems, setReadyItems] = useState<ReadyItem[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  // ── Fetch only the READY items for the pickup strip ──
  const fetchReadyItems = useCallback(async () => {
    try {
      const [resOpen, resBilled] = await Promise.all([
        employeeService.getOrders({ status: "OPEN" }),
        employeeService.getOrders({ status: "BILLED" }),
      ]);
      const orders = [...(resOpen.data || []), ...(resBilled.data || [])];

      const items: ReadyItem[] = [];
      orders.forEach((order: any) => {
        const tableLabel =
          order.orderType === "DINE_IN"
            ? `Table ${typeof order.tableId === "object" ? order.tableId?.tableNumber : (order as any).tableNumber || ""}`
            : order.orderType;

        order.kots?.forEach((kot: any) => {
          kot.items?.forEach((item: any) => {
            if (item.itemStatus === "READY") {
              items.push({
                itemId: item._id,
                orderId: order._id,
                itemName: item.menuItemId?.name || "Item",
                quantity: item.quantity || 1,
                tableLabel,
              });
            }
          });
        });
      });

      setReadyItems(items);
    } catch (err) {
      console.error("Failed to fetch ready items", err);
    }
  }, []);

  useEffect(() => {
    fetchReadyItems();

    const socket = connectSocket();
    if (socket) {
      socket.on("item_status_update", fetchReadyItems);
      socket.on("new_kot", fetchReadyItems);
      socket.on("table_status_change", fetchReadyItems);
      socket.on("order_billed", fetchReadyItems);
    }

    return () => {
      if (socket) {
        socket.off("item_status_update", fetchReadyItems);
        socket.off("new_kot", fetchReadyItems);
        socket.off("table_status_change", fetchReadyItems);
        socket.off("order_billed", fetchReadyItems);
      }
      disconnectSocket();
    };
  }, [fetchReadyItems]);

  const markItemServed = async (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setUpdating(prev => ({ ...prev, [key]: true }));
    try {
      await employeeService.updateKotItemStatus(orderId, itemId, "SERVED");
      fetchReadyItems();
      toast({ title: "✅ Marked as served!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setUpdating(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] -mx-8 -my-8 overflow-hidden">

      {/* ── Ready for Pickup Strip (waiter-exclusive) ── */}
      {readyItems.length > 0 && (
        <div className="shrink-0 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 px-4 py-2.5 flex items-center gap-3 flex-wrap backdrop-blur-md z-10">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Ready for Pickup ({readyItems.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {readyItems.map(ri => {
              const key = `${ri.orderId}_${ri.itemId}`;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/50 shadow-sm"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {ri.quantity}× {ri.itemName}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {ri.tableLabel}
                  </span>
                  <button
                    onClick={() => markItemServed(ri.orderId, ri.itemId)}
                    disabled={!!updating[key]}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-extrabold uppercase tracking-wide transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                  >
                    {updating[key] ? <Loader2 className="h-3 w-3 animate-spin" /> : "PICK UP"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Order Taking Panel (shared component) ── */}
      <div className="flex-1 overflow-hidden">
        <OrderTakingPanel onOrderFired={fetchReadyItems} />
      </div>

    </div>
  );
}

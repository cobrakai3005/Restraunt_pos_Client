"use client";

import { useCallback, useState } from "react";
import { Order, Table } from "./types";

type Toast = (options: any) => void;

export function useOrderTable(toast: Toast, tables: Table[], activeOrders: Order[]) {
  const [selectedTable, setSelectedTable] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");

  const selectTable = useCallback((tableId: string, onCustomerChange: (name: string, phone: string) => void) => {
    const table = tables.find((item) => item._id === tableId);
    const merged = table?.status === "MERGED" || Boolean(table?.mergedIntoTableId);
    const parentTableId = merged
      ? typeof table?.mergedIntoTableId === "object" ? table.mergedIntoTableId?._id : table?.mergedIntoTableId
      : null;
    const parentTable = parentTableId ? tables.find((item) => String(item._id) === String(parentTableId)) : null;

    if (merged && parentTableId) {
      setSelectedTable(String(parentTableId));
      setOrderType("DINE_IN");
      toast({ title: `🔗 Table ${table?.tableNumber} is Merged`, description: `Switched to Primary Table ${parentTable?.tableNumber || ""}.` });
      return;
    }

    setSelectedTable(tableId);
    setOrderType("DINE_IN");
    const order = activeOrders.find((item) => {
      const orderTableId = typeof item.tableId === "object" ? (item.tableId as any)?._id : item.tableId;
      return String(orderTableId) === String(tableId) && item.status === "OPEN";
    });
    if (order) {
      if (order.guestCount) setGuestCount(order.guestCount);
      onCustomerChange(order.customerDetails?.name || "", order.customerDetails?.phone || "");
    } else {
      setGuestCount(table?.capacity || 2);
      onCustomerChange("", "");
    }
  }, [activeOrders, tables, toast]);

  const resetTableContext = () => {
    setSelectedTable("");
    setGuestCount(2);
    setOrderType("DINE_IN");
  };

  const clearSelectedTable = () => setSelectedTable("");

  return { selectedTable, guestCount, setGuestCount, orderType, setOrderType, selectTable, resetTableContext, clearSelectedTable };
}

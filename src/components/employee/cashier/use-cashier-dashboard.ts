"use client";

import { useCashierOrders } from "./use-cashier-orders";
import { useCashierCredit } from "./use-cashier-credit";
import { useRef } from "react";

export function useCashierDashboard() {
  const creditRef = useRef<any>(null);

  // Orders hook owns selectedOrder state
  const ordersHook = useCashierOrders(() => ({
    matchedCustomer: creditRef.current?.matchedCustomer || null,
    custPhone: creditRef.current?.custPhone || "",
    custName: creditRef.current?.custName || "",
    isCustomerLinked: creditRef.current?.isCustomerLinked || (() => false),
    setBillingTab: creditRef.current?.setBillingTab || (() => {}),
  }));

  // Credit hook syncs with ordersHook.selectedOrder directly
  const credit = useCashierCredit(
    ordersHook.selectedOrder,
    ordersHook.setSelectedOrder,
    async () => {
      await ordersHook.fetchOrders();
    },
    (order: any) => {
      ordersHook.setCompletedReceiptOrder(order);
      ordersHook.setShowReceipt(true);
    }
  );

  creditRef.current = credit;

  return {
    ...ordersHook,
    ...credit,
    selectedOrder: ordersHook.selectedOrder,
    setSelectedOrder: ordersHook.setSelectedOrder,
  };
}

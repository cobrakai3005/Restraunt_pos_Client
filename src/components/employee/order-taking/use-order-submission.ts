"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { employeeService } from "@/services/employee.service";
import { cashierKeys } from "@/hooks/queries/cashier-keys";
import { CartItem, Order, Table } from "./types";
import {
  customerDetailsPayload,
  findOpenOrderForTable,
  kotPayloadFromCart,
  orderIdFromResponse,
} from "./order-submission-utils";

type QueryClient = {
  invalidateQueries: (filters: { queryKey: readonly unknown[] }) => Promise<unknown>;
};

type OrderMutations = {
  createOrder: { mutateAsync: (data: any) => Promise<any> };
  updateCustomer: { mutateAsync: (data: { orderId: string; data: any }) => Promise<any> };
  addKot: { mutateAsync: (data: { orderId: string; data: any }) => Promise<any> };
};

interface UseOrderSubmissionArgs {
  cart: CartItem[];
  selectedTable: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  guestCount: number;
  customerName: string;
  customerPhone: string;
  matchedCustomer: any;
  activeOrders: Order[];
  tables: Table[];
  mutations: OrderMutations;
  queryClient: QueryClient;
  clearCart: () => void;
  onOrderFired?: () => void;
  onReceiptReady: (order: any) => void;
}

export function useOrderSubmission({
  cart,
  selectedTable,
  orderType,
  guestCount,
  customerName,
  customerPhone,
  matchedCustomer,
  activeOrders,
  tables,
  mutations,
  queryClient,
  clearCart,
  onOrderFired,
  onReceiptReady,
}: UseOrderSubmissionArgs) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickReceiptSubmitting, setIsQuickReceiptSubmitting] = useState(false);

  const initializeOrderAndFireKot = async () => {
    const existingOrder = findOpenOrderForTable(activeOrders, selectedTable);
    const customerDetails = customerDetailsPayload(customerName, customerPhone, matchedCustomer);
    let orderId: string | null = null;

    if (existingOrder) {
      orderId = existingOrder._id;
      if (customerDetails) await mutations.updateCustomer.mutateAsync({ orderId, data: customerDetails });
    } else {
      const payload: any = { orderType, guestCount: Math.max(1, guestCount) };
      if (orderType === "DINE_IN") payload.tableId = selectedTable;
      if (customerDetails) payload.customerDetails = customerDetails;
      orderId = orderIdFromResponse(await mutations.createOrder.mutateAsync(payload));
    }

    if (!orderId) throw new Error("Could not initialize order.");
    const kotResponse = await mutations.addKot.mutateAsync({ orderId, data: kotPayloadFromCart(cart) });
    return { orderId, kotResponse };
  };

  const placeOrder = async (): Promise<any> => {
    if (cart.length === 0) return null;
    if (orderType === "DINE_IN" && !selectedTable) {
      toast({ variant: "destructive", title: "Table Required", description: "Please select a table from the floor layout." });
      return null;
    }

    setIsSubmitting(true);
    try {
      const { kotResponse } = await initializeOrderAndFireKot();
      const tableNumber = tables.find((table) => table._id === selectedTable)?.tableNumber || selectedTable;
      toast({
        title: "Order Fired!",
        description: `Successfully fired to kitchen stations${orderType === "DINE_IN" ? ` for Table ${tableNumber}` : ""}.`,
        className: "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100",
      });
      clearCart();
      onOrderFired?.();
      return kotResponse?.data || kotResponse;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Order Failed", description: error.response?.data?.message || error.message || "Failed to fire order." });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReceipt = async () => {
    if (cart.length === 0) return;
    setIsQuickReceiptSubmitting(true);
    try {
      if (orderType === "DINE_IN" && !selectedTable) {
        toast({ variant: "destructive", title: "Table Required", description: "Please select a table before using Quick Receipt." });
        return;
      }

      const { orderId } = await initializeOrderAndFireKot();
      const billedOrder = await employeeService.generateBill(orderId);
      const grandTotal = billedOrder?.financials?.grandTotal ?? billedOrder?.data?.financials?.grandTotal ?? 0;
      const checkoutResult = await employeeService.checkoutOrder(orderId, { payments: [{ method: "CASH", amount: grandTotal }] });
      const paidOrder = checkoutResult?.order ?? checkoutResult?.data?.order ?? billedOrder;

      clearCart();
      await queryClient.invalidateQueries({ queryKey: cashierKeys.root() });
      onOrderFired?.();
      toast({
        title: "Quick Receipt",
        description: `₹${grandTotal.toFixed(0)} collected. Order marked PAID.`,
        className: "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100",
      });
      onReceiptReady(paidOrder);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Quick Receipt Failed", description: error?.response?.data?.message || error.message || "Something went wrong." });
    } finally {
      setIsQuickReceiptSubmitting(false);
    }
  };

  return { isSubmitting, isQuickReceiptSubmitting, placeOrder, handleQuickReceipt };
}

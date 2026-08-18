"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { employeeService } from "@/services/employee.service";
import { connectSocket } from "@/lib/socket";
import { Order, KotItem, Mode, calculateOrderFinancials } from "./types";
import { Customer } from "@/services/customer.service";

export interface CustomerContextData {
  matchedCustomer: Customer | null;
  custPhone: string;
  custName: string;
  isCustomerLinked: (ord: Order | null) => boolean;
  setBillingTab: (tab: "bill" | "customer" | "discount") => void;
}

export function useCashierOrders(getCustomerContext?: () => CustomerContextData) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<Order | null>(null);
  const [completedReceiptOrder, setCompletedReceiptOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [mode, setMode] = useState<Mode>("orders");

  // Multi-Payment state
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitCash, setSplitCash] = useState<string>("0");
  const [splitUpi, setSplitUpi] = useState<string>("0");
  const [splitCard, setSplitCard] = useState<string>("0");
  const [splitCredit, setSplitCredit] = useState<string>("0");

  // Complimentary state
  const [complimentaryItem, setComplimentaryItem] = useState<KotItem | null>(null);
  const [showComplimentaryDialog, setShowComplimentaryDialog] = useState(false);

  const { toast } = useToast();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedOnce = useRef(false);

  const getOrderGrandTotal = (order: Order | null) => {
    return calculateOrderFinancials(order).grandTotal;
  };

  const fetchOrders = async () => {
    try {
      if (!hasLoadedOnce.current) {
        setIsLoading(true);
      }
      const [resActive, resBilled] = await Promise.all([
        employeeService.getOrders({ status: "OPEN" }),
        employeeService.getOrders({ status: "BILLED" }),
      ]);

      const getList = (res: any) =>
        Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.orders)
          ? res.data.orders
          : Array.isArray(res?.orders)
          ? res.orders
          : [];

      const activeList = getList(resActive);
      const billedList = getList(resBilled);
      const allActiveOrders: Order[] = [...activeList, ...billedList].filter(
        (o) => o.status !== "PAID" && o.status !== "CANCELLED"
      );

      setOrders(allActiveOrders);

      setSelectedOrder((prev) => {
        if (!prev) return null;
        const updated = allActiveOrders.find((o) => o._id === prev._id);
        return updated || null;
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to fetch orders", description: error.message });
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
    }
  };

  const debouncedFetchOrders = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchOrders();
    }, 250);
  }, []);

  // Real-time sockets with debounced updates
  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    if (socket) {
      socket.on("table_status_change", debouncedFetchOrders);
      socket.on("order_billed", debouncedFetchOrders);
      socket.on("order_settled", debouncedFetchOrders);
      socket.on("item_status_update", debouncedFetchOrders);
      socket.on("item_complimentary_updated", debouncedFetchOrders);
      socket.on("order_due_updated", debouncedFetchOrders);
    }

    return () => {
      if (socket) {
        socket.off("table_status_change", debouncedFetchOrders);
        socket.off("order_billed", debouncedFetchOrders);
        socket.off("order_settled", debouncedFetchOrders);
        socket.off("item_status_update", debouncedFetchOrders);
        socket.off("item_complimentary_updated", debouncedFetchOrders);
        socket.off("order_due_updated", debouncedFetchOrders);
      }
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [debouncedFetchOrders]);

  // Global Keydown Listeners for Pos Terminal Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        const searchInput = document.getElementById("cashier-search-input") as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        setPaymentMethod("CASH");
      } else if (e.key === "F9") {
        e.preventDefault();
        setPaymentMethod("UPI");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleGenerateBill = async (orderId: string) => {
    try {
      setIsProcessing(true);
      const res = await employeeService.generateBill(orderId);
      toast({
        title: "Bill Generated 🧾",
        description: `Order #${selectedOrder?._id?.slice(-4)} is now locked for payment.`,
      });
      const targetOrder = res?.data || selectedOrder;
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        setCompletedReceiptOrder(targetOrder);
        setShowReceipt(true);
      }
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Billing Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async (orderId: string) => {
    try {
      if (!selectedOrder) return;

      const ctx = getCustomerContext ? getCustomerContext() : null;
      const grandTotal = getOrderGrandTotal(selectedOrder);
      const isZeroComplimentary = grandTotal === 0;
      const effectiveMethod = isZeroComplimentary ? "COMPLIMENTARY" : paymentMethod;

      if (effectiveMethod === "CREDIT" && ctx && !ctx.isCustomerLinked(selectedOrder)) {
        toast({
          variant: "destructive",
          title: "Customer Required ⚠️",
          description:
            "A registered customer or customer phone number is required to settle this order on Credit / Khata.",
        });
        ctx.setBillingTab("customer");
        return;
      }

      setIsProcessing(true);
      const matchedCustomer = ctx?.matchedCustomer;
      const custPhone = ctx?.custPhone || "";
      const custName = ctx?.custName || "";

      const customerDetailsPayload =
        matchedCustomer || custPhone || custName
          ? {
              name: custName.trim() || undefined,
              phone: custPhone.trim() || undefined,
              customerId:
                matchedCustomer?._id || selectedOrder.customerDetails?.customerId || undefined,
            }
          : undefined;

      const result = await employeeService.checkoutOrder(orderId, {
        payments: [{ method: effectiveMethod, amount: grandTotal }],
        customerDetails: customerDetailsPayload,
      });
      toast({
        title: isZeroComplimentary
          ? "Order Settled as Complimentary 🎁"
          : effectiveMethod === "CREDIT"
          ? "Order Settled on Credit 📋"
          : "Payment Successful 🎉",
        description: isZeroComplimentary
          ? "₹0.00 order closed and table released."
          : effectiveMethod === "CREDIT"
          ? `₹${grandTotal.toFixed(2)} recorded as outstanding credit.`
          : "Order settled and table released.",
      });
      setCompletedReceiptOrder(result.data?.order || selectedOrder);
      setShowReceipt(true);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to checkout order";
      toast({ variant: "destructive", title: "Checkout Error", description: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitCheckout = async (orderId: string) => {
    try {
      if (!selectedOrder) return;
      const ctx = getCustomerContext ? getCustomerContext() : null;
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      const cd = parseFloat(splitCard) || 0;
      const cr = parseFloat(splitCredit) || 0;
      const totalPaid = c + u + cd + cr;
      const grandTotal = getOrderGrandTotal(selectedOrder);

      if (totalPaid < grandTotal) {
        return toast({
          variant: "destructive",
          title: "Insufficient Split Amount",
          description: `Total payment allocation (₹${totalPaid.toFixed(
            2
          )}) is less than grand total (₹${grandTotal.toFixed(2)}).`,
        });
      }

      if (cr > 0 && ctx && !ctx.isCustomerLinked(selectedOrder)) {
        toast({
          variant: "destructive",
          title: "Customer Required ⚠️",
          description:
            "A registered customer or customer phone number is required to settle this order on Credit / Khata.",
        });
        setShowSplitDialog(false);
        ctx.setBillingTab("customer");
        return;
      }

      setIsProcessing(true);
      const payments: { method: string; amount: number }[] = [];
      if (c > 0) payments.push({ method: "CASH", amount: c });
      if (u > 0) payments.push({ method: "UPI", amount: u });
      if (cd > 0) payments.push({ method: "CARD", amount: cd });
      if (cr > 0) payments.push({ method: "CREDIT", amount: cr });

      const matchedCustomer = ctx?.matchedCustomer;
      const custPhone = ctx?.custPhone || "";
      const custName = ctx?.custName || "";

      const customerDetailsPayload =
        matchedCustomer || custPhone || custName
          ? {
              name: custName.trim() || undefined,
              phone: custPhone.trim() || undefined,
              customerId:
                matchedCustomer?._id || selectedOrder.customerDetails?.customerId || undefined,
            }
          : undefined;

      const result = await employeeService.checkoutOrder(orderId, {
        payments,
        customerDetails: customerDetailsPayload,
      });
      toast({
        title: cr > 0 ? "Multi-Payment & Credit Recorded 📋" : "Split Payment Successful! 💸",
        description: `Settled via ${payments.map((p) => `${p.method}: ₹${p.amount}`).join(", ")}`,
      });
      setShowSplitDialog(false);
      setCompletedReceiptOrder(result.data?.order || selectedOrder);
      setShowReceipt(true);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Split checkout failed";
      toast({ variant: "destructive", title: "Split Checkout Error", description: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickCashAndPrint = async (orderId: string) => {
    try {
      if (!selectedOrder) return;
      setIsProcessing(true);
      let targetOrder = selectedOrder;

      if (selectedOrder.status === "OPEN") {
        const billRes = await employeeService.generateBill(orderId);
        if (billRes?.data) {
          targetOrder = billRes.data;
        }
      }

      const grandTotal =
        targetOrder.financials?.grandTotal || getOrderGrandTotal(targetOrder);
      const checkoutResult = await employeeService.checkoutOrder(orderId, {
        payments: [{ method: "CASH", amount: grandTotal }],
      });

      toast({ title: "Quick Cash Settled ⚡", description: "Order paid & receipt printed!" });
      setCompletedReceiptOrder(checkoutResult.data?.order || targetOrder);
      setShowReceipt(true);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Quick Cash Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReopenOrder = async (orderId: string) => {
    try {
      setIsProcessing(true);
      await employeeService.reopenOrder(orderId);
      toast({
        title: "Order Re-opened 🔓",
        description: `Order #${selectedOrder?._id?.slice(
          -4
        )} tab is now OPEN. Waiters can now add extra items in POS!`,
      });
      await fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Re-open Error",
        description: error.message || "Failed to re-open order",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleComplimentary = async (
    itemId: string,
    isComplimentary: boolean,
    complimentaryReason?: string
  ) => {
    if (!selectedOrder) return;
    try {
      const response = await employeeService.toggleComplimentaryItem(selectedOrder._id, itemId, {
        isComplimentary,
        complimentaryReason,
      });
      toast({
        title: isComplimentary ? "Item marked Complimentary 🎁" : "Complimentary status removed",
        description: isComplimentary
          ? `Reason: ${complimentaryReason || ""}`
          : "Item returned to standard billing.",
      });
      if (response?.data) {
        setSelectedOrder(response.data);
      }
      await fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update item",
      });
      throw error;
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o._id.slice(-4).toLowerCase().includes(q) ||
        (o.tableId && o.tableId.tableNumber.toLowerCase().includes(q)) ||
        (o.customerDetails?.name && o.customerDetails.name.toLowerCase().includes(q)) ||
        (o.customerDetails?.phone && o.customerDetails.phone.includes(q))
    );
  }, [orders, searchQuery]);

  const readyItemCount = orders.reduce(
    (sum, o) => sum + o.kots.flatMap((k) => k.items).filter((i) => i.itemStatus === "READY").length,
    0
  );
  const pendingCount = orders.filter((o) => o.status === "BILLED").length;

  return {
    orders,
    filteredOrders,
    searchQuery,
    setSearchQuery,
    isLoading,
    selectedOrder,
    setSelectedOrder,
    selectedOrderForHistory,
    setSelectedOrderForHistory,
    completedReceiptOrder,
    setCompletedReceiptOrder,
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    showReceipt,
    setShowReceipt,
    mode,
    setMode,
    readyItemCount,
    pendingCount,
    showSplitDialog,
    setShowSplitDialog,
    splitCash,
    setSplitCash,
    splitUpi,
    setSplitUpi,
    splitCard,
    setSplitCard,
    splitCredit,
    setSplitCredit,
    complimentaryItem,
    setComplimentaryItem,
    showComplimentaryDialog,
    setShowComplimentaryDialog,
    getOrderGrandTotal,
    fetchOrders,
    handleGenerateBill,
    handleCheckout,
    handleSplitCheckout,
    handleQuickCashAndPrint,
    handleReopenOrder,
    handleToggleComplimentary,
  };
}

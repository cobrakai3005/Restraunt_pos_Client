"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { employeeService } from "@/services/employee.service";
import { customerService, Customer } from "@/services/customer.service";
import { Order } from "./types";

export function useCashierCredit(
  selectedOrder: Order | null,
  setSelectedOrder: (order: Order | null) => void,
  fetchOrders: () => Promise<void>
) {
  const { toast } = useToast();

  // Customer tab state
  const [billingTab, setBillingTab] = useState<"bill" | "customer" | "discount">("bill");
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Receive Credit Payment Dialog state
  const [showReceiveCreditDialog, setShowReceiveCreditDialog] = useState(false);
  const [creditPaymentOrder, setCreditPaymentOrder] = useState<Order | null>(null);
  const [creditPaymentMode, setCreditPaymentMode] = useState<"SINGLE" | "SPLIT">("SINGLE");
  const [creditPaymentAmount, setCreditPaymentAmount] = useState<string>("");
  const [creditPaymentMethod, setCreditPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("CASH");
  const [creditSplitCash, setCreditSplitCash] = useState<string>("");
  const [creditSplitUpi, setCreditSplitUpi] = useState<string>("");
  const [creditSplitCard, setCreditSplitCard] = useState<string>("");
  const [creditSplitOther, setCreditSplitOther] = useState<string>("");
  const [creditPaymentNotes, setCreditPaymentNotes] = useState<string>("");
  const [isSubmittingCreditPayment, setIsSubmittingCreditPayment] = useState(false);

  // Bulk Settle All Dues Dialog state
  const [showBulkSettleDialog, setShowBulkSettleDialog] = useState(false);
  const [bulkSettleCustomer, setBulkSettleCustomer] = useState<Customer | null>(null);
  const [bulkSettleOrders, setBulkSettleOrders] = useState<Order[]>([]);
  const [isSubmittingBulkSettle, setIsSubmittingBulkSettle] = useState(false);

  // Discount Tab state
  const [discountAmount, setDiscountAmount] = useState("");
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Sync state on order change
  useEffect(() => {
    if (selectedOrder) {
      const cd = selectedOrder.customerDetails;
      setCustName(cd?.name || "");
      const ph = cd?.phone || "";
      setCustPhone(ph);
      if (cd?.customerId && typeof cd.customerId === "object") {
        setMatchedCustomer(cd.customerId as any);
      } else if (ph.trim().length >= 4) {
        customerService
          .searchCustomerByPhone(ph.trim())
          .then((res) => {
            if (res?.data) setMatchedCustomer(res.data);
          })
          .catch(() => {});
      } else if (matchedCustomer && (!ph || ph.trim().length < 4)) {
        setMatchedCustomer(null);
      }
      if (selectedOrder.financials?.discount) {
        setDiscountAmount(String(selectedOrder.financials.discount));
      } else {
        setDiscountAmount("");
      }
    } else {
      setCustName("");
      setCustPhone("");
      setMatchedCustomer(null);
      setDiscountAmount("");
    }
    setBillingTab("bill");
  }, [
    selectedOrder?._id,
    selectedOrder?.customerDetails?.customerId,
    selectedOrder?.customerDetails?.phone,
    selectedOrder?.customerDetails?.name,
    selectedOrder?.financials?.discount,
  ]);

  // Helper: Check if customer is linked
  const isCustomerLinked = (ord: Order | null) => {
    if (!ord) return false;
    if (matchedCustomer && (matchedCustomer._id || matchedCustomer.name)) return true;
    if (custPhone && custPhone.trim().length >= 4) return true;
    if (
      custName &&
      custName.trim() !== "" &&
      custName.trim().toLowerCase() !== "walk-in guest" &&
      custName.trim().toLowerCase() !== "walk-in customer"
    ) {
      return true;
    }
    const cd = ord.customerDetails;
    if (cd) {
      if (cd.customerId) return true;
      if (typeof cd === "object" && (cd as any)._id) return true;
      if (cd.phone && cd.phone.trim().length >= 4) return true;
      if (
        cd.name &&
        cd.name.trim() !== "" &&
        cd.name.trim().toLowerCase() !== "walk-in guest" &&
        cd.name.trim().toLowerCase() !== "walk-in customer"
      ) {
        return true;
      }
    }
    if ((ord as any).customer || (ord as any).customerId) return true;
    return false;
  };

  // Debounced phone search
  useEffect(() => {
    if (!custPhone || custPhone.trim().length < 3) {
      if (!selectedOrder?.customerDetails?.customerId) {
        setMatchedCustomer(null);
      }
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingCustomer(true);
        const res = await customerService.searchCustomerByPhone(custPhone.trim());
        if (res?.data) {
          setMatchedCustomer(res.data);
          if (!custName.trim() || custName === "Walk-in Guest") {
            setCustName(res.data.name);
          }
        } else {
          setMatchedCustomer(null);
        }
      } catch {
        setMatchedCustomer(null);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [custPhone]);

  const handleOpenReceiveCredit = (order: Order) => {
    setCreditPaymentOrder(order);
    const due = order.financials?.dueAmount || 0;
    setCreditPaymentMode("SINGLE");
    setCreditPaymentAmount(due > 0 ? due.toString() : "");
    setCreditPaymentMethod("CASH");
    setCreditSplitCash("");
    setCreditSplitUpi("");
    setCreditSplitCard("");
    setCreditSplitOther("");
    setCreditPaymentNotes("");
    setShowReceiveCreditDialog(true);
  };

  const handleCollectCreditPayment = async () => {
    if (!creditPaymentOrder) return;
    const remainingDue = creditPaymentOrder.financials?.dueAmount || 0;

    let payload: any;
    let totalAmt = 0;

    if (creditPaymentMode === "SINGLE") {
      const amt = parseFloat(creditPaymentAmount);
      if (isNaN(amt) || amt <= 0) {
        return toast({
          variant: "destructive",
          title: "Invalid Amount",
          description: "Please enter a valid credit payment amount greater than 0.",
        });
      }
      if (amt > remainingDue) {
        return toast({
          variant: "destructive",
          title: "Amount Exceeds Credit",
          description: `Payment amount (₹${amt.toFixed(2)}) cannot exceed outstanding credit (₹${remainingDue.toFixed(2)}).`,
        });
      }
      totalAmt = amt;
      payload = {
        amount: amt,
        method: creditPaymentMethod,
        notes: creditPaymentNotes,
      };
    } else {
      const c = parseFloat(creditSplitCash) || 0;
      const u = parseFloat(creditSplitUpi) || 0;
      const cd = parseFloat(creditSplitCard) || 0;
      const o = parseFloat(creditSplitOther) || 0;
      totalAmt = c + u + cd + o;

      if (totalAmt <= 0) {
        return toast({
          variant: "destructive",
          title: "Invalid Split Amount",
          description: "Please allocate at least one payment amount greater than 0.",
        });
      }

      if (totalAmt > remainingDue) {
        return toast({
          variant: "destructive",
          title: "Amount Exceeds Credit",
          description: `Total split payment (₹${totalAmt.toFixed(2)}) cannot exceed outstanding credit (₹${remainingDue.toFixed(2)}).`,
        });
      }

      const payments: { method: "CASH" | "UPI" | "CARD" | "OTHER"; amount: number }[] = [];
      if (c > 0) payments.push({ method: "CASH", amount: c });
      if (u > 0) payments.push({ method: "UPI", amount: u });
      if (cd > 0) payments.push({ method: "CARD", amount: cd });
      if (o > 0) payments.push({ method: "OTHER", amount: o });

      payload = {
        payments,
        notes: creditPaymentNotes,
      };
    }

    try {
      setIsSubmittingCreditPayment(true);
      const res = await employeeService.addDuePayment(creditPaymentOrder._id, payload);

      toast({
        title: "Credit Payment Received! 💰",
        description: `Collected ₹${totalAmt.toFixed(2)}. Remaining credit: ₹${Math.max(
          0,
          remainingDue - totalAmt
        ).toFixed(2)}.`,
      });

      setShowReceiveCreditDialog(false);
      setCreditPaymentOrder(null);
      if (selectedOrder && selectedOrder._id === creditPaymentOrder._id && res?.data?.order) {
        setSelectedOrder(res.data.order);
      }
      await fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Credit Collection Error",
        description:
          error.response?.data?.message || error.message || "Failed to record credit payment",
      });
    } finally {
      setIsSubmittingCreditPayment(false);
    }
  };

  const handleOpenBulkSettle = (customer: Customer, orders?: Order[]) => {
    setBulkSettleCustomer(customer);
    if (orders && orders.length > 0) {
      setBulkSettleOrders(orders);
    } else {
      // If orders not directly provided, fetch customer due summary
      employeeService
        .getCustomerDueSummary(customer._id)
        .then((res) => {
          if (res?.data?.orders) {
            setBulkSettleOrders(res.data.orders);
          }
        })
        .catch(() => {});
    }
    setShowBulkSettleDialog(true);
  };

  const handleConfirmBulkSettle = async (payload: {
    customerId: string;
    amount?: number;
    method?: "CASH" | "UPI" | "CARD" | "OTHER";
    payments?: Array<{ amount: number; method: "CASH" | "UPI" | "CARD" | "OTHER" }>;
    notes?: string;
  }) => {
    try {
      setIsSubmittingBulkSettle(true);
      const res = await employeeService.bulkSettleDues(payload);

      const totalSettled = res?.data?.totalSettled || payload.amount || 0;
      const remainingDue = res?.data?.remainingDue ?? 0;

      toast({
        title: "Bulk Settlement Completed! 💰",
        description: `Settled ₹${Number(totalSettled).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })} across ${res?.data?.updatedOrdersCount || "multiple"} orders. Remaining customer due: ₹${Number(
          remainingDue
        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`,
      });

      setShowBulkSettleDialog(false);
      setBulkSettleCustomer(null);
      setBulkSettleOrders([]);
      await fetchOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Bulk Settlement Error",
        description:
          error.response?.data?.message || error.message || "Failed to complete bulk settlement.",
      });
    } finally {
      setIsSubmittingBulkSettle(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === "BILLED" || selectedOrder.status === "PAID") {
      toast({
        variant: "destructive",
        title: "Customer Details Locked 🔒",
        description: "Customer details cannot be altered after generating the bill/receipt.",
      });
      return;
    }
    try {
      setIsSavingCustomer(true);
      const payload: { name?: string; phone?: string; customerId?: string | null } = {
        name: custName.trim(),
        phone: custPhone.trim(),
        customerId: matchedCustomer?._id || null,
      };
      const response = await employeeService.updateCustomer(selectedOrder._id, payload);
      toast({
        title: matchedCustomer
          ? `Linked to ${matchedCustomer.tags || "Customer"} Profile ✅`
          : "Customer saved ✅",
        description: matchedCustomer
          ? `${matchedCustomer.name} (${matchedCustomer.tags || "NORMAL"}) linked to order.`
          : "Name and phone added to order.",
      });
      if (response?.data) {
        setSelectedOrder(response.data);
      }
      await fetchOrders();
      setBillingTab("bill");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to save customer";
      toast({ variant: "destructive", title: "Save Error", description: msg });
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleUnlinkCustomer = async () => {
    if (!selectedOrder) return;
    try {
      setIsSavingCustomer(true);
      await employeeService.updateCustomer(selectedOrder._id, {
        name: "",
        phone: "",
        customerId: null,
      });
      setCustName("");
      setCustPhone("");
      setMatchedCustomer(null);
      toast({ title: "Customer info unlinked" });
      await fetchOrders();
      setBillingTab("bill");
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || "Failed to unlink customer";
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleApplyCustomerDiscount = async (customer: Customer) => {
    if (!selectedOrder) return;
    if (selectedOrder.status === "BILLED" || selectedOrder.status === "PAID") {
      toast({
        variant: "destructive",
        title: "Discount Locked 🔒",
        description: "Discounts cannot be altered after generating the bill/receipt.",
      });
      return;
    }

    if (!customer.discountType || customer.discountType === "NONE" || !customer.discountValue) {
      toast({
        variant: "destructive",
        title: "No Discount Configured",
        description: "This customer profile does not have a configured discount.",
      });
      return;
    }

    try {
      setIsSavingDiscount(true);
      const reason = `${customer.tags || "Customer"} Discount (${
        customer.discountType === "PERCENTAGE"
          ? `${customer.discountValue}%`
          : `₹${customer.discountValue}`
      })`;
      const response = await employeeService.updateCustomer(selectedOrder._id, {
        customerId: customer._id,
        name: customer.name,
        phone: customer.phone,
        discountType: customer.discountType,
        discountValue: customer.discountValue,
        discountReason: reason,
      });

      toast({
        title: `${customer.tags || "Customer"} Discount Applied! 🎁`,
        description: `${reason} applied to order #${selectedOrder._id.slice(-4)}.`,
      });

      if (response?.data) {
        setSelectedOrder(response.data);
        if (response.data.financials?.discount) {
          setDiscountAmount(String(response.data.financials.discount));
        }
      }
      await fetchOrders();
      setBillingTab("bill");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to apply discount";
      toast({ variant: "destructive", title: "Discount Error", description: msg });
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleUpdateDiscount = async (customDisc?: number) => {
    if (!selectedOrder) return;
    if (selectedOrder.status === "BILLED" || selectedOrder.status === "PAID") {
      toast({
        variant: "destructive",
        title: "Discount Locked 🔒",
        description: "Discounts cannot be added or changed after generating the bill/receipt.",
      });
      return;
    }
    try {
      setIsSavingDiscount(true);
      const disc = customDisc !== undefined ? customDisc : parseFloat(discountAmount);
      if (isNaN(disc) || disc < 0) return toast({ variant: "destructive", title: "Invalid amount" });
      const response = await employeeService.updateCustomer(selectedOrder._id, {
        discount: disc,
        discountType: disc > 0 ? "MANUAL" : "NONE",
        discountValue: disc,
        discountReason: disc > 0 ? "Manual Discount" : "",
      });
      toast({
        title: disc > 0 ? "Discount applied ✅" : "Discount removed 🗑️",
        description:
          disc > 0 ? `₹${disc.toFixed(2)} discount saved.` : "Order returned to standard total.",
      });
      if (response?.data) {
        setSelectedOrder(response.data);
      }
      await fetchOrders();
      setBillingTab("bill");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to update discount";
      toast({ variant: "destructive", title: "Save Error", description: msg });
    } finally {
      setIsSavingDiscount(false);
    }
  };

  return {
    billingTab,
    setBillingTab,
    custPhone,
    setCustPhone,
    custName,
    setCustName,
    matchedCustomer,
    setMatchedCustomer,
    isSearchingCustomer,
    showCreateCustomerDialog,
    setShowCreateCustomerDialog,
    isSavingCustomer,
    showReceiveCreditDialog,
    setShowReceiveCreditDialog,
    creditPaymentOrder,
    creditPaymentMode,
    setCreditPaymentMode,
    creditPaymentAmount,
    setCreditPaymentAmount,
    creditPaymentMethod,
    setCreditPaymentMethod,
    creditSplitCash,
    setCreditSplitCash,
    creditSplitUpi,
    setCreditSplitUpi,
    creditSplitCard,
    setCreditSplitCard,
    creditSplitOther,
    setCreditSplitOther,
    creditPaymentNotes,
    setCreditPaymentNotes,
    isSubmittingCreditPayment,
    // Bulk Settle
    showBulkSettleDialog,
    setShowBulkSettleDialog,
    bulkSettleCustomer,
    setBulkSettleCustomer,
    bulkSettleOrders,
    setBulkSettleOrders,
    isSubmittingBulkSettle,
    handleOpenBulkSettle,
    handleConfirmBulkSettle,
    discountAmount,
    setDiscountAmount,
    isSavingDiscount,
    isCustomerLinked,
    handleOpenReceiveCredit,
    handleCollectCreditPayment,
    handleUpdateCustomer,
    handleUnlinkCustomer,
    handleApplyCustomerDiscount,
    handleUpdateDiscount,
  };
}

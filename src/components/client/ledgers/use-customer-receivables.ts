"use client";

import { useState, useEffect } from "react";
import { orderService, Order } from "@/services/order.service";
import { customerService, Customer } from "@/services/customer.service";
import { connectSocket } from "@/lib/socket";
import { useToast } from "@/components/ui/use-toast";
import { DueSummary } from "./types";

export function useCustomerReceivables(
  currentRestaurantId: string,
  activeTab: "receivables" | "vendors"
) {
  const { toast } = useToast();

  const [dueOrders, setDueOrders] = useState<Order[]>([]);
  const [dueCustomers, setDueCustomers] = useState<Customer[]>([]);
  const [dueCustomerId, setDueCustomerId] = useState<string>("ALL");
  const [dueSummary, setDueSummary] = useState<DueSummary>({
    totalOutstandingDue: 0,
    totalCollectedDue: 0,
    activeDueCount: 0,
    settledDueCount: 0,
  });
  const [isDueLoading, setIsDueLoading] = useState(false);
  const [isDueExporting, setIsDueExporting] = useState(false);

  // Filters & Pagination
  const [dueStatusFilter, setDueStatusFilter] = useState("ALL");
  const [dueFromDate, setDueFromDate] = useState("");
  const [dueToDate, setDueToDate] = useState("");
  const [duePage, setDuePage] = useState(1);
  const [dueLimit, setDueLimit] = useState(15);
  const [dueTotalItems, setDueTotalItems] = useState(0);
  const [dueTotalPages, setDueTotalPages] = useState(1);

  // Modals state
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<Order | null>(null);
  const [collectOrder, setCollectOrder] = useState<Order | null>(null);
  const [collectMode, setCollectMode] = useState<"SINGLE" | "SPLIT">("SINGLE");
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectMethod, setCollectMethod] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("CASH");
  const [collectSplitCash, setCollectSplitCash] = useState<string>("");
  const [collectSplitUpi, setCollectSplitUpi] = useState<string>("");
  const [collectSplitCard, setCollectSplitCard] = useState<string>("");
  const [collectSplitOther, setCollectSplitOther] = useState<string>("");
  const [collectNotes, setCollectNotes] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Load Customers for Credit Filter
  useEffect(() => {
    if (currentRestaurantId) {
      customerService
        .getCustomers(currentRestaurantId, { isActive: true })
        .then((res) => {
          const list = res?.data?.customers || res?.data || res?.customers || [];
          setDueCustomers(Array.isArray(list) ? list : []);
        })
        .catch((err) => {
          console.error("Failed to load customers for credit ledger", err);
          setDueCustomers([]);
        });
    }
  }, [currentRestaurantId]);

  // Load Receivables Data
  const loadDueOrders = async () => {
    if (!currentRestaurantId) return;
    try {
      setIsDueLoading(true);
      const params: any = {
        page: duePage,
        limit: dueLimit,
      };
      if (dueStatusFilter !== "ALL") params.status = dueStatusFilter;
      if (dueCustomerId && dueCustomerId !== "ALL") params.customerId = dueCustomerId;
      if (dueFromDate) params.fromDate = dueFromDate;
      if (dueToDate) params.toDate = dueToDate;

      const res = await orderService.getDueOrders(currentRestaurantId, params);

      if (res?.success) {
        const orderList = res.data || [];
        const totalCount = res.meta?.totalRecords ?? res.meta?.total ?? orderList.length;
        const pageCount = res.meta?.totalPages ?? res.meta?.pages ?? 1;

        setDueOrders(orderList);
        setDueTotalItems(totalCount);
        setDueTotalPages(pageCount);
        if (res.summary) {
          setDueSummary(res.summary);
        }
      } else {
        setDueOrders([]);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to load receivables",
        description: err.response?.data?.message || err.message,
      });
      setDueOrders([]);
    } finally {
      setIsDueLoading(false);
    }
  };

  // Load Receivables when Restaurant, Filters, Customer, or Page change
  useEffect(() => {
    if (currentRestaurantId && activeTab === "receivables") {
      loadDueOrders();
    }
  }, [
    currentRestaurantId,
    duePage,
    dueLimit,
    dueStatusFilter,
    dueCustomerId,
    dueFromDate,
    dueToDate,
    activeTab,
  ]);

  // Real-time socket update for credit receivables
  useEffect(() => {
    const socket = connectSocket();
    if (socket) {
      socket.on("order_due_updated", () => {
        if (activeTab === "receivables" && currentRestaurantId) {
          loadDueOrders();
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("order_due_updated");
      }
    };
  }, [activeTab, currentRestaurantId]);

  const handleOpenCollect = (order: Order) => {
    setCollectOrder(order);
    const remaining = order.financials?.dueAmount || 0;
    setCollectMode("SINGLE");
    setCollectAmount(remaining > 0 ? String(remaining) : "");
    setCollectMethod("CASH");
    setCollectSplitCash("");
    setCollectSplitUpi("");
    setCollectSplitCard("");
    setCollectSplitOther("");
    setCollectNotes("");
  };

  const handleSubmitDuePayment = async () => {
    if (!collectOrder || !currentRestaurantId) return;
    const remaining = collectOrder.financials?.dueAmount || 0;

    let payload: any;
    let totalAmt = 0;

    if (collectMode === "SINGLE") {
      const amt = parseFloat(collectAmount);
      if (isNaN(amt) || amt <= 0) {
        return toast({
          variant: "destructive",
          title: "Invalid Amount",
          description: "Please enter a valid credit collection amount greater than 0.",
        });
      }
      if (amt > remaining) {
        return toast({
          variant: "destructive",
          title: "Amount Exceeds Credit",
          description: `Payment amount (₹${amt.toFixed(2)}) cannot exceed outstanding credit (₹${remaining.toFixed(2)}).`,
        });
      }
      totalAmt = amt;
      payload = {
        amount: amt,
        method: collectMethod,
        notes: collectNotes,
      };
    } else {
      const c = parseFloat(collectSplitCash) || 0;
      const u = parseFloat(collectSplitUpi) || 0;
      const cd = parseFloat(collectSplitCard) || 0;
      const o = parseFloat(collectSplitOther) || 0;
      totalAmt = c + u + cd + o;

      if (totalAmt <= 0) {
        return toast({
          variant: "destructive",
          title: "Invalid Split Amount",
          description: "Please enter at least one split payment amount greater than 0.",
        });
      }

      if (totalAmt > remaining) {
        return toast({
          variant: "destructive",
          title: "Amount Exceeds Credit",
          description: `Total split payment (₹${totalAmt.toFixed(2)}) cannot exceed outstanding credit (₹${remaining.toFixed(2)}).`,
        });
      }

      const payments: { method: "CASH" | "UPI" | "CARD" | "OTHER"; amount: number }[] = [];
      if (c > 0) payments.push({ method: "CASH", amount: c });
      if (u > 0) payments.push({ method: "UPI", amount: u });
      if (cd > 0) payments.push({ method: "CARD", amount: cd });
      if (o > 0) payments.push({ method: "OTHER", amount: o });

      payload = {
        payments,
        notes: collectNotes,
      };
    }

    try {
      setIsSubmittingPayment(true);
      await orderService.addDuePayment(currentRestaurantId, collectOrder._id, payload);

      toast({
        title: "Credit Payment Collected! 🎉",
        description: `₹${totalAmt.toFixed(2)} recorded successfully.`,
      });

      setCollectOrder(null);
      await loadDueOrders();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.response?.data?.message || err.message || "Failed to record payment",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleExportDueCSV = async () => {
    if (!currentRestaurantId) return;
    try {
      setIsDueExporting(true);
      const res = await orderService.getDueOrders(currentRestaurantId, {
        limit: 5000,
        status: dueStatusFilter !== "ALL" ? dueStatusFilter : undefined,
        customerId: dueCustomerId !== "ALL" ? dueCustomerId : undefined,
        fromDate: dueFromDate || undefined,
        toDate: dueToDate || undefined,
      });

      const exportList: Order[] = res?.data || [];
      if (exportList.length === 0) {
        return toast({
          title: "No Data",
          description: "No credit records found matching current filters.",
        });
      }

      const headers = [
        "Invoice / Order #",
        "Date",
        "Customer Name",
        "Customer Phone",
        "Grand Total (INR)",
        "Paid Amount (INR)",
        "Outstanding Credit (INR)",
        "Credit Status",
        "Payment History (Method - Amount - Date)",
      ];

      const rows = exportList.map((o) => {
        const paymentsSummary = (o.financials?.duePayments || [])
          .map(
            (p) =>
              `${p.method}: Rs.${p.amount} on ${new Date(p.receivedAt).toLocaleDateString("en-IN")}`
          )
          .join(" | ");

        return [
          `"${o._id.slice(-6).toUpperCase()}"`,
          `"${new Date(o.createdAt).toLocaleString("en-IN")}"`,
          `"${(o.customerDetails?.name || "Walk-in Guest").replace(/"/g, '""')}"`,
          `"${o.customerDetails?.phone || "N/A"}"`,
          o.financials?.grandTotal || 0,
          o.financials?.paidAmount || 0,
          o.financials?.dueAmount || 0,
          `"${o.financials?.dueStatus || "NONE"}"`,
          `"${paymentsSummary.replace(/"/g, '""')}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Receivables_Credit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Exported",
        description: `Exported ${exportList.length} receivables records to CSV.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message,
      });
    } finally {
      setIsDueExporting(false);
    }
  };

  return {
    dueOrders,
    dueCustomers,
    dueCustomerId,
    setDueCustomerId,
    dueSummary,
    isDueLoading,
    isDueExporting,
    dueStatusFilter,
    setDueStatusFilter,
    dueFromDate,
    setDueFromDate,
    dueToDate,
    setDueToDate,
    duePage,
    setDuePage,
    dueLimit,
    setDueLimit,
    dueTotalItems,
    dueTotalPages,
    selectedOrderForHistory,
    setSelectedOrderForHistory,
    collectOrder,
    setCollectOrder,
    collectMode,
    setCollectMode,
    collectAmount,
    setCollectAmount,
    collectMethod,
    setCollectMethod,
    collectSplitCash,
    setCollectSplitCash,
    collectSplitUpi,
    setCollectSplitUpi,
    collectSplitCard,
    setCollectSplitCard,
    collectSplitOther,
    setCollectSplitOther,
    collectNotes,
    setCollectNotes,
    isSubmittingPayment,
    loadDueOrders,
    handleOpenCollect,
    handleSubmitDuePayment,
    handleExportDueCSV,
  };
}

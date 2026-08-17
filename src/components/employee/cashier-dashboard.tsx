"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Calculator, CheckCircle2, Receipt, Search, CreditCard, Banknote, Loader2, UtensilsCrossed, Flame, Smartphone, RotateCcw, Split, Zap, User, Phone, Percent, Tag, Menu, Printer, Lock, Gift, Sparkles, Star, Heart, Briefcase, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User as AuthUser } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { customerService, Customer } from "@/services/customer.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OrderTakingPanel } from "./order-taking-panel";
import { CashierPickupPanel } from "./cashier-pickup-panel";
import { ComplimentaryItemDialog } from "./complimentary-item-dialog";
import { CreateCustomerDialog } from "./create-customer-dialog";

interface DashboardProps {
  user: AuthUser;
  onOpenDrawer?: () => void;
}

interface KotItem {
  _id: string;
  menuItemId: { name: string; station?: string; imageUrl?: string };
  variantName?: string;
  variantPrice: number;
  quantity: number;
  itemStatus: string;
  cgstPercent: number;
  sgstPercent: number;
  isComplimentary?: boolean;
  complimentaryReason?: string;
  complimentaryBy?: any;
  complimentaryAt?: string;
}

interface Order {
  _id: string;
  orderNumber: number;
  tableId?: { tableNumber: string };
  orderType: string;
  kots: { items: KotItem[] }[];
  status: string;
  paymentStatus: string;
  financials?: {
    subtotal: number;
    totalTax: number;
    totalCgst?: number;
    totalSgst?: number;
    packagingCharge?: number;
    discount?: number;
    discountType?: "NONE" | "PERCENTAGE" | "FIXED" | "MANUAL";
    discountValue?: number;
    discountReason?: string;
    discountAppliedBy?: { contactName: string; role: string };
    grandTotal: number;
  };
  customerDetails?: {
    name?: string;
    phone?: string;
    customerId?: {
      _id: string;
      name: string;
      phone?: string;
      tags?: "NORMAL" | "FRIEND" | "VIP" | "STAFF";
      discountType?: "NONE" | "PERCENTAGE" | "FIXED";
      discountValue?: number;
    } | string | null;
  };
}

import { ReceiptModal } from "./ReceiptModal";

type Mode = "orders" | "kitchen" | "billing";

const TABS: { id: Mode; label: string; description: string; icon: React.ElementType; activeClass: string; dotClass: string }[] = [
  {
    id: "orders",
    label: "Take Orders",
    description: "Take new orders and fire them to the kitchen",
    icon: UtensilsCrossed,
    activeClass: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30",
    dotClass: "bg-blue-500",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    description: "Pick up ready food and hand it over",
    icon: Flame,
    activeClass: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30",
    dotClass: "bg-orange-500",
  },
  {
    id: "billing",
    label: "Billing & Settlements",
    description: "Generate bills, settle payments and close orders",
    icon: Calculator,
    activeClass: "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30",
    dotClass: "bg-emerald-500",
  },
];

export function CashierDashboard({ user, onOpenDrawer }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completedReceiptOrder, setCompletedReceiptOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [mode, setMode] = useState<Mode>("orders");

  // ── Multi-Payment / Split Payment state ──
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitCash, setSplitCash] = useState<string>("0");
  const [splitUpi, setSplitUpi] = useState<string>("0");
  const [splitCard, setSplitCard] = useState<string>("0");

  // ── Customer Tab state ──
  const [billingTab, setBillingTab] = useState<"bill" | "customer" | "discount">("bill");
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // ── Discount Tab state ──
  const [discountAmount, setDiscountAmount] = useState("");
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // ── Complimentary (FOC) state ──
  const [complimentaryItem, setComplimentaryItem] = useState<KotItem | null>(null);
  const [showComplimentaryDialog, setShowComplimentaryDialog] = useState(false);

  // Sync state on order change
  useEffect(() => {
    if (selectedOrder) {
      setCustName(selectedOrder.customerDetails?.name || "");
      const ph = selectedOrder.customerDetails?.phone || "";
      setCustPhone(ph);
      if (selectedOrder.customerDetails?.customerId && typeof selectedOrder.customerDetails.customerId === "object") {
        setMatchedCustomer(selectedOrder.customerDetails.customerId as any);
      } else if (ph.trim().length >= 4) {
        customerService.searchCustomerByPhone(ph.trim()).then(res => {
          if (res?.data) setMatchedCustomer(res.data);
        }).catch(() => {});
      } else {
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
  }, [selectedOrder?._id]);

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

  const handleToggleComplimentary = async (itemId: string, isComplimentary: boolean, complimentaryReason?: string) => {
    if (!selectedOrder) return;
    try {
      const response = await employeeService.toggleComplimentaryItem(selectedOrder._id, itemId, {
        isComplimentary,
        complimentaryReason,
      });
      toast({
        title: isComplimentary ? "Item marked Complimentary 🎁" : "Complimentary status removed",
        description: isComplimentary ? `Reason: ${complimentaryReason || ""}` : "Item returned to standard billing."
      });
      if (response?.data) {
        setSelectedOrder(response.data);
      }
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error?.message || "Failed to update item" });
      throw error;
    }
  };

  const getOrderGrandTotal = (order: Order | null) => {
    if (!order) return 0;
    const discount = order.financials?.discount || 0;
    if (order.financials?.grandTotal && order.financials.grandTotal > 0) {
      return order.financials.grandTotal;
    }
    const sub = order.kots?.flatMap(k => k.items).reduce((s, i) => s + (i.isComplimentary ? 0 : (i.variantPrice || 0) * i.quantity), 0) || 0;
    return Math.max(0, Math.round(sub * 1.05 - discount));
  };

  const { toast } = useToast();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = async () => {
    try {
      // Fetch both OPEN (unbilled) and BILLED (unpaid) orders
      const resActive = await employeeService.getOrders({ status: "OPEN" });
      const resBilled = await employeeService.getOrders({ status: "BILLED" });

      const allOrders = [...(resActive.data || []), ...(resBilled.data || [])];
      // Filter out PAID orders just in case
      setOrders(allOrders.filter(o => o.status !== "PAID"));

      // Update selected order reference if it exists
      if (selectedOrder) {
        const updated = allOrders.find(o => o._id === selectedOrder._id);
        if (updated) setSelectedOrder(updated);
        else setSelectedOrder(null);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to fetch orders", description: error.message });
    } finally {
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
      socket.on("item_status_update", debouncedFetchOrders);
      socket.on("item_complimentary_updated", debouncedFetchOrders);
    }

    return () => {
      if (socket) {
        socket.off("table_status_change", debouncedFetchOrders);
        socket.off("order_billed", debouncedFetchOrders);
        socket.off("item_status_update", debouncedFetchOrders);
        socket.off("item_complimentary_updated", debouncedFetchOrders);
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

  // When selected order changes, initialize customer form
  useEffect(() => {
    if (selectedOrder?.customerDetails) {
      setCustPhone(selectedOrder.customerDetails.phone || "");
      setCustName(selectedOrder.customerDetails.name || "");
    } else {
      setCustPhone("");
      setCustName("");
    }
    if (selectedOrder?.financials?.discount !== undefined) {
      setDiscountAmount(selectedOrder.financials.discount.toString());
    } else {
      setDiscountAmount("0");
    }
    setBillingTab("bill");
  }, [selectedOrder]);

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
      setIsProcessing(true);
      const grandTotal = getOrderGrandTotal(selectedOrder);
      const result = await employeeService.checkoutOrder(orderId, {
        payments: [{ method: paymentMethod, amount: grandTotal }],
      });
      toast({ title: "Payment Successful 🎉", description: "Order settled and table released." });
      setCompletedReceiptOrder(result.data?.order || selectedOrder);
      setShowReceipt(true);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitCheckout = async (orderId: string) => {
    try {
      if (!selectedOrder) return;
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      const cd = parseFloat(splitCard) || 0;
      const totalPaid = c + u + cd;
      const grandTotal = getOrderGrandTotal(selectedOrder);

      if (totalPaid < grandTotal) {
        return toast({
          variant: "destructive",
          title: "Insufficient Split Amount",
          description: `Total split payment (₹${totalPaid.toFixed(2)}) is less than grand total (₹${grandTotal.toFixed(2)}).`,
        });
      }

      setIsProcessing(true);
      const payments: { method: string; amount: number }[] = [];
      if (c > 0) payments.push({ method: "CASH", amount: c });
      if (u > 0) payments.push({ method: "UPI", amount: u });
      if (cd > 0) payments.push({ method: "CARD", amount: cd });

      const result = await employeeService.checkoutOrder(orderId, { payments });
      toast({
        title: "Split Payment Successful! 💸",
        description: `Settled via ${payments.map(p => `${p.method}: ₹${p.amount}`).join(", ")}`,
      });
      setShowSplitDialog(false);
      setCompletedReceiptOrder(result.data?.order || selectedOrder);
      setShowReceipt(true);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Split Checkout Error", description: error.message });
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

      const grandTotal = targetOrder.financials?.grandTotal || getOrderGrandTotal(targetOrder);
      const checkoutResult = await employeeService.checkoutOrder(orderId, {
        payments: [{ method: "CASH", amount: grandTotal }]
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

  const handleQuickCash = handleQuickCashAndPrint;

  const handleReopenOrder = async (orderId: string) => {
    try {
      setIsProcessing(true);
      await employeeService.reopenOrder(orderId);
      toast({
        title: "Order Re-opened 🔓",
        description: `Order #${selectedOrder?._id?.slice(-4)} tab is now OPEN. Waiters can now add extra items in POS!`,
      });
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Re-open Error", description: error.message || "Failed to re-open order" });
    } finally {
      setIsProcessing(false);
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
        title: matchedCustomer ? `Linked to ${matchedCustomer.tags || "Customer"} Profile ✅` : "Customer saved ✅",
        description: matchedCustomer ? `${matchedCustomer.name} (${matchedCustomer.tags || "NORMAL"}) linked to order.` : "Name and phone added to order."
      });
      if (response?.data) {
        setSelectedOrder(response.data);
      }
      await fetchOrders();
      setBillingTab("bill");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Error", description: error.message });
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
    if (selectedOrder.status === "BILLED" || selectedOrder.status === "PAID") {
      toast({
        variant: "destructive",
        title: "Discount Locked 🔒",
        description: "Discounts cannot be added or changed after generating the bill/receipt."
      });
      return;
    }

    if (!customer.discountType || customer.discountType === "NONE" || !customer.discountValue) {
      toast({ variant: "destructive", title: "No Discount Configured", description: "This customer profile does not have a configured discount." });
      return;
    }

    try {
      setIsSavingDiscount(true);
      const reason = `${customer.tags || "Customer"} Discount (${customer.discountType === "PERCENTAGE" ? `${customer.discountValue}%` : `₹${customer.discountValue}`})`;
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
        description: `${reason} applied to order #${selectedOrder._id.slice(-4)}.`
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
      toast({ variant: "destructive", title: "Discount Error", description: error.message });
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
        description: "Discounts cannot be added or changed after generating the bill/receipt."
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
        description: disc > 0 ? `₹${disc.toFixed(2)} discount saved.` : "Order returned to standard total."
      });
      if (response?.data) {
        setSelectedOrder(response.data);
      }
      await fetchOrders();
      setBillingTab("bill");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o._id.slice(-4).toLowerCase().includes(q) ||
      (o.tableId && o.tableId.tableNumber.toLowerCase().includes(q)) ||
      (o.customerDetails?.name && o.customerDetails.name.toLowerCase().includes(q)) ||
      (o.customerDetails?.phone && o.customerDetails.phone.includes(q))
    );
  }, [orders, searchQuery]);

  // Live counters for the tab badges
  const readyItemCount = orders.reduce(
    (sum, o) => sum + o.kots.flatMap(k => k.items).filter(i => i.itemStatus === "READY").length,
    0
  );
  const pendingCount = orders.filter(o => o.status === "BILLED").length;

  const activeTab = TABS.find(t => t.id === mode)!;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="font-medium">Loading Cashier Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      {/* Professional Segmented Tab Bar */}
      <div className="shrink-0 z-20 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onOpenDrawer && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenDrawer}
              title="Open Restaurant POS Menu & Settings"
              className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-800 text-white shadow-md">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Cashier Terminal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {activeTab.description}
            </p>
          </div>
        </div>

        {/* Segmented control */}


        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-inner">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;

            const badge =
              tab.id === "kitchen"
                ? readyItemCount
                : tab.id === "billing"
                  ? pendingCount
                  : 0;

            return (
              <Button
                key={tab.id}
                size="sm"
                onClick={() => setMode(tab.id)}
                className={`relative h-11 rounded-xl px-4 text-sm font-extrabold transition-all duration-200 md:px-6 ${isActive
                    ? "scale-105 bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                    : "border border-slate-200 bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
                  }`}
              >
                <Icon
                  className={`mr-2 h-4 w-4 ${isActive
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400"
                    }`}
                />

                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">
                  {tab.label.split(" ")[0]}
                </span>

                {badge > 0 && (
                  <span
                    className={`ml-2.5 flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-black ${isActive
                        ? "bg-white text-blue-700 shadow-sm"
                        : "bg-orange-500 text-white shadow-sm"
                      }`}
                  >
                    {badge}
                  </span>
                )}

                {/* Active Underline */}
                {isActive && (
                  <span className="absolute -bottom-1 left-4 right-4 h-1 animate-pulse rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mode Content */}
      {mode === "orders" ? (
        <div className="flex-1 min-h-0 p-4 bg-slate-100/50 dark:bg-slate-900/50">
          <OrderTakingPanel onOrderFired={fetchOrders} />
        </div>
      ) : mode === "kitchen" ? (
        <div className="flex-1 min-h-0 p-4 bg-slate-100/50 dark:bg-slate-900/50">
          <CashierPickupPanel user={user} embedded />
        </div>
      ) : (
        /* ── BILLING & SETTLEMENTS ── */
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left: Order Cards ── */}
          <div className="w-[260px] lg:w-[500px] shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
              <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-emerald-500" />
                Pending Bills
                {pendingCount > 0 && (
                  <span className="ml-auto bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingCount}</span>
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
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 grid grid-cols-4 gap-2 space-y-2">
                {filteredOrders.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-600 py-10 text-sm">No pending orders.</div>
                ) : (
                  filteredOrders.map(order => {
                    const isSelected = selectedOrder?._id === order._id;
                    const grandTotal = order.financials?.grandTotal
                      || (() => { const s = order.kots.flatMap(k => k.items).reduce((sum, i) => sum + ((i.variantPrice || 0) * i.quantity), 0); return s + s * 0.05; })();
                    return (
                      <div
                        key={order._id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-2 rounded-xl cursor-pointer border transition-all ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/30 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">#{order._id?.slice(-4)}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === 'BILLED'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}>{order.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {order.orderType === 'DINE_IN' ? `Table ${order.tableId?.tableNumber}` : order.orderType}
                        </div>
                        <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1">₹{grandTotal.toFixed(2)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* ── Right: Bill Detail ── */}
          {selectedOrder ? (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">

              {/* Header + Sub-tabs */}
              <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="px-6 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Order #{selectedOrder._id?.slice(-4)}</h2>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${selectedOrder.status === 'BILLED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>{selectedOrder.status === 'BILLED' ? 'Bill Generated' : 'Unbilled'}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedOrder.orderType === 'DINE_IN' ? `Dine-In • Table ${selectedOrder.tableId?.tableNumber}` : selectedOrder.orderType}
                      {selectedOrder.customerDetails?.name && ` • 👤 ${selectedOrder.customerDetails.name}`}
                    </p>
                  </div>
                </div>
                {/* Sub-tabs: Bill | Customer | Discount */}
                <div className="px-6 flex gap-1 pb-0">
                  {(() => {
                    const isBillLocked = selectedOrder.status === 'BILLED' || selectedOrder.status === 'PAID';
                    return ([
                      { id: "bill", label: "Bill", icon: Receipt, dot: false },
                      {
                        id: "customer",
                        label: isBillLocked ? "Customer (Locked)" : "Customer",
                        icon: isBillLocked ? Lock : User,
                        dot: !!(selectedOrder.customerDetails?.name || selectedOrder.customerDetails?.phone)
                      },
                      {
                        id: "discount",
                        label: isBillLocked ? "Discount (Locked)" : "Discount",
                        icon: isBillLocked ? Lock : Percent,
                        dot: (selectedOrder.financials?.discount ?? 0) > 0
                      },
                    ] as const).map((t) => {
                      const Icon = t.icon;
                      const isActive = billingTab === t.id;
                      const isLockedTab = (t.id === "customer" || t.id === "discount") && isBillLocked;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setBillingTab(t.id);
                            if (t.id === "customer") {
                              setCustPhone(selectedOrder.customerDetails?.phone || "");
                              setCustName(selectedOrder.customerDetails?.name || "");
                            }
                            if (t.id === "discount") {
                              setDiscountAmount(String(selectedOrder.financials?.discount ?? ""));
                            }
                          }}
                          className={`px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all ${isActive
                            ? t.id === "customer"
                              ? "border-violet-500 text-violet-600 dark:text-violet-400"
                              : t.id === "discount"
                                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                : "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Icon className={`h-3.5 w-3.5 ${isLockedTab ? "text-amber-500" : ""}`} /> {t.label}
                            {t.dot && <span className={`ml-0.5 w-1.5 h-1.5 rounded-full inline-block ${t.id === "discount" ? "bg-emerald-500" : "bg-violet-500"}`} />}
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* ── Customer Tab Content ── */}
              {billingTab === "customer" && (() => {
                const isCustomerLocked = selectedOrder.status === "BILLED" || selectedOrder.status === "PAID";
                return (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-5 max-w-lg mx-auto space-y-5">

                      {/* Locked alert banner */}
                      {isCustomerLocked ? (
                        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 p-4 flex items-start gap-3 shadow-xs">
                          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                              Customer Details Locked (Bill Generated)
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                              A bill/receipt has already been generated for this order. Customer details and VIP/Friend discounts cannot be altered after generating the bill. Re-open the order to make changes.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Info banner */
                        <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-4 py-3 flex items-start gap-3">
                          <User className="h-4 w-4 mt-0.5 text-violet-500 shrink-0" />
                          <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                            Search registered <strong>VIP / Friend / Staff</strong> profiles by phone number, or enter a walk-in guest name. Profile discount rules will be detected automatically.
                          </p>
                        </div>
                      )}

                      {/* Phone Search */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Customer Phone</span>
                          {isSearchingCustomer && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold lowercase">
                              <Loader2 className="h-3 w-3 animate-spin" /> searching...
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <Input
                            id="cust-phone"
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            disabled={isCustomerLocked}
                            placeholder={isCustomerLocked ? "Customer phone (locked)" : "Enter 10-digit mobile number"}
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className={`h-11 pl-4 font-bold text-sm rounded-xl ${
                              isCustomerLocked
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                            }`}
                          />
                          {custPhone.length === 10 && !isCustomerLocked && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>
                          )}
                        </div>
                      </div>

                      {/* Matched Customer Profile Card */}
                      {matchedCustomer ? (
                        <div className="rounded-2xl border border-violet-200 dark:border-violet-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-black text-sm">
                                {matchedCustomer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                  {matchedCustomer.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {matchedCustomer.phone || "No phone"} {matchedCustomer.email ? `• ${matchedCustomer.email}` : ""}
                                </p>
                              </div>
                            </div>

                            {/* Tag Badge */}
                            <div>
                              {matchedCustomer.tags === "FRIEND" && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                                  <Heart className="w-3 h-3 text-emerald-600 fill-emerald-600" /> FRIEND
                                </span>
                              )}
                              {matchedCustomer.tags === "VIP" && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 shadow-2xs">
                                  <Star className="w-3 h-3 text-purple-600 fill-purple-600" /> VIP
                                </span>
                              )}
                              {matchedCustomer.tags === "STAFF" && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                                  <Briefcase className="w-3 h-3 text-amber-600" /> STAFF
                                </span>
                              )}
                              {(!matchedCustomer.tags || matchedCustomer.tags === "NORMAL") && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                                  <User className="w-3 h-3" /> REGULAR
                                </span>
                              )}
                            </div>
                          </div>

                          {matchedCustomer.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg italic">
                              "{matchedCustomer.notes}"
                            </p>
                          )}

                          {/* Available Discount Banner */}
                          {matchedCustomer.discountType && matchedCustomer.discountType !== "NONE" && (matchedCustomer.discountValue || 0) > 0 && (
                            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-700/80 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">
                                    {matchedCustomer.tags || "Customer"} — {matchedCustomer.discountType === "PERCENTAGE" ? `${matchedCustomer.discountValue}% Discount Available` : `₹${matchedCustomer.discountValue} Flat Discount Available`}
                                  </div>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                                    Configured discount rule for this customer
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isSavingDiscount || isCustomerLocked}
                                onClick={() => handleApplyCustomerDiscount(matchedCustomer)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl px-3.5 shrink-0 shadow-sm disabled:opacity-50"
                              >
                                Apply Discount
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        custPhone.trim().length >= 3 && !isSearchingCustomer && !isCustomerLocked && (
                          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center space-y-2 bg-white/50 dark:bg-slate-900/50">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              No VIP or Friend profile found for <strong>{custPhone}</strong>.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isCustomerLocked}
                              onClick={() => setShowCreateCustomerDialog(true)}
                              className="rounded-xl text-xs font-extrabold border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Register as VIP / Friend
                            </Button>
                          </div>
                        )
                      )}

                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" /> Customer Name
                        </label>
                        <Input
                          id="cust-name"
                          type="text"
                          disabled={isCustomerLocked}
                          placeholder={isCustomerLocked ? "Customer name (locked)" : "e.g. Ramesh Sharma"}
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          className={`h-11 font-bold text-sm rounded-xl ${
                            isCustomerLocked
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                              : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          }`}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 pt-1">
                        {isCustomerLocked ? (
                          <div className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-extrabold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                            <Lock className="h-4 w-4 text-amber-500" /> Customer Details Locked (Bill Generated)
                          </div>
                        ) : (
                          <button
                            id="save-customer-btn"
                            disabled={isSavingCustomer}
                            onClick={handleUpdateCustomer}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-md shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isSavingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                            {isSavingCustomer ? "Saving..." : matchedCustomer ? "Link Customer & Update Order" : "Save Customer Info"}
                          </button>
                        )}

                        {!isCustomerLocked && (selectedOrder.customerDetails?.name || selectedOrder.customerDetails?.phone || selectedOrder.customerDetails?.customerId) && (
                          <button
                            disabled={isSavingCustomer}
                            onClick={async () => {
                              try {
                                setIsSavingCustomer(true);
                                await employeeService.updateCustomer(selectedOrder._id, { name: "", phone: "", customerId: null });
                                setCustName("");
                                setCustPhone("");
                                setMatchedCustomer(null);
                                toast({ title: "Customer info unlinked" });
                                await fetchOrders();
                                setBillingTab("bill");
                              } catch (e: any) {
                                toast({ variant: "destructive", title: "Error", description: e.message });
                              } finally {
                                setIsSavingCustomer(false);
                              }
                            }}
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Unlink / Clear Customer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Discount Tab Content ── */}
              {billingTab === "discount" && (() => {
                const isDiscountLocked = selectedOrder.status === "BILLED" || selectedOrder.status === "PAID";
                let dSubtotal = selectedOrder.financials?.subtotal ?? 0;
                let dTax = selectedOrder.financials?.totalTax ?? 0;
                let dGrand = selectedOrder.financials?.grandTotal ?? 0;
                if (selectedOrder.status === "OPEN" || dSubtotal === 0) {
                  dSubtotal = selectedOrder.kots
                    .flatMap((k: any) => k.items)
                    .reduce((sum: number, item: any) => sum + (item.isComplimentary ? 0 : (item.variantPrice || 0) * item.quantity), 0);
                  dTax = selectedOrder.kots.flatMap((k: any) => k.items)
                    .reduce((sum: number, item: any) => sum + (item.isComplimentary ? 0 : ((item.variantPrice || 0) * item.quantity * (item.taxPercentage || 0)) / 100), 0);
                  dGrand = dSubtotal + dTax;
                }
                return (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-5 max-w-lg mx-auto space-y-5">

                      {/* Lock or Info banner */}
                      {isDiscountLocked ? (
                        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 p-4 flex items-start gap-3 shadow-xs">
                          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                              Discount Locked (Bill Generated)
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                              A receipt / bill has already been generated for this order. Discounts cannot be altered after generating the bill.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 flex items-start gap-3">
                          <Tag className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                            Apply a customized discount or use the customer profile's entitlement. Grand total will recalculate automatically.
                          </p>
                        </div>
                      )}

                      {/* Customer Entitlement Discount Banner */}
                      {matchedCustomer && matchedCustomer.discountType && matchedCustomer.discountType !== "NONE" && (matchedCustomer.discountValue || 0) > 0 && !isDiscountLocked && (
                        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              {matchedCustomer.tags || "Customer"} Discount Profile
                            </span>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                              {matchedCustomer.discountType === "PERCENTAGE" ? `${matchedCustomer.discountValue}% OFF` : `₹${matchedCustomer.discountValue} OFF`}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            Customer <strong>{matchedCustomer.name}</strong> is entitled to a {matchedCustomer.discountType === "PERCENTAGE" ? `${matchedCustomer.discountValue}%` : `₹${matchedCustomer.discountValue}`} waiver.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSavingDiscount}
                            onClick={() => handleApplyCustomerDiscount(matchedCustomer)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs gap-1.5 mt-1"
                          >
                            Apply {matchedCustomer.tags || "Customer"} Discount
                          </Button>
                        </div>
                      )}

                      {/* Active Applied Discount Breakdown */}
                      {(selectedOrder.financials?.discount ?? 0) > 0 && (
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Currently Applied Discount
                            </span>
                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                              - ₹{(selectedOrder.financials!.discount!).toFixed(2)}
                            </span>
                          </div>
                          {selectedOrder.financials?.discountReason && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              Reason: {selectedOrder.financials.discountReason}
                            </p>
                          )}
                          {selectedOrder.financials?.discountAppliedBy && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Applied by: {(selectedOrder.financials.discountAppliedBy as any).contactName || "Manager"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Current totals summary */}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        <div className="flex justify-between px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          <span>Subtotal</span>
                          <span className="font-semibold">₹{dSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          <span>GST / Tax</span>
                          <span className="font-semibold">₹{dTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 text-sm font-extrabold text-slate-900 dark:text-white">
                          <span>Grand Total (before discount)</span>
                          <span className="text-blue-600 dark:text-blue-400">₹{dGrand.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Manual Discount input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Percent className="h-3.5 w-3.5" /> Manual Flat Discount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                          <Input
                            id="discount-amount"
                            type="number"
                            min={0}
                            step={1}
                            disabled={isDiscountLocked}
                            placeholder="0"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            className="h-12 pl-8 font-extrabold text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                          />
                        </div>
                        {discountAmount && !isNaN(parseFloat(discountAmount)) && parseFloat(discountAmount) > 0 && (
                          <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-bold pl-1">
                            New total: ₹{Math.max(0, dGrand - parseFloat(discountAmount)).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Quick presets (% & ₹) */}
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1.5">Quick % Off</label>
                          <div className="flex flex-wrap gap-2">
                            {[5, 10, 15, 20].map(pct => {
                              const calculatedAmt = Math.round((dSubtotal * pct) / 100);
                              const isSelected = discountAmount === String(calculatedAmt);
                              return (
                                <button
                                  key={`pct-${pct}`}
                                  type="button"
                                  disabled={isDiscountLocked}
                                  onClick={() => setDiscountAmount(String(calculatedAmt))}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400"
                                    }`}
                                >
                                  <span>{pct}%</span>
                                  <span className="text-[10px] opacity-70 font-semibold">(₹{calculatedAmt})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1.5">Quick Flat ₹ Off</label>
                          <div className="flex flex-wrap gap-2">
                            {[10, 20, 50, 100].map(amt => (
                              <button
                                key={`flat-${amt}`}
                                type="button"
                                disabled={isDiscountLocked}
                                onClick={() => setDiscountAmount(String(amt))}
                                className={`px-4 py-1.5 rounded-xl border text-xs font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${discountAmount === String(amt)
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400"
                                  }`}
                              >
                                ₹{amt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Save or Locked State */}
                      {isDiscountLocked ? (
                        <div className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-extrabold text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none shadow-xs">
                          <Lock className="h-4 w-4 text-amber-500" />
                          Discount Locked (Bill Generated)
                        </div>
                      ) : (
                        <button
                          id="save-discount-btn"
                          disabled={isSavingDiscount}
                          onClick={() => handleUpdateDiscount()}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSavingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Percent className="h-4 w-4" />}
                          {isSavingDiscount ? "Applying..." : "Save Discount"}
                        </button>
                      )}

                      {/* Remove discount */}
                      {(selectedOrder.financials?.discount ?? 0) > 0 && !isDiscountLocked && (
                        <button
                          disabled={isSavingDiscount}
                          onClick={() => handleUpdateDiscount(0)}
                          className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Remove Discount
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Scrollable: item table + totals + payment options */}


              {billingTab === "bill" && (

                <div className="flex-1 overflow-y-auto min-h-0">
                  {(() => {
                    // const discount = selectedOrder.financials?.discount || 0;
                    // let subtotal = selectedOrder.financials?.subtotal || 0;
                    // let totalTax = selectedOrder.financials?.totalTax || 0;
                    // let grandTotal = selectedOrder.financials?.grandTotal || 0;

                    // if (selectedOrder.status === 'OPEN' || subtotal === 0) {
                    //   subtotal = selectedOrder.kots.flatMap(k => k.items).reduce((sum, item) => sum + ((item.variantPrice || 0) * item.quantity), 0);
                    //   totalTax = subtotal * 0.05;
                    //   grandTotal = Math.max(0, Math.round(subtotal + totalTax - discount));
                    // } else if (discount > 0 && grandTotal === (subtotal + totalTax)) {
                    //   grandTotal = Math.max(0, Math.round(subtotal + totalTax - discount));
                    // }



                    const discount = Math.max(
                      0,
                      Number(selectedOrder.financials?.discount || 0)
                    );

                    let subtotal = 0;
                    let totalCgst = 0;
                    let totalSgst = 0;

                    // Calculate from KOT items (excluding complimentary items)
                    selectedOrder.kots?.forEach((kot) => {
                      kot.items?.forEach((item) => {
                        const isComp = Boolean(item.isComplimentary);
                        const itemTotal = isComp
                          ? 0
                          : Number(item.variantPrice || 0) * Number(item.quantity || 0);

                        subtotal += itemTotal;

                        const cgstPercent = Number(item.cgstPercent || 0);
                        const sgstPercent = Number(item.sgstPercent || 0);

                        totalCgst += isComp ? 0 : (itemTotal * cgstPercent) / 100;
                        totalSgst += isComp ? 0 : (itemTotal * sgstPercent) / 100;
                      });
                    });

                    // Same rounding as backend
                    subtotal = Math.round(subtotal);

                    const roundedCgst = Math.round(totalCgst);
                    const roundedSgst = Math.round(totalSgst);

                    const totalTax = roundedCgst + roundedSgst;

                    // Same packaging logic as backend
                    const packagingCharge =
                      selectedOrder.orderType === "TAKEAWAY" ? 20 : 0;

                    // Same final calculation as backend
                    const grandTotal = Math.max(
                      0,
                      subtotal +
                      totalTax +
                      packagingCharge -
                      discount
                    );
                    return (
                      <div className="p-5 space-y-5 max-w-3xl mx-auto">

                        {/* ── KOT Item Table ── */}
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                          {/* Table header */}
                          <div className="grid grid-cols-[1fr_70px_100px_85px] gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 items-center">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Item</span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Qty</span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Price</span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Action</span>
                          </div>

                          {/* KOT groups */}
                          {selectedOrder.kots.map((kot, kotIdx) => (
                            <div key={kotIdx}>
                              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                  KOT {kotIdx + 1}
                                </span>
                              </div>
                              {kot.items.map((item, idx) => (
                                <div key={idx} className={`grid grid-cols-[1fr_70px_100px_85px] gap-2 px-4 py-3 items-center ${idx < kot.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/60' : ''}`}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {item.menuItemId?.imageUrl && (
                                      <img src={item.menuItemId.imageUrl} alt={item.menuItemId.name} className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{item.menuItemId?.name || 'Item'}</span>
                                        {item.isComplimentary && (
                                          <span className="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-0.5 shadow-2xs">
                                            <Gift className="w-2.5 h-2.5" /> FOC
                                          </span>
                                        )}
                                      </div>
                                      {item.isComplimentary && item.complimentaryReason && (
                                        <p className="text-[10px] text-purple-600 dark:text-purple-400 truncate mt-0.5">
                                          Reason: {item.complimentaryReason}
                                        </p>
                                      )}
                                    </div>
                                    {/* Item status badge */}
                                    <span className={`shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${item.itemStatus === 'SERVED' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' :
                                      item.itemStatus === 'READY' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                        item.itemStatus === 'PREPARING' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                          'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                      }`}>{item.itemStatus}</span>
                                  </div>
                                  {/* Qty */}
                                  <div className="flex items-center justify-center">
                                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white">
                                      {item.quantity}
                                    </span>
                                  </div>
                                  {/* Price */}
                                  <div className="text-right">
                                    {item.isComplimentary ? (
                                      <div>
                                        <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">₹0.00</span>
                                        <div className="text-[10px] text-slate-400 line-through">₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}</div>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}</span>
                                        {item.quantity > 1 && (
                                          <div className="text-[10px] text-slate-400 dark:text-slate-500">₹{(item.variantPrice || 0).toFixed(2)} each</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {/* Complimentary Toggle Button */}
                                  <div className="flex justify-end">
                                    {(() => {
                                      const isCompLocked = selectedOrder.status === "BILLED" || selectedOrder.status === "PAID";
                                      return (
                                        <button
                                          type="button"
                                          disabled={isCompLocked}
                                          onClick={() => {
                                            if (isCompLocked) return;
                                            setComplimentaryItem(item);
                                            setShowComplimentaryDialog(true);
                                          }}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                            isCompLocked
                                              ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                              : item.isComplimentary
                                                ? "border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
                                                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 hover:border-purple-300 dark:hover:text-purple-300"
                                          }`}
                                          title={
                                            isCompLocked
                                              ? "Complimentary status cannot be modified after bill is generated"
                                              : item.isComplimentary
                                                ? "Edit or Remove Complimentary"
                                                : "Make Complimentary (FOC)"
                                          }
                                        >
                                          <Gift className="w-3 h-3" />
                                          <span>{item.isComplimentary ? "FOC" : "Comp"}</span>
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* ── Totals Block ── */}
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="flex justify-between px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                              <span>Subtotal</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                              <span>GST / Tax</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">₹{totalTax.toFixed(2)}</span>
                            </div>
                            {/* Discount row */}
                            {(selectedOrder.financials?.discount ?? 0) > 0 ? (
                              <div className="flex justify-between px-5 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                                <span className="flex items-center gap-1.5 font-semibold"><Percent className="h-3.5 w-3.5" /> Discount</span>
                                <span className="font-bold">- ₹{(selectedOrder.financials!.discount!).toFixed(2)}</span>
                              </div>
                            ) : (
                              <div className="flex justify-between px-5 py-3 text-sm text-slate-400 dark:text-slate-600">
                                <span>Discount</span>
                                <span className="font-semibold text-slate-400 dark:text-slate-500">—</span>
                              </div>
                            )}
                            <div className="flex justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/40">
                              <span className="text-base font-extrabold text-slate-900 dark:text-white">Total</span>
                              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{grandTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* ── Payment Method (only for BILLED orders) ── */}
                        {selectedOrder.status === 'BILLED' && (
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Payment Method</span>
                              {paymentMethod === "PART" && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Split / Part Mode</span>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {[
                                  { id: 'CASH', label: 'Cash', icon: Banknote, enabled: true },
                                  { id: 'UPI', label: 'UPI', icon: Smartphone, enabled: true },
                                  { id: 'CARD', label: 'Card', icon: CreditCard, enabled: true },
                                  { id: 'PART', label: 'Part / Split', icon: Split, enabled: true },
                                  { id: 'DUE', label: 'Due', icon: null, enabled: false },
                                ].map(method => {
                                  const Icon = method.icon;
                                  const isActive = paymentMethod === method.id;
                                  return (
                                    <button
                                      key={method.id}
                                      disabled={!method.enabled}
                                      onClick={() => {
                                        if (method.id === "PART") {
                                          setPaymentMethod("PART");
                                          const g = selectedOrder.financials?.grandTotal || 0;
                                          setSplitCash(g.toFixed(0));
                                          setSplitUpi("0");
                                          setSplitCard("0");
                                          setShowSplitDialog(true);
                                        } else if (method.enabled) {
                                          setPaymentMethod(method.id);
                                        }
                                      }}
                                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center relative ${!method.enabled
                                        ? 'opacity-40 cursor-not-allowed border-dashed border-slate-200 dark:border-slate-700'
                                        : isActive
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10'
                                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                                        }`}
                                    >
                                      {/* Radio indicator */}
                                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {isActive && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                      </span>
                                      {Icon ? <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} /> : (
                                        <span className={`text-base ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>○</span>
                                      )}
                                      <span className={`text-[11px] font-bold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>{method.label}</span>
                                      {!method.enabled && (
                                        <span className="absolute top-1 right-1 text-[8px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">Soon</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* ── Feature Chips ── */}
                            <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
                              {/* Active Split Bill Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentMethod("PART");
                                  const g = selectedOrder.financials?.grandTotal || 0;
                                  setSplitCash(g.toFixed(0));
                                  setSplitUpi("0");
                                  setSplitCard("0");
                                  setShowSplitDialog(true);
                                }}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:from-blue-500/20 hover:to-indigo-500/20 transition-all active:scale-95 shadow-xs"
                              >
                                <Split className="h-3.5 w-3.5" /> Split / Part Payment
                              </button>

                              {[
                                { label: '🎁 BOGO Offer', coming: true },
                                { label: '⭐ Loyalty Points', coming: true },
                                { label: '📲 Send Receipt SMS', coming: true },
                              ].map(f => (
                                <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed select-none">
                                  {f.label}
                                  <span className="text-[8px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">Soon</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>
              )}



              {/* ── Sticky Action Footer ── */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)]">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">

                  {/* Left: Quick Order Summary */}
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Due</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      ₹{getOrderGrandTotal(selectedOrder).toFixed(2)}
                    </span>
                  </div>

                  {/* Right: Action Buttons (Compact & Balanced) */}
                  <div className="flex items-center gap-3 ml-auto">
                    {selectedOrder.status === 'OPEN' ? (
                      <>
                        <Button
                          variant="outline"
                          className="border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-extrabold h-12 px-5 rounded-xl text-sm transition-all"
                          disabled={isProcessing}
                          onClick={() => handleQuickCashAndPrint(selectedOrder._id)}
                          title="1-tap Bill, Pay Cash, and Print Receipt"
                        >
                          <Zap className="mr-1.5 h-4 w-4 text-amber-500 fill-amber-500" /> Quick Cash & Print
                        </Button>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[180px]"
                          disabled={isProcessing}
                          onClick={() => handleGenerateBill(selectedOrder._id)}
                        >
                          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
                          {isProcessing ? 'Generating...' : 'Generate Bill'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold h-12 px-4 rounded-xl transition-all"
                          onClick={() => {
                            setCompletedReceiptOrder(selectedOrder);
                            setShowReceipt(true);
                          }}
                          title="View and Print Bill Receipt"
                        >
                          <Printer className="mr-2 h-4 w-4" /> Print Bill
                        </Button>
                        <Button
                          variant="outline"
                          className="border-amber-400/60 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold h-12 px-4 rounded-xl transition-all"
                          disabled={isProcessing}
                          onClick={() => handleReopenOrder(selectedOrder._id)}
                          title="Re-open order to add items before payment"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Re-Open Order
                        </Button>
                        {paymentMethod === "PART" ? (
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-blue-600/30 hover:shadow-blue-600/45 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[200px]"
                            onClick={() => {
                              const g = selectedOrder.financials?.grandTotal || 0;
                              setSplitCash(g.toFixed(0));
                              setSplitUpi("0");
                              setSplitCard("0");
                              setShowSplitDialog(true);
                            }}
                          >
                            <Split className="mr-2 h-4 w-4" /> Configure Split
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-blue-600/30 hover:shadow-blue-600/45 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[220px]"
                            disabled={isProcessing}
                            onClick={() => handleCheckout(selectedOrder._id)}
                          >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            {isProcessing ? 'Processing...' : `Collect ${paymentMethod === 'CASH' ? '💵 Cash' : paymentMethod === 'UPI' ? '📱 UPI' : '💳 Card'} ₹${getOrderGrandTotal(selectedOrder).toFixed(0)}`}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-3">
              <Receipt className="h-16 w-16 opacity-20" />
              <p className="text-base font-medium">Select an order to view the bill</p>
            </div>
          )}

          <ReceiptModal
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
            order={completedReceiptOrder || selectedOrder}
            restaurant={(user as any)?.restaurant}
          />
        </div>
      )}

      {/* ── Multi-Payment / Split Payment Dialog ── */}
      {selectedOrder && (
        <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Split className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Multi-Payment / Part Payment
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order Grand Total</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  ₹{getOrderGrandTotal(selectedOrder).toFixed(2)}
                </span>
              </div>

              {(() => {
                const grandTotal = getOrderGrandTotal(selectedOrder);
                const c = parseFloat(splitCash) || 0;
                const u = parseFloat(splitUpi) || 0;
                const cd = parseFloat(splitCard) || 0;
                const currentTotal = c + u + cd;
                const remaining = Math.max(0, grandTotal - currentTotal);

                const handleCashChange = (valStr: string) => {
                  if (valStr === "") return setSplitCash("");
                  const val = Math.max(0, parseFloat(valStr) || 0);
                  const maxAllowed = Math.max(0, grandTotal - u - cd);
                  setSplitCash(Math.min(val, maxAllowed).toString());
                };

                const handleUpiChange = (valStr: string) => {
                  if (valStr === "") return setSplitUpi("");
                  const val = Math.max(0, parseFloat(valStr) || 0);
                  const maxAllowed = Math.max(0, grandTotal - c - cd);
                  setSplitUpi(Math.min(val, maxAllowed).toString());
                };

                const handleCardChange = (valStr: string) => {
                  if (valStr === "") return setSplitCard("");
                  const val = Math.max(0, parseFloat(valStr) || 0);
                  const maxAllowed = Math.max(0, grandTotal - c - u);
                  setSplitCard(Math.min(val, maxAllowed).toString());
                };

                return (
                  <>
                    <div className="space-y-3">
                      {/* Cash Input */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            💵 Cash Payment (₹)
                          </label>
                          {remaining > 0 && c === 0 && (
                            <button
                              type="button"
                              onClick={() => setSplitCash(remaining.toFixed(0))}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Fill ₹{remaining.toFixed(0)}
                            </button>
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={grandTotal - u - cd}
                          value={splitCash}
                          onChange={(e) => handleCashChange(e.target.value)}
                          placeholder="0"
                          className="h-11 font-bold text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      {/* UPI Input */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            📱 UPI / QR Payment (₹)
                          </label>
                          {remaining > 0 && u === 0 && (
                            <button
                              type="button"
                              onClick={() => setSplitUpi(remaining.toFixed(0))}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Fill ₹{remaining.toFixed(0)}
                            </button>
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={grandTotal - c - cd}
                          value={splitUpi}
                          onChange={(e) => handleUpiChange(e.target.value)}
                          placeholder="0"
                          className="h-11 font-bold text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      {/* Card Input */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            💳 Card Payment (₹)
                          </label>
                          {remaining > 0 && cd === 0 && (
                            <button
                              type="button"
                              onClick={() => setSplitCard(remaining.toFixed(0))}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Fill ₹{remaining.toFixed(0)}
                            </button>
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={grandTotal - c - u}
                          value={splitCard}
                          onChange={(e) => handleCardChange(e.target.value)}
                          placeholder="0"
                          className="h-11 font-bold text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Live Calculation Summary */}
                    <div className={`p-3.5 rounded-xl border flex justify-between items-center ${Math.abs(currentTotal - grandTotal) < 0.01
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                      }`}>
                      <div>
                        <div className="text-xs font-bold">Total Entered: ₹{currentTotal.toFixed(2)}</div>
                        <div className="text-[11px] opacity-80">
                          {Math.abs(currentTotal - grandTotal) < 0.01
                            ? 'Exact Match ✅'
                            : `Remaining to allocate: ₹${(grandTotal - currentTotal).toFixed(2)}`}
                        </div>
                      </div>
                      <span className="text-sm font-extrabold">
                        {Math.abs(currentTotal - grandTotal) < 0.01 ? 'Ready ✅' : `₹${(grandTotal - currentTotal).toFixed(0)} Left`}
                      </span>
                    </div>

                    <Button
                      className="w-full h-13 font-extrabold text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
                      disabled={isProcessing || Math.abs(currentTotal - grandTotal) >= 0.01}
                      onClick={() => handleSplitCheckout(selectedOrder._id)}
                    >
                      {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                      {isProcessing ? "Processing Split..." : "Complete Split Payment"}
                    </Button>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Quick Create VIP / Friend Dialog ── */}
      <CreateCustomerDialog
        isOpen={showCreateCustomerDialog}
        onClose={() => setShowCreateCustomerDialog(false)}
        initialPhone={custPhone}
        initialName={custName}
        onCustomerCreated={(newCust) => {
          setMatchedCustomer(newCust);
          setCustName(newCust.name);
          if (newCust.phone) setCustPhone(newCust.phone);
          if (newCust.discountType && newCust.discountType !== "NONE" && newCust.discountValue) {
            handleApplyCustomerDiscount(newCust);
          }
        }}
      />

      {/* ── Complimentary (FOC) Item Dialog ── */}
      <ComplimentaryItemDialog
        isOpen={showComplimentaryDialog}
        onClose={() => {
          setShowComplimentaryDialog(false);
          setComplimentaryItem(null);
        }}
        item={complimentaryItem}
        onConfirm={handleToggleComplimentary}
      />
    </div>
  );
}

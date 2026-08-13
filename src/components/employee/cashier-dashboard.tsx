"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Calculator, CheckCircle2, Receipt, Search, CreditCard, Banknote, Loader2, UtensilsCrossed, Flame, Smartphone, RotateCcw } from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OrderTakingPanel } from "./order-taking-panel";
import { CashierPickupPanel } from "./cashier-pickup-panel";

interface DashboardProps {
  user: User;
}

interface KotItem {
  _id: string;
  menuItemId: { name: string; station?: string; imageUrl?: string };
  variantPrice: number;
  quantity: number;
  itemStatus: string;
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
    grandTotal: number;
  };
  customerDetails?: { name?: string; phone?: string };
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

export function CashierDashboard({ user }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completedReceiptOrder, setCompletedReceiptOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [mode, setMode] = useState<Mode>("billing");
  const { toast } = useToast();

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

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    if (socket) {
      socket.on("table_status_change", fetchOrders);
      socket.on("order_billed", fetchOrders);
      socket.on("item_status_update", fetchOrders);
    }
    return () => {
      if (socket) {
        socket.off("table_status_change", fetchOrders);
        socket.off("order_billed", fetchOrders);
        socket.off("item_status_update", fetchOrders);
      }
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleGenerateBill = async (orderId: string) => {
    try {
      setIsProcessing(true);
      const response = await employeeService.generateBill(orderId);
      if (response.success) {
        toast({ title: "Bill Generated successfully" });
        setCompletedReceiptOrder(selectedOrder);
        setShowReceipt(true);
        await fetchOrders();
      }
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
      const orderToReceipt = { ...selectedOrder };
      await employeeService.checkoutOrder(orderId, {
        payments: [{ method: paymentMethod, amount: selectedOrder.financials?.grandTotal || 0 }],
      });
      toast({ title: "Payment Successful 🎉", description: "Order settled and table released." });
      setCompletedReceiptOrder(orderToReceipt);
      setShowReceipt(true);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
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
        description: `Order #${selectedOrder?._id?.slice(-4)} tab is now OPEN. Waiters can now add extra items in POS!`,
      });
      await fetchOrders();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Re-open Error", description: error.message || "Failed to re-open order" });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter(o =>
    o._id.slice(-4).includes(searchQuery) ||
    (o.tableId && o.tableId.tableNumber.includes(searchQuery))
  );

  // Live counters for the tab badges
  const readyItemCount = orders.reduce(
    (sum, o) => sum + o.kots.flatMap(k => k.items).filter(i => i.itemStatus === "READY").length,
    0
  );
  const pendingCount = orders.filter(o => o.status === "BILLED").length;

  const activeTab = TABS.find(t => t.id === mode)!;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="font-medium">Loading Cashier Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-slate-50 dark:bg-slate-950 -mx-8 -my-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
      {/* Professional Segmented Tab Bar */}
      <div className="shrink-0 z-20 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;
            const badge = tab.id === "kitchen" ? readyItemCount : tab.id === "billing" ? pendingCount : 0;
            return (
              <Button
                key={tab.id}
                size="sm"
                onClick={() => setMode(tab.id)}
                className={`relative rounded-xl h-11 px-4 md:px-6 text-sm font-extrabold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 scale-105"
                    : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/60"
                }`}
              >
                <Icon className={`mr-2 h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.label.split(" ")[0]}</span>
                {badge > 0 && (
                  <span className={`ml-2.5 px-2 py-0.5 rounded-full text-xs font-black flex items-center justify-center ${
                    isActive ? "bg-white text-blue-700 shadow-sm" : "bg-orange-500 text-white"
                  }`}>
                    {badge}
                  </span>
                )}

                {/* Active Underline Pill Indicator */}
                {isActive && (
                  <span className="absolute -bottom-1 left-4 right-4 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
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
        <div className="flex flex-col md:flex-row flex-1 min-h-0 transition-colors">
          {/* Left: Orders List (Grid Layout) */}
          <div className="w-full flex-1 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 transition-colors">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-500" /> Pending Settlements
                {pendingCount > 0 && (
                  <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white">{pendingCount}</Badge>
                )}
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Search by order # or table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-10">No pending orders.</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {filteredOrders.map(order => (
                    <div
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between h-28 ${
                        selectedOrder?._id === order._id
                          ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">#{order._id?.slice(-4)}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${order.status === "BILLED" ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10"}`}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="mt-auto space-y-1">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {order.orderType === "DINE_IN" ? `Table ${order.tableId?.tableNumber}` : order.orderType}
                        </div>
                        <div className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                          ₹{(() => {
                            if (order.financials?.grandTotal) return order.financials.grandTotal.toFixed(2);
                            if (order.status === "OPEN") {
                              const sub = order.kots.flatMap(k => k.items).reduce((sum, item) => sum + ((item.variantPrice || 0) * item.quantity), 0);
                              return (sub + (sub * 0.05)).toFixed(2);
                            }
                            return "0.00";
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Order Details & Checkout */}
          <div className="md:w-[440px] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors">
            {selectedOrder ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Order #{selectedOrder._id?.slice(-4)}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {selectedOrder.orderType === "DINE_IN" ? `Dine-In • Table ${selectedOrder.tableId?.tableNumber}` : selectedOrder.orderType}
                        {selectedOrder.customerDetails?.name && ` • ${selectedOrder.customerDetails.name}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={`px-4 py-1 text-sm ${selectedOrder.status === "BILLED" ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                      {selectedOrder.status === "BILLED" ? "Bill Generated" : "Active / Unbilled"}
                    </Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                  <div className="max-w-2xl mx-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xl">
                    {(() => {
                      let subtotal = selectedOrder.financials?.subtotal || 0;
                      let totalTax = selectedOrder.financials?.totalTax || 0;
                      let grandTotal = selectedOrder.financials?.grandTotal || 0;

                      if (selectedOrder.status === "OPEN") {
                        subtotal = selectedOrder.kots.flatMap(k => k.items).reduce((sum, item) => sum + ((item.variantPrice || 0) * item.quantity), 0);
                        totalTax = subtotal * 0.05; // default 5% assumption before billing
                        grandTotal = subtotal + totalTax;
                      }

                      return (
                        <>
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Order Items</h3>
                            <div className="space-y-4">
                              {selectedOrder.kots.flatMap(k => k.items).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-3">
                                    {item.menuItemId?.imageUrl && (
                                      <img
                                        src={item.menuItemId.imageUrl}
                                        alt={item.menuItemId?.name}
                                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                                      />
                                    )}
                                    <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">{item.quantity}x</span>
                                    <span className="text-slate-900 dark:text-white">{item.menuItemId?.name || 'Unknown Item'}</span>
                                  </div>
                                  <span className="text-slate-600 dark:text-slate-300">₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                              <span>Subtotal</span>
                              <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                              <span>Tax (5%)</span>
                              <span>₹{totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
                              <span>Total Amount</span>
                              <span className="text-blue-600 dark:text-blue-400">₹{grandTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
                  {selectedOrder.status === "OPEN" ? (
                    <div className="w-full flex justify-end">
                      <Button
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 px-8 text-lg rounded-xl shadow-lg shadow-emerald-900/20"
                        disabled={isProcessing}
                        onClick={() => handleGenerateBill(selectedOrder._id)}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Receipt className="mr-2 h-5 w-5" />}
                        {isProcessing ? "Generating..." : "Generate Bill"}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-4">
                      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto">
                        <Button
                          variant={paymentMethod === "CASH" ? "default" : "ghost"}
                          onClick={() => setPaymentMethod("CASH")}
                          className={`flex-1 lg:flex-none ${paymentMethod === "CASH" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow hover:bg-slate-50 dark:hover:bg-slate-700" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"} rounded-lg h-12`}
                        >
                          <Banknote className="mr-2 h-4 w-4" /> Cash
                        </Button>
                        <Button
                          variant={paymentMethod === "UPI" ? "default" : "ghost"}
                          onClick={() => setPaymentMethod("UPI")}
                          className={`flex-1 lg:flex-none ${paymentMethod === "UPI" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow hover:bg-slate-50 dark:hover:bg-slate-700" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"} rounded-lg h-12`}
                        >
                          <Smartphone className="mr-2 h-4 w-4" /> UPI
                        </Button>
                        <Button
                          variant={paymentMethod === "CARD" ? "default" : "ghost"}
                          onClick={() => setPaymentMethod("CARD")}
                          className={`flex-1 lg:flex-none ${paymentMethod === "CARD" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow hover:bg-slate-50 dark:hover:bg-slate-700" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"} rounded-lg h-12`}
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Card
                        </Button>
                      </div>
                      <div className="flex gap-2 w-full lg:w-auto">
                        <Button
                          variant="outline"
                          className="border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold h-14 px-5 text-sm rounded-xl"
                          disabled={isProcessing}
                          onClick={() => handleReopenOrder(selectedOrder._id)}
                          title="Re-open order tab to add additional items before final payment"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Re-Open Order
                        </Button>
                        <Button
                          size="lg"
                          className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-8 text-lg rounded-xl shadow-lg shadow-blue-900/20"
                          disabled={isProcessing}
                          onClick={() => handleCheckout(selectedOrder._id)}
                        >
                          {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                          {isProcessing ? "Processing..." : "Process Payment"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4">
                <Receipt className="h-20 w-20 opacity-20" />
                <p className="text-xl font-medium">Select an order to view billing details</p>
              </div>
            )}
          </div>

          <ReceiptModal
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
            order={completedReceiptOrder || selectedOrder}
            restaurant={(user as any)?.restaurant}
          />
        </div>
      )}
    </div>
  );
}

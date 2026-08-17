"use client";

import { Button } from "@/components/ui/button";
import {
  Zap,
  Receipt,
  Printer,
  RotateCcw,
  Gift,
  Split,
  UserPlus,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Order } from "./types";

interface CashierActionFooterProps {
  order: Order;
  paymentMethod: string;
  isProcessing: boolean;
  hasCust: boolean;
  getOrderGrandTotal: (ord: Order | null) => number;
  onOpenSplitDialog: () => void;
  onOpenCustomerTab: () => void;
  onQuickCashAndPrint: (orderId: string) => void;
  onGenerateBill: (orderId: string) => void;
  onPrintBill: () => void;
  onReopenOrder: (orderId: string) => void;
  onCheckout: (orderId: string) => void;
}

export function CashierActionFooter({
  order,
  paymentMethod,
  isProcessing,
  hasCust,
  getOrderGrandTotal,
  onOpenSplitDialog,
  onOpenCustomerTab,
  onQuickCashAndPrint,
  onGenerateBill,
  onPrintBill,
  onReopenOrder,
  onCheckout,
}: CashierActionFooterProps) {
  const grandTotal = getOrderGrandTotal(order);

  return (
    <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)]">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Quick Order Summary */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Total Due
          </span>
          <span
            className={`text-xl font-black ${
              grandTotal === 0
                ? "text-purple-600 dark:text-purple-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 ml-auto">
          {order.status === "OPEN" ? (
            <>
              <Button
                variant="outline"
                className="border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-extrabold h-12 px-5 rounded-xl text-sm transition-all"
                disabled={isProcessing}
                onClick={() => onQuickCashAndPrint(order._id)}
                title="1-tap Bill, Pay Cash, and Print Receipt"
              >
                <Zap className="mr-1.5 h-4 w-4 text-amber-500 fill-amber-500" /> Quick Cash & Print
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[180px]"
                disabled={isProcessing}
                onClick={() => onGenerateBill(order._id)}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
                {isProcessing ? "Generating..." : "Generate Bill"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold h-12 px-4 rounded-xl transition-all"
                onClick={onPrintBill}
                title="View and Print Bill Receipt"
              >
                <Printer className="mr-2 h-4 w-4" /> Print Bill
              </Button>
              <Button
                variant="outline"
                className="border-amber-400/60 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold h-12 px-4 rounded-xl transition-all"
                disabled={isProcessing}
                onClick={() => onReopenOrder(order._id)}
                title="Re-open order to add items before payment"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Re-Open Order
              </Button>
              {grandTotal === 0 ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-purple-600/30 hover:shadow-purple-600/45 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[220px]"
                  disabled={isProcessing}
                  onClick={() => onCheckout(order._id)}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                  {isProcessing ? "Settling..." : "Settle Complimentary (₹0.00)"}
                </Button>
              ) : paymentMethod === "PART" ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-blue-600/30 hover:shadow-blue-600/45 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[200px]"
                  onClick={onOpenSplitDialog}
                >
                  <Split className="mr-2 h-4 w-4" /> Configure Split
                </Button>
              ) : paymentMethod === "CREDIT" ? (
                !hasCust ? (
                  <Button
                    size="lg"
                    className="bg-amber-600/90 hover:bg-amber-600 text-white font-extrabold h-12 px-6 text-sm rounded-xl shadow-md shadow-amber-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[220px]"
                    onClick={onOpenCustomerTab}
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Link Customer to Settle Credit
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-amber-600/30 hover:shadow-amber-600/45 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[220px]"
                    disabled={isProcessing}
                    onClick={() => onCheckout(order._id)}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    {isProcessing ? "Processing..." : `Settle on Credit (₹${grandTotal.toFixed(0)})`}
                  </Button>
                )
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold h-12 px-8 text-sm rounded-xl shadow-md shadow-blue-600/30 hover:shadow-blue-600/45 hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[220px]"
                  disabled={isProcessing}
                  onClick={() => onCheckout(order._id)}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isProcessing
                    ? "Processing..."
                    : `Collect ${
                        paymentMethod === "CASH"
                          ? "💵 Cash"
                          : paymentMethod === "UPI"
                          ? "📱 UPI"
                          : "💳 Card"
                      } ₹${grandTotal.toFixed(0)}`}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

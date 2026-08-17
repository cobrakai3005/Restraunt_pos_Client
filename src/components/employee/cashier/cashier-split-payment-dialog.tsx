"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Split, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { Order } from "./types";

interface CashierSplitPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: Order | null;
  grandTotal: number;
  hasCust: boolean;
  splitCash: string;
  setSplitCash: (val: string) => void;
  splitUpi: string;
  setSplitUpi: (val: string) => void;
  splitCard: string;
  setSplitCard: (val: string) => void;
  splitCredit: string;
  setSplitCredit: (val: string) => void;
  isProcessing: boolean;
  onSplitCheckout: (orderId: string) => void;
  onOpenCustomerTab: () => void;
}

export function CashierSplitPaymentDialog({
  isOpen,
  onOpenChange,
  selectedOrder,
  grandTotal,
  hasCust,
  splitCash,
  setSplitCash,
  splitUpi,
  setSplitUpi,
  splitCard,
  setSplitCard,
  splitCredit,
  setSplitCredit,
  isProcessing,
  onSplitCheckout,
  onOpenCustomerTab,
}: CashierSplitPaymentDialogProps) {
  if (!selectedOrder) return null;

  const c = parseFloat(splitCash) || 0;
  const u = parseFloat(splitUpi) || 0;
  const cd = parseFloat(splitCard) || 0;
  const cr = parseFloat(splitCredit) || 0;
  const currentTotal = c + u + cd + cr;
  const remaining = Math.max(0, grandTotal - currentTotal);

  const handleCashChange = (valStr: string) => {
    if (valStr === "") return setSplitCash("");
    const val = Math.max(0, parseFloat(valStr) || 0);
    const maxAllowed = Math.max(0, grandTotal - u - cd - cr);
    setSplitCash(Math.min(val, maxAllowed).toString());
  };

  const handleUpiChange = (valStr: string) => {
    if (valStr === "") return setSplitUpi("");
    const val = Math.max(0, parseFloat(valStr) || 0);
    const maxAllowed = Math.max(0, grandTotal - c - cd - cr);
    setSplitUpi(Math.min(val, maxAllowed).toString());
  };

  const handleCardChange = (valStr: string) => {
    if (valStr === "") return setSplitCard("");
    const val = Math.max(0, parseFloat(valStr) || 0);
    const maxAllowed = Math.max(0, grandTotal - c - u - cr);
    setSplitCard(Math.min(val, maxAllowed).toString());
  };

  const handleCreditChange = (valStr: string) => {
    if (valStr === "") return setSplitCredit("");
    const val = Math.max(0, parseFloat(valStr) || 0);
    const maxAllowed = Math.max(0, grandTotal - c - u - cd);
    setSplitCredit(Math.min(val, maxAllowed).toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Split className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Multi-Payment & Credit Allocation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order Grand Total</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

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
                max={grandTotal - u - cd - cr}
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
                max={grandTotal - c - cd - cr}
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
                max={grandTotal - c - u - cr}
                value={splitCard}
                onChange={(e) => handleCardChange(e.target.value)}
                placeholder="0"
                className="h-11 font-bold text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Credit / Khata Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  📋 Credit / Khata (₹)
                  {!hasCust && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-full">
                      Customer Required
                    </span>
                  )}
                </label>
                {hasCust && remaining > 0 && cr === 0 && (
                  <button
                    type="button"
                    onClick={() => setSplitCredit(remaining.toFixed(0))}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Fill ₹{remaining.toFixed(0)}
                  </button>
                )}
              </div>
              {!hasCust ? (
                <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="font-bold leading-relaxed">
                    A registered customer or customer phone number is required to settle this order on Credit / Khata.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenCustomerTab();
                    }}
                    className="h-7 text-[11px] font-extrabold border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Link / Register Customer
                  </Button>
                </div>
              ) : (
                <Input
                  type="number"
                  min={0}
                  max={grandTotal - c - u - cd}
                  value={splitCredit}
                  onChange={(e) => handleCreditChange(e.target.value)}
                  placeholder="0"
                  className="h-11 font-bold text-base bg-white dark:bg-slate-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-xl"
                />
              )}
            </div>
          </div>

          {/* Breakdown pill */}
          <div className="flex justify-between items-center text-xs font-bold px-1 text-slate-500 dark:text-slate-400">
            <span>Immediate: ₹{(c + u + cd).toFixed(2)}</span>
            <span className="text-amber-600 dark:text-amber-400">Credit Balance: ₹{cr.toFixed(2)}</span>
          </div>

          {/* Live Calculation Summary */}
          <div
            className={`p-3.5 rounded-xl border flex justify-between items-center ${
              Math.abs(currentTotal - grandTotal) < 0.01
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}
          >
            <div>
              <div className="text-xs font-bold">Total Allocated: ₹{currentTotal.toFixed(2)}</div>
              <div className="text-[11px] opacity-80">
                {Math.abs(currentTotal - grandTotal) < 0.01
                  ? "Exact Match ✅"
                  : `Remaining to allocate: ₹${(grandTotal - currentTotal).toFixed(2)}`}
              </div>
            </div>
            <span className="text-sm font-extrabold">
              {Math.abs(currentTotal - grandTotal) < 0.01 ? "Ready ✅" : `₹${(grandTotal - currentTotal).toFixed(0)} Left`}
            </span>
          </div>

          <Button
            className="w-full h-13 font-extrabold text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            disabled={isProcessing || Math.abs(currentTotal - grandTotal) >= 0.01}
            onClick={() => onSplitCheckout(selectedOrder._id)}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
            {isProcessing ? "Processing..." : "Complete Checkout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

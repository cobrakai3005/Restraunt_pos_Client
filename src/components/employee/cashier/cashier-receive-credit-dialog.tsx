"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Check } from "lucide-react";
import { Order } from "./types";

interface CashierReceiveCreditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  creditPaymentMode: "SINGLE" | "SPLIT";
  setCreditPaymentMode: (mode: "SINGLE" | "SPLIT") => void;
  creditPaymentAmount: string;
  setCreditPaymentAmount: (amt: string) => void;
  creditPaymentMethod: "CASH" | "UPI" | "CARD" | "OTHER";
  setCreditPaymentMethod: (m: "CASH" | "UPI" | "CARD" | "OTHER") => void;
  creditPaymentNotes: string;
  setCreditPaymentNotes: (notes: string) => void;
  creditSplitCash: string;
  setCreditSplitCash: (v: string) => void;
  creditSplitUpi: string;
  setCreditSplitUpi: (v: string) => void;
  creditSplitCard: string;
  setCreditSplitCard: (v: string) => void;
  creditSplitOther: string;
  setCreditSplitOther: (v: string) => void;
  isSubmittingCreditPayment: boolean;
  onCollectCreditPayment: () => void;
}

export function CashierReceiveCreditDialog({
  isOpen,
  onOpenChange,
  order,
  creditPaymentMode,
  setCreditPaymentMode,
  creditPaymentAmount,
  setCreditPaymentAmount,
  creditPaymentMethod,
  setCreditPaymentMethod,
  creditPaymentNotes,
  setCreditPaymentNotes,
  creditSplitCash,
  setCreditSplitCash,
  creditSplitUpi,
  setCreditSplitUpi,
  creditSplitCard,
  setCreditSplitCard,
  creditSplitOther,
  setCreditSplitOther,
  isSubmittingCreditPayment,
  onCollectCreditPayment,
}: CashierReceiveCreditDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Receive Credit Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
            <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300">
              <span>Order / Invoice</span>
              <span className="font-mono font-bold">#ORD-{order._id.slice(-4).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300">
              <span>Customer</span>
              <span className="font-bold">{order.customerDetails?.name || "Walk-in Guest"}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300">
              <span>Grand Total</span>
              <span className="font-bold">₹{order.financials?.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300">
              <span>Paid so far</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ₹{(order.financials?.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
              <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100">Outstanding Credit</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                ₹{(order.financials?.dueAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setCreditPaymentMode("SINGLE")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                creditPaymentMode === "SINGLE"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Single Method
            </button>
            <button
              type="button"
              onClick={() => setCreditPaymentMode("SPLIT")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                creditPaymentMode === "SPLIT"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🔀 Split / Multi-Tender
            </button>
          </div>

          {creditPaymentMode === "SINGLE" ? (
            <>
              {/* Amount input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Amount to Collect (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreditPaymentAmount(String(order.financials?.dueAmount || 0))}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Pay Full ₹{(order.financials?.dueAmount || 0).toFixed(0)}
                  </button>
                </div>
                <Input
                  type="number"
                  min="1"
                  max={order.financials?.dueAmount || 0}
                  value={creditPaymentAmount}
                  onChange={(e) => setCreditPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-11 font-bold text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Payment method selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Received Via
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["CASH", "UPI", "CARD", "OTHER"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCreditPaymentMethod(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                        creditPaymentMethod === m
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {m === "CASH" ? "💵 Cash" : m === "UPI" ? "📱 UPI" : m === "CARD" ? "💳 Card" : "📄 Other"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ── Split Payments Breakdown ── */
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Allocate Split Payment
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const due = order.financials?.dueAmount || 0;
                    setCreditSplitCash(String(due));
                    setCreditSplitUpi("");
                    setCreditSplitCard("");
                    setCreditSplitOther("");
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Fill All in Cash
                </button>
              </div>

              {/* Cash */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs font-bold text-slate-700 dark:text-slate-300">💵 Cash</span>
                <Input
                  type="number"
                  min="0"
                  value={creditSplitCash}
                  onChange={(e) => setCreditSplitCash(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const due = order.financials?.dueAmount || 0;
                    const otherAlloc =
                      (parseFloat(creditSplitUpi) || 0) +
                      (parseFloat(creditSplitCard) || 0) +
                      (parseFloat(creditSplitOther) || 0);
                    setCreditSplitCash(String(Math.max(0, due - otherAlloc)));
                  }}
                  className="h-9 px-2 text-[10px] font-bold text-amber-600"
                >
                  Fill Rem.
                </Button>
              </div>

              {/* UPI */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs font-bold text-slate-700 dark:text-slate-300">📱 UPI</span>
                <Input
                  type="number"
                  min="0"
                  value={creditSplitUpi}
                  onChange={(e) => setCreditSplitUpi(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const due = order.financials?.dueAmount || 0;
                    const otherAlloc =
                      (parseFloat(creditSplitCash) || 0) +
                      (parseFloat(creditSplitCard) || 0) +
                      (parseFloat(creditSplitOther) || 0);
                    setCreditSplitUpi(String(Math.max(0, due - otherAlloc)));
                  }}
                  className="h-9 px-2 text-[10px] font-bold text-amber-600"
                >
                  Fill Rem.
                </Button>
              </div>

              {/* Card */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs font-bold text-slate-700 dark:text-slate-300">💳 Card</span>
                <Input
                  type="number"
                  min="0"
                  value={creditSplitCard}
                  onChange={(e) => setCreditSplitCard(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const due = order.financials?.dueAmount || 0;
                    const otherAlloc =
                      (parseFloat(creditSplitCash) || 0) +
                      (parseFloat(creditSplitUpi) || 0) +
                      (parseFloat(creditSplitOther) || 0);
                    setCreditSplitCard(String(Math.max(0, due - otherAlloc)));
                  }}
                  className="h-9 px-2 text-[10px] font-bold text-amber-600"
                >
                  Fill Rem.
                </Button>
              </div>

              {/* Other */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs font-bold text-slate-700 dark:text-slate-300">📄 Other</span>
                <Input
                  type="number"
                  min="0"
                  value={creditSplitOther}
                  onChange={(e) => setCreditSplitOther(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const due = order.financials?.dueAmount || 0;
                    const otherAlloc =
                      (parseFloat(creditSplitCash) || 0) +
                      (parseFloat(creditSplitUpi) || 0) +
                      (parseFloat(creditSplitCard) || 0);
                    setCreditSplitOther(String(Math.max(0, due - otherAlloc)));
                  }}
                  className="h-9 px-2 text-[10px] font-bold text-amber-600"
                >
                  Fill Rem.
                </Button>
              </div>

              {/* Split Summary Bar */}
              {(() => {
                const c = parseFloat(creditSplitCash) || 0;
                const u = parseFloat(creditSplitUpi) || 0;
                const cd = parseFloat(creditSplitCard) || 0;
                const o = parseFloat(creditSplitOther) || 0;
                const totalSplit = c + u + cd + o;
                const due = order.financials?.dueAmount || 0;
                const isExceeding = totalSplit > due;

                return (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-bold flex justify-between items-center ${
                      isExceeding
                        ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                    }`}
                  >
                    <span>Total Split Allocated:</span>
                    <span>
                      ₹{totalSplit.toFixed(2)} / ₹{due.toFixed(2)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </label>
            <Input
              type="text"
              value={creditPaymentNotes}
              onChange={(e) => setCreditPaymentNotes(e.target.value)}
              placeholder="e.g., GPay ref #1234, split payment noted"
              className="h-10 text-xs rounded-xl"
            />
          </div>

          {(() => {
            const totalAmt =
              creditPaymentMode === "SINGLE"
                ? parseFloat(creditPaymentAmount) || 0
                : (parseFloat(creditSplitCash) || 0) +
                  (parseFloat(creditSplitUpi) || 0) +
                  (parseFloat(creditSplitCard) || 0) +
                  (parseFloat(creditSplitOther) || 0);

            const due = order.financials?.dueAmount || 0;
            const isDisabled = isSubmittingCreditPayment || totalAmt <= 0 || totalAmt > due;

            return (
              <Button
                className="w-full h-12 font-extrabold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl shadow-md disabled:opacity-50"
                disabled={isDisabled}
                onClick={onCollectCreditPayment}
              >
                {isSubmittingCreditPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isSubmittingCreditPayment
                  ? "Recording Payment..."
                  : `Confirm Credit Collection ₹${totalAmt.toFixed(2)}`}
              </Button>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

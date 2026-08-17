"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, Check } from "lucide-react";
import { Order } from "./types";

interface CollectDuePaymentDialogProps {
  order: Order | null;
  onClose: () => void;
  collectMode: "SINGLE" | "SPLIT";
  setCollectMode: (mode: "SINGLE" | "SPLIT") => void;
  collectAmount: string;
  setCollectAmount: (amount: string) => void;
  collectMethod: "CASH" | "UPI" | "CARD" | "OTHER";
  setCollectMethod: (method: "CASH" | "UPI" | "CARD" | "OTHER") => void;
  collectSplitCash: string;
  setCollectSplitCash: (v: string) => void;
  collectSplitUpi: string;
  setCollectSplitUpi: (v: string) => void;
  collectSplitCard: string;
  setCollectSplitCard: (v: string) => void;
  collectSplitOther: string;
  setCollectSplitOther: (v: string) => void;
  collectNotes: string;
  setCollectNotes: (v: string) => void;
  isSubmittingPayment: boolean;
  onSubmit: () => void;
}

export function CollectDuePaymentDialog({
  order,
  onClose,
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
  onSubmit,
}: CollectDuePaymentDialogProps) {
  if (!order) return null;

  const due = order.financials?.dueAmount || 0;
  const totalAmt =
    collectMode === "SINGLE"
      ? parseFloat(collectAmount) || 0
      : (parseFloat(collectSplitCash) || 0) +
        (parseFloat(collectSplitUpi) || 0) +
        (parseFloat(collectSplitCard) || 0) +
        (parseFloat(collectSplitOther) || 0);

  const isDisabled = isSubmittingPayment || totalAmt <= 0 || totalAmt > due;

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            Receive Credit Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Box */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
            <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
              <span>Invoice #</span>
              <span className="font-mono font-bold">#ORD-{order._id.slice(-4).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
              <span>Customer</span>
              <span className="font-bold">{order.customerDetails?.name || "Walk-in Guest"}</span>
            </div>
            <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
              <span>Total Order Bill</span>
              <span className="font-bold">₹{order.financials?.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
              <span>Paid so far</span>
              <span className="font-bold text-emerald-600">
                ₹{(order.financials?.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
              <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100">
                Outstanding Credit
              </span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300">
                ₹{due.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setCollectMode("SINGLE")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                collectMode === "SINGLE"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Single Method
            </button>
            <button
              type="button"
              onClick={() => setCollectMode("SPLIT")}
              className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                collectMode === "SPLIT"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🔀 Split / Multi-Tender
            </button>
          </div>

          {collectMode === "SINGLE" ? (
            <>
              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Amount to Collect (₹)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(String(due))}
                    className="text-[10px] font-bold text-amber-600 hover:underline"
                  >
                    Pay Full ₹{due.toFixed(0)}
                  </button>
                </div>
                <Input
                  type="number"
                  min="1"
                  max={due}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-11 font-bold text-base rounded-xl"
                />
              </div>

              {/* Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Received Via</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["CASH", "UPI", "CARD", "OTHER"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCollectMethod(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                        collectMethod === m
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
            /* Split Breakdown */
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Allocate Split Payment</span>
                <button
                  type="button"
                  onClick={() => {
                    setCollectSplitCash(String(due));
                    setCollectSplitUpi("");
                    setCollectSplitCard("");
                    setCollectSplitOther("");
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
                  value={collectSplitCash}
                  onChange={(e) => setCollectSplitCash(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const otherAlloc =
                      (parseFloat(collectSplitUpi) || 0) +
                      (parseFloat(collectSplitCard) || 0) +
                      (parseFloat(collectSplitOther) || 0);
                    setCollectSplitCash(String(Math.max(0, due - otherAlloc)));
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
                  value={collectSplitUpi}
                  onChange={(e) => setCollectSplitUpi(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const otherAlloc =
                      (parseFloat(collectSplitCash) || 0) +
                      (parseFloat(collectSplitCard) || 0) +
                      (parseFloat(collectSplitOther) || 0);
                    setCollectSplitUpi(String(Math.max(0, due - otherAlloc)));
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
                  value={collectSplitCard}
                  onChange={(e) => setCollectSplitCard(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const otherAlloc =
                      (parseFloat(collectSplitCash) || 0) +
                      (parseFloat(collectSplitUpi) || 0) +
                      (parseFloat(collectSplitOther) || 0);
                    setCollectSplitCard(String(Math.max(0, due - otherAlloc)));
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
                  value={collectSplitOther}
                  onChange={(e) => setCollectSplitOther(e.target.value)}
                  placeholder="0.00"
                  className="h-9 text-xs font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const otherAlloc =
                      (parseFloat(collectSplitCash) || 0) +
                      (parseFloat(collectSplitUpi) || 0) +
                      (parseFloat(collectSplitCard) || 0);
                    setCollectSplitOther(String(Math.max(0, due - otherAlloc)));
                  }}
                  className="h-9 px-2 text-[10px] font-bold text-amber-600"
                >
                  Fill Rem.
                </Button>
              </div>

              {/* Split Summary Bar */}
              {(() => {
                const isExceeding = totalAmt > due;
                return (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-bold flex justify-between items-center ${
                      isExceeding
                        ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                    }`}
                  >
                    <span>Total Split Allocated:</span>
                    <span>₹{totalAmt.toFixed(2)} / ₹{due.toFixed(2)}</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes (Optional)</Label>
            <Input
              type="text"
              value={collectNotes}
              onChange={(e) => setCollectNotes(e.target.value)}
              placeholder="e.g., Reference number / received by"
              className="h-10 text-xs rounded-xl"
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12 font-extrabold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl shadow-md disabled:opacity-50"
            disabled={isDisabled}
            onClick={onSubmit}
          >
            {isSubmittingPayment ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isSubmittingPayment ? "Processing..." : `Confirm Collection ₹${totalAmt.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Tag,
  Sparkles,
  CheckCircle2,
  Percent,
  Loader2,
} from "lucide-react";
import { Customer } from "@/services/customer.service";
import { Order } from "./types";

interface CashierDiscountTabProps {
  selectedOrder: Order;
  matchedCustomer: Customer | null;
  discountAmount: string;
  setDiscountAmount: (val: string) => void;
  isSavingDiscount: boolean;
  onApplyCustomerDiscount: (cust: Customer) => void;
  onUpdateDiscount: (customDisc?: number) => void;
}

export function CashierDiscountTab({
  selectedOrder,
  matchedCustomer,
  discountAmount,
  setDiscountAmount,
  isSavingDiscount,
  onApplyCustomerDiscount,
  onUpdateDiscount,
}: CashierDiscountTabProps) {
  const isDiscountLocked = selectedOrder.status === "BILLED" || selectedOrder.status === "PAID";
  let dSubtotal = selectedOrder.financials?.subtotal ?? 0;
  let dTax = selectedOrder.financials?.totalTax ?? 0;
  let dGrand = selectedOrder.financials?.grandTotal ?? 0;

  if (selectedOrder.status === "OPEN" || dSubtotal === 0) {
    dSubtotal = selectedOrder.kots
      .flatMap((k: any) => k.items)
      .reduce(
        (sum: number, item: any) =>
          sum + (item.isComplimentary ? 0 : (item.variantPrice || 0) * item.quantity),
        0
      );
    dTax = selectedOrder.kots
      .flatMap((k: any) => k.items)
      .reduce(
        (sum: number, item: any) =>
          sum +
          (item.isComplimentary
            ? 0
            : ((item.variantPrice || 0) * item.quantity * (item.taxPercentage || 0)) / 100),
        0
      );
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
        {matchedCustomer &&
          matchedCustomer.discountType &&
          matchedCustomer.discountType !== "NONE" &&
          (matchedCustomer.discountValue || 0) > 0 &&
          !isDiscountLocked && (
            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {matchedCustomer.tags || "Customer"} Discount Profile
                </span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  {matchedCustomer.discountType === "PERCENTAGE"
                    ? `${matchedCustomer.discountValue}% OFF`
                    : `₹${matchedCustomer.discountValue} OFF`}
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Customer <strong>{matchedCustomer.name}</strong> is entitled to a{" "}
                {matchedCustomer.discountType === "PERCENTAGE"
                  ? `${matchedCustomer.discountValue}%`
                  : `₹${matchedCustomer.discountValue}`}{" "}
                waiver.
              </p>
              <Button
                type="button"
                size="sm"
                disabled={isSavingDiscount}
                onClick={() => onApplyCustomerDiscount(matchedCustomer)}
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
                - ₹{selectedOrder.financials!.discount!.toFixed(2)}
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
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1.5">
              Quick % Off
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20].map((pct) => {
                const calculatedAmt = Math.round((dSubtotal * pct) / 100);
                const isSelected = discountAmount === String(calculatedAmt);
                return (
                  <button
                    key={`pct-${pct}`}
                    type="button"
                    disabled={isDiscountLocked}
                    onClick={() => setDiscountAmount(String(calculatedAmt))}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
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
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1.5">
              Quick Flat ₹ Off
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 50, 100].map((amt) => (
                <button
                  key={`flat-${amt}`}
                  type="button"
                  disabled={isDiscountLocked}
                  onClick={() => setDiscountAmount(String(amt))}
                  className={`px-4 py-1.5 rounded-xl border text-xs font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    discountAmount === String(amt)
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
            onClick={() => onUpdateDiscount()}
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
            onClick={() => onUpdateDiscount(0)}
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Remove Discount
          </button>
        )}
      </div>
    </div>
  );
}

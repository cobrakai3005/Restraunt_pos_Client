"use client";

import { Percent } from "lucide-react";
import { Order } from "./types";

interface CashierBillSummaryProps {
  order: Order;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
}

export function CashierBillSummary({
  order,
  subtotal,
  totalTax,
  grandTotal,
}: CashierBillSummaryProps) {
  const discount = order.financials?.discount ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Bill Breakdown
        </span>
        <span className="text-xs font-bold text-slate-400">
          #ORD-{order._id.slice(-4).toUpperCase()}
        </span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex justify-between px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
          <span>GST / Tax</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            ₹{totalTax.toFixed(2)}
          </span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between px-5 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Percent className="h-3.5 w-3.5" /> Discount
            </span>
            <span className="font-bold">- ₹{discount.toFixed(2)}</span>
          </div>
        ) : (
          <div className="flex justify-between px-5 py-3 text-sm text-slate-400 dark:text-slate-600">
            <span>Discount</span>
            <span className="font-semibold text-slate-400 dark:text-slate-500">—</span>
          </div>
        )}
        <div className="flex justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/40">
          <span className="text-base font-extrabold text-slate-900 dark:text-white">Total</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Banknote, Smartphone, CreditCard, FileText, Split } from "lucide-react";
import { Order } from "./types";

interface CashierPaymentMethodsProps {
  order: Order;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  hasCust: boolean;
  onOpenSplitDialog: () => void;
  onOpenCustomerTab: () => void;
}

export function CashierPaymentMethods({
  paymentMethod,
  setPaymentMethod,
  hasCust,
  onOpenSplitDialog,
  onOpenCustomerTab,
}: CashierPaymentMethodsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Payment Method
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { id: "CASH", label: "Cash", icon: Banknote, enabled: true },
            { id: "UPI", label: "UPI", icon: Smartphone, enabled: true },
            { id: "CARD", label: "Card", icon: CreditCard, enabled: true },
            { id: "CREDIT", label: "Credit (Khata)", icon: FileText, enabled: true },
            { id: "PART", label: "Part / Split", icon: Split, enabled: true },
          ].map((method) => {
            const Icon = method.icon;
            const isActive = paymentMethod === method.id;
            const isCreditMethod = method.id === "CREDIT";
            const isCreditDisabled = isCreditMethod && !hasCust;

            return (
              <button
                key={method.id}
                disabled={!method.enabled}
                onClick={() => {
                  if (method.id === "PART") {
                    onOpenSplitDialog();
                  } else if (isCreditDisabled) {
                    onOpenCustomerTab();
                  } else if (method.enabled) {
                    setPaymentMethod(method.id);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center relative ${
                  !method.enabled || isCreditDisabled
                    ? "opacity-40 cursor-not-allowed border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"
                    : isActive
                    ? method.id === "CREDIT"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md shadow-amber-500/10 cursor-pointer"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10 cursor-pointer"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isActive
                      ? method.id === "CREDIT"
                        ? "border-amber-500"
                        : "border-blue-500"
                      : isCreditDisabled
                      ? "border-slate-300 dark:border-slate-600 opacity-60"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {isActive && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        method.id === "CREDIT" ? "bg-amber-500" : "bg-blue-500"
                      }`}
                    />
                  )}
                </span>
                {Icon && (
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? method.id === "CREDIT"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-blue-600 dark:text-blue-400"
                        : isCreditDisabled
                        ? "text-slate-400"
                        : isCreditMethod
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                )}
                <span
                  className={`text-[11px] font-bold ${
                    isActive
                      ? method.id === "CREDIT"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-blue-700 dark:text-blue-300"
                      : isCreditDisabled
                      ? "text-slate-400 dark:text-slate-500"
                      : isCreditMethod
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {method.label}
                </span>
                {isCreditDisabled && (
                  <span className="text-[8px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-full mt-0.5">
                    Link Customer
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Chips */}
      <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenSplitDialog}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:from-blue-500/20 hover:to-indigo-500/20 transition-all active:scale-95 shadow-xs"
        >
          <Split className="h-3.5 w-3.5" /> Multi-Payment (Cash + UPI + Credit)
        </button>

        {[
          { label: "🎁 BOGO Offer", coming: true },
          { label: "⭐ Loyalty Points", coming: true },
        ].map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
          >
            {f.label}
            <span className="text-[8px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

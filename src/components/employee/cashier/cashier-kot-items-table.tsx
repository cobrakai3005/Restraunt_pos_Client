"use client";

import { Gift } from "lucide-react";
import { Order, KotItem } from "./types";

interface CashierKotItemsTableProps {
  order: Order;
  onToggleComplimentaryDialog: (item: KotItem) => void;
}

export function CashierKotItemsTable({
  order,
  onToggleComplimentaryDialog,
}: CashierKotItemsTableProps) {
  const isCompLocked = order.status === "BILLED" || order.status === "PAID";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
      <div className="grid grid-cols-[1fr_70px_100px_85px] gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 items-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Item
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">
          Qty
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">
          Price
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">
          Action
        </span>
      </div>

      {order.kots?.map((kot, kotIdx) => (
        <div key={kotIdx}>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              KOT {kotIdx + 1}
            </span>
          </div>
          {kot.items.map((item, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[1fr_70px_100px_85px] gap-2 px-4 py-3 items-center ${
                idx < kot.items.length - 1 ? "border-b border-slate-100 dark:border-slate-800/60" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.menuItemId?.imageUrl && (
                  <img
                    src={item.menuItemId.imageUrl}
                    alt={item.menuItemId.name}
                    className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {item.menuItemId?.name || "Item"}
                    </span>
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
                <span
                  className={`shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    item.itemStatus === "SERVED"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                      : item.itemStatus === "READY"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : item.itemStatus === "PREPARING"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {item.itemStatus}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white">
                  {item.quantity}
                </span>
              </div>
              <div className="text-right">
                {item.isComplimentary ? (
                  <div>
                    <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">
                      ₹0.00
                    </span>
                    <div className="text-[10px] text-slate-400 line-through">
                      ₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      ₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}
                    </span>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        ₹{(item.variantPrice || 0).toFixed(2)} each
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isCompLocked}
                  onClick={() => {
                    if (isCompLocked) return;
                    onToggleComplimentaryDialog(item);
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
                      ? "Complimentary status locked (Bill generated)"
                      : "Toggle Free of Charge (FOC)"
                  }
                >
                  <Gift className="w-3 h-3" />
                  {item.isComplimentary ? "Comp ✓" : "Comp"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

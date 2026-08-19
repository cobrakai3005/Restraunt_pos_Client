"use client";

import React from "react";
import { RotateCcw, Receipt, Loader2, ShoppingBag, ChevronRight } from "lucide-react";
import { CartItem } from "./types";

interface FloatingActionButtonsProps {
  cart: CartItem[];
  cartFlash: boolean;
  selectedTable: string;
  customerName: string;
  customerPhone: string;
  onResetAll: () => void;
  onQuickReceipt: () => void;
  isQuickReceiptSubmitting: boolean;
  onPlaceOrder: () => void;
  isSubmitting: boolean;
  onOpenCart: () => void;
  total: number;
}

export function FloatingActionButtons({
  cart,
  cartFlash,
  selectedTable,
  customerName,
  customerPhone,
  onResetAll,
  onQuickReceipt,
  isQuickReceiptSubmitting,
  onPlaceOrder,
  isSubmitting,
  onOpenCart,
  total,
}: FloatingActionButtonsProps) {
  const totalCartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className={`absolute bottom-6 right-6 z-30 flex items-center gap-2 transition-all duration-300 ${
        cartFlash ? "scale-105" : ""
      }`}
    >
      {/* Reset / Unselect All Button */}
      {(cart.length > 0 || selectedTable || customerName || customerPhone) && (
        <button
          onClick={onResetAll}
          title="Unselect items, clear table & reset order details"
          className="flex items-center justify-center h-14 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-extrabold text-xs transition-all active:scale-95 shadow-lg backdrop-blur-md gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Reset Order</span>
        </button>
      )}

      {/* Quick Receipt FAB */}
      <button
        onClick={onQuickReceipt}
        disabled={cart.length === 0 || isSubmitting || isQuickReceiptSubmitting}
        title="Create Order & Print Receipt Instantly"
        className={`flex items-center gap-2 px-4 h-14 rounded-2xl shadow-2xl font-extrabold text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
          cart.length > 0 && !isSubmitting && !isQuickReceiptSubmitting
            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40 ring-2 ring-emerald-400/50"
            : "bg-slate-600/70 shadow-slate-900/20"
        }`}
      >
        {isQuickReceiptSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Receipt className="h-5 w-5" />
        )}
        <span className="text-sm">{isQuickReceiptSubmitting ? "Printing..." : "Quick Receipt"}</span>
      </button>

      {/* Fire to Kitchen FAB */}
      <button
        onClick={onPlaceOrder}
        disabled={cart.length === 0 || !selectedTable || isSubmitting || isQuickReceiptSubmitting}
        className={`flex items-center gap-2 px-4 h-14 rounded-2xl shadow-2xl font-extrabold text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
          cart.length > 0 && !isSubmitting && !isQuickReceiptSubmitting
            ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/40"
            : "bg-slate-600/70 shadow-slate-900/20"
        }`}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span className="text-base">🔥</span>
        )}
        <span className="text-sm">{isSubmitting ? "Firing..." : "Fire"}</span>
      </button>

      {/* Cart / Review FAB */}
      <button
        onClick={onOpenCart}
        className={`flex items-center gap-2.5 px-5 h-14 rounded-2xl shadow-2xl font-extrabold text-white transition-all duration-300 active:scale-95 ${
          cart.length > 0
            ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/40"
            : "bg-slate-700/80 hover:bg-slate-600/80 shadow-slate-900/30"
        } ${cartFlash ? "ring-4 ring-blue-400/60" : ""}`}
      >
        <ShoppingBag className="h-5 w-5 shrink-0" />
        <span className="text-sm">
          {cart.length === 0 ? "Cart" : `${totalCartCount} item${totalCartCount !== 1 ? "s" : ""}`}
        </span>
        {cart.length > 0 && (
          <span className="bg-white text-blue-600 text-xs font-extrabold px-2 py-0.5 rounded-full">
            ₹{total.toFixed(0)}
          </span>
        )}
        <ChevronRight className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Trash2,
  X,
  Users,
  UserX,
  Heart,
  Star,
  Briefcase,
  UtensilsCrossed,
  Minus,
  Plus,
  Receipt,
  Loader2,
} from "lucide-react";
import { Customer } from "@/services/customer.service";
import { CartItem, Table, Order, PRESET_COOKING_NOTES } from "./types";

interface CartDrawerProps {
  cartOpen: boolean;
  onCloseCart: () => void;
  cart: CartItem[];
  selectedTable: string;
  onResetAll: () => void;
  orderType: "DINE_IN" | "TAKEAWAY";
  onSetOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;
  tables: Table[];
  activeOrders: Order[];
  onSelectTable: (tableId: string) => void;
  guestCount: number;
  onUpdateGuestCount: (delta: number) => void;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  matchedCustomer: Customer | null;
  onClearCustomer: () => void;
  getItemUnitPrice: (item: CartItem) => number;
  updateNotes: (cartId: string, notes: string) => void;
  togglePresetNote: (cartId: string, preset: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  subtotal: number;
  taxes: number;
  effectiveTaxPct: string;
  total: number;
  isSubmitting: boolean;
  isQuickReceiptSubmitting: boolean;
  onQuickReceipt: () => Promise<void>;
  onPlaceOrder: () => Promise<void>;
}

export function CartDrawer({
  cartOpen,
  onCloseCart,
  cart,
  selectedTable,
  onResetAll,
  orderType,
  onSetOrderType,
  tables,
  activeOrders,
  onSelectTable,
  guestCount,
  onUpdateGuestCount,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  matchedCustomer,
  onClearCustomer,
  getItemUnitPrice,
  updateNotes,
  togglePresetNote,
  updateQuantity,
  removeFromCart,
  subtotal,
  taxes,
  effectiveTaxPct,
  total,
  isSubmitting,
  isQuickReceiptSubmitting,
  onQuickReceipt,
  onPlaceOrder,
}: CartDrawerProps) {
  const existingOrder = activeOrders.find(
    (o) =>
      (o.tableId?._id === selectedTable || (o as any).tableId === selectedTable) &&
      o.status === "OPEN"
  );
  const hasExistingItems = existingOrder && existingOrder.kots && existingOrder.kots.length > 0;
  const totalCartQty = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      {/* ── Cart Backdrop ── */}
      {cartOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
          onClick={onCloseCart}
        />
      )}

      {/* ── Cart Slide-out Drawer ── */}
      <div
        className={`absolute top-0 right-0 h-full z-40 flex flex-col
          w-[340px] lg:w-[360px]
          bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl
          border-l border-white/30 dark:border-slate-800/60
          shadow-[-20px_0_60px_-10px_rgba(0,0,0,0.25)]
          transition-transform duration-300 ease-in-out
          ${cartOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Drawer header with close and clear buttons */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-blue-500" />
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">Order Cart</span>
            {cart.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {totalCartQty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {(cart.length > 0 || selectedTable) && (
              <button
                onClick={onResetAll}
                title="Clear all items and unselect table"
                className="px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            )}
            <button
              onClick={onCloseCart}
              className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-white/50 dark:border-slate-800/50 shadow-inner">
              <Button
                size="sm"
                variant={orderType === "DINE_IN" ? "default" : "ghost"}
                onClick={() => onSetOrderType("DINE_IN")}
                className={`rounded-lg transition-all ${
                  orderType === "DINE_IN"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                }`}
              >
                Dine In
              </Button>
              <Button
                size="sm"
                variant={orderType === "TAKEAWAY" ? "default" : "ghost"}
                onClick={() => onSetOrderType("TAKEAWAY")}
                className={`rounded-lg transition-all ${
                  orderType === "TAKEAWAY"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                }`}
              >
                Takeaway
              </Button>
            </div>

            {orderType === "DINE_IN" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-widest pl-1">
                    Select Table
                  </Label>
                  <Select value={selectedTable} onValueChange={onSelectTable}>
                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white h-12 rounded-xl focus:ring-blue-500/50">
                      <SelectValue placeholder="Choose table" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl shadow-xl">
                      {tables.map((t) => {
                        const isBilled = activeOrders.some((o) => {
                          if (!o || o.status !== "BILLED") return false;
                          const tId = typeof o.tableId === "object" ? o.tableId?._id : o.tableId;
                          return tId && String(tId) === String(t._id);
                        });
                        return (
                          <SelectItem
                            key={t._id}
                            value={t._id}
                            disabled={isBilled}
                            className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t.tableNumber}
                            {isBilled ? (
                              <span className="text-red-400 dark:text-red-500 text-xs ml-1 font-medium">
                                (Bill Pending)
                              </span>
                            ) : t.status === "OCCUPIED" ? (
                              <span className="text-amber-500 dark:text-amber-400 text-xs ml-1 font-medium">
                                (Active Order)
                              </span>
                            ) : (
                              <span className="text-emerald-500 dark:text-emerald-400 text-xs ml-1 font-medium">
                                (Free)
                              </span>
                            )}
                          </SelectItem>
                        );
                      })}
                      {tables.length === 0 && (
                        <SelectItem value="none" disabled>
                          No tables available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {activeOrders.some(
                    (o) =>
                      (o.tableId?._id === selectedTable || (o as any).tableId === selectedTable) &&
                      o.status === "OPEN"
                  ) && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-100/50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 shadow-inner mt-2">
                      This table currently has an active order. New items will be appended as a new KOT.
                    </div>
                  )}
                </div>

                {selectedTable && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Guest Count (Covers)</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">People seated at table</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateGuestCount(-1)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-95 transition-all text-sm font-bold border border-slate-300 dark:border-slate-700 shadow-xs"
                        title="Decrease guest count"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-extrabold text-sm text-blue-600 dark:text-blue-400">
                        {guestCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateGuestCount(1)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-95 transition-all text-sm font-bold border border-slate-300 dark:border-slate-700 shadow-xs"
                        title="Increase guest count"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center pl-1">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-widest">
                    Customer Details <span className="opacity-50 font-medium lowercase">(optional)</span>
                  </Label>
                  {matchedCustomer && (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        matchedCustomer.tags === "FRIEND"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : matchedCustomer.tags === "VIP"
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                          : matchedCustomer.tags === "STAFF"
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300"
                      }`}
                    >
                      {matchedCustomer.tags === "FRIEND" && <Heart className="w-2.5 h-2.5 fill-emerald-600" />}
                      {matchedCustomer.tags === "VIP" && <Star className="w-2.5 h-2.5 fill-purple-600" />}
                      {matchedCustomer.tags === "STAFF" && <Briefcase className="w-2.5 h-2.5" />}
                      {matchedCustomer.tags || "CUSTOMER"}
                      {matchedCustomer.discountType &&
                        matchedCustomer.discountType !== "NONE" &&
                        (matchedCustomer.discountValue || 0) > 0 && (
                          <span className="opacity-75 ml-0.5">
                            ({matchedCustomer.discountType === "PERCENTAGE"
                              ? `${matchedCustomer.discountValue}%`
                              : `₹${matchedCustomer.discountValue}`})
                          </span>
                        )}
                    </span>
                  )}
                </div>
                {(customerName || customerPhone) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearCustomer}
                    className="h-5 text-[10px] text-slate-400 hover:text-red-500 p-0"
                  >
                    <UserX className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white h-11 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                />
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => onCustomerPhoneChange(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white h-11 w-32 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 shrink-0">
            <div className="space-y-5">
              {hasExistingItems && (
                <div className="space-y-3 bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm backdrop-blur-md">
                  <h3 className="font-extrabold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                    Already Ordered
                  </h3>
                  <div className="space-y-1">
                    {existingOrder.kots?.flatMap((kot) =>
                      kot.items?.map((item: any) => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center py-2.5 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-100 dark:bg-slate-800 w-6 h-6 flex items-center justify-center rounded-md">
                              {item.quantity}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                {item.menuItemId?.name || "Item"}
                              </span>
                              {item.isComplimentary && (
                                <span className="ml-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  FOC
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              item.itemStatus === "SERVED"
                                ? "bg-slate-200/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
                                : item.itemStatus === "READY"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : item.itemStatus === "PREPARING"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            }`}
                          >
                            {item.itemStatus}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {hasExistingItems && cart.length > 0 && (
                <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 my-2 pt-4">
                  <h3 className="font-extrabold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">
                    New Items
                  </h3>
                </div>
              )}

              {cart.length === 0 ? (
                !hasExistingItems && (
                  <div className="h-full h-[100px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4 py-12">
                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Cart is empty</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.cartId}
                      className="flex flex-col gap-3 p-3.5 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="40px"
                              loading="lazy"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UtensilsCrossed className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-sm leading-tight pr-2 text-slate-900 dark:text-white">
                                {item.name}{" "}
                                <span className="text-[11px] text-slate-500 font-semibold ml-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  ({item.selectedVariant.name})
                                </span>
                              </div>
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedModifiers.map((m, mIdx) => (
                                    <span
                                      key={mIdx}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                    >
                                      +{m.name} {m.price > 0 ? `(+₹${m.price})` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="font-extrabold text-sm text-blue-600 dark:text-blue-400 shrink-0">
                              ₹{(getItemUnitPrice(item) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Input
                        placeholder="Add cooking notes (e.g. no onions)"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.cartId, e.target.value)}
                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg focus-visible:ring-blue-500/30"
                      />

                      {/* Preset Note Pills */}
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COOKING_NOTES.map((preset) => {
                          const isSelected = (item.notes || "").includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => togglePresetNote(item.cartId, preset)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              {isSelected ? "✓ " : "+ "}
                              {preset}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"
                            onClick={() => updateQuantity(item.cartId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"
                            onClick={() => updateQuantity(item.cartId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          onClick={() => removeFromCart(item.cartId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky drawer footer: totals + FIRE button */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50 space-y-4 shrink-0 backdrop-blur-md">
          <div className="space-y-2 text-sm font-medium">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-300">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Taxes ({effectiveTaxPct}%)</span>
              <span className="text-slate-700 dark:text-slate-300">₹{taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-xl pt-3 border-t border-slate-200/50 dark:border-slate-800/50 mt-2 text-slate-900 dark:text-white">
              <span>Total</span>
              <span className="text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 h-14 text-sm font-extrabold tracking-wide shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl active:scale-[0.98] transition-all duration-200"
              disabled={cart.length === 0 || isSubmitting || isQuickReceiptSubmitting}
              onClick={async () => {
                await onQuickReceipt();
                onCloseCart();
              }}
            >
              {isQuickReceiptSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
              ) : (
                <Receipt className="mr-2 h-5 w-5 inline" />
              )}
              {isQuickReceiptSubmitting ? "Printing..." : "QUICK RECEIPT"}
            </Button>
            <Button
              className="flex-1 h-14 text-sm font-extrabold tracking-wide shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:bg-[rgba(37,99,235,0.9)] bg-blue-600 text-white rounded-xl active:scale-[0.98] transition-all duration-200"
              disabled={cart.length === 0 || isSubmitting || isQuickReceiptSubmitting}
              onClick={async () => {
                await onPlaceOrder();
                if (cart.length === 0) onCloseCart();
              }}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> : null}
              {isSubmitting ? "Firing..." : "FIRE TO KITCHEN"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

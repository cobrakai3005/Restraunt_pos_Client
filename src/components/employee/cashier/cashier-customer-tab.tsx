"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  User,
  Phone,
  Loader2,
  Heart,
  Star,
  Briefcase,
  Sparkles,
  UserPlus,
  CreditCard,
  Check,
} from "lucide-react";
import { Customer } from "@/services/customer.service";
import { Order } from "./types";

interface CashierCustomerTabProps {
  selectedOrder: Order;
  custPhone: string;
  setCustPhone: (phone: string) => void;
  custName: string;
  setCustName: (name: string) => void;
  matchedCustomer: Customer | null;
  setMatchedCustomer: (cust: Customer | null) => void;
  isSearchingCustomer: boolean;
  isSavingCustomer: boolean;
  isSavingDiscount: boolean;
  onUpdateCustomer: () => void;
  onUnlinkCustomer: () => void;
  onApplyCustomerDiscount: (cust: Customer) => void;
  onOpenCreateCustomerDialog: () => void;
  onBulkSettle?: (cust: Customer) => void;
}

export function CashierCustomerTab({
  selectedOrder,
  custPhone,
  setCustPhone,
  custName,
  setCustName,
  matchedCustomer,
  setMatchedCustomer,
  isSearchingCustomer,
  isSavingCustomer,
  isSavingDiscount,
  onUpdateCustomer,
  onUnlinkCustomer,
  onApplyCustomerDiscount,
  onOpenCreateCustomerDialog,
  onBulkSettle,
}: CashierCustomerTabProps) {
  const isCustomerLocked = selectedOrder.status === "BILLED" || selectedOrder.status === "PAID";

  return (
    <div className="p-4 space-y-4">
      {/* Locked alert banner */}
      {isCustomerLocked ? (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 p-4 flex items-start gap-3 shadow-xs">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              Customer Details Locked (Bill Generated)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              A bill/receipt has already been generated for this order. Customer details and VIP/Friend discounts cannot be altered after generating the bill. Re-open the order to make changes.
            </p>
          </div>
        </div>
      ) : (
        /* Info banner */
        <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-4 py-3 flex items-start gap-3">
          <User className="h-4 w-4 mt-0.5 text-violet-500 shrink-0" />
          <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
            Search registered <strong>VIP / Friend / Staff</strong> profiles by phone number, or enter a walk-in guest name. Profile discount rules will be detected automatically.
          </p>
        </div>
      )}

      {/* Phone Search */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Customer Phone
          </span>
          {isSearchingCustomer && (
            <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold lowercase">
              <Loader2 className="h-3 w-3 animate-spin" /> searching...
            </span>
          )}
        </label>
        <div className="relative">
          <Input
            id="cust-phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            disabled={isCustomerLocked}
            placeholder={isCustomerLocked ? "Customer phone (locked)" : "Enter 10-digit mobile number"}
            value={custPhone}
            onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={`h-11 pl-4 font-bold text-sm rounded-xl ${
              isCustomerLocked
                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            }`}
          />
          {custPhone.length === 10 && !isCustomerLocked && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Matched Customer Profile Card */}
      {matchedCustomer ? (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-black text-sm">
                {matchedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {matchedCustomer.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {matchedCustomer.phone || "No phone"} {matchedCustomer.email ? `• ${matchedCustomer.email}` : ""}
                </p>
              </div>
            </div>

            {/* Tag Badge */}
            <div>
              {matchedCustomer.tags === "FRIEND" && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                  <Heart className="w-3 h-3 text-emerald-600 fill-emerald-600" /> FRIEND
                </span>
              )}
              {matchedCustomer.tags === "VIP" && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 shadow-2xs">
                  <Star className="w-3 h-3 text-purple-600 fill-purple-600" /> VIP
                </span>
              )}
              {matchedCustomer.tags === "STAFF" && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                  <Briefcase className="w-3 h-3 text-amber-600" /> STAFF
                </span>
              )}
              {(!matchedCustomer.tags || matchedCustomer.tags === "NORMAL") && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3" /> REGULAR
                </span>
              )}
            </div>
          </div>

          {matchedCustomer.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg italic">
              "{matchedCustomer.notes}"
            </p>
          )}

          {/* Outstanding Khata / Credit Balance Card */}
          {(() => {
            const dueAmt = Number(matchedCustomer.outstandingDue ?? matchedCustomer.closingBalance ?? 0);
            const hasDues = dueAmt > 0;
            return (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  hasDues
                    ? "border-amber-300 dark:border-amber-800/80 bg-gradient-to-r from-amber-50/90 to-orange-50/70 dark:from-amber-950/40 dark:to-orange-950/30"
                    : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      hasDues
                        ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Outstanding Credit (Khata)
                    </span>
                    <span
                      className={`text-sm font-black ${
                        hasDues
                          ? "text-amber-950 dark:text-amber-200"
                          : "text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      ₹{dueAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onBulkSettle && hasDues && (
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => onBulkSettle(matchedCustomer)}
                      className="h-7 px-2.5 text-[11px] font-black bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" /> Settle All
                    </Button>
                  )}
                  {hasDues ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-300 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      {matchedCustomer.dueOrdersCount ? `${matchedCustomer.dueOrdersCount} Unpaid Orders` : "Dues Pending"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> No Dues
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Available Discount Banner */}
          {matchedCustomer.discountType &&
            matchedCustomer.discountType !== "NONE" &&
            (matchedCustomer.discountValue || 0) > 0 && (
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-700/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">
                      {matchedCustomer.tags || "Customer"} —{" "}
                      {matchedCustomer.discountType === "PERCENTAGE"
                        ? `${matchedCustomer.discountValue}% Discount Available`
                        : `₹${matchedCustomer.discountValue} Flat Discount Available`}
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                      Configured discount rule for this customer
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingDiscount || isCustomerLocked}
                  onClick={() => onApplyCustomerDiscount(matchedCustomer)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl px-3.5 shrink-0 shadow-sm disabled:opacity-50"
                >
                  Apply Discount
                </Button>
              </div>
            )}
        </div>
      ) : (
        custPhone.trim().length >= 3 &&
        !isSearchingCustomer &&
        !isCustomerLocked && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center space-y-2 bg-white/50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No VIP or Friend profile found for <strong>{custPhone}</strong>.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCustomerLocked}
              onClick={onOpenCreateCustomerDialog}
              className="rounded-xl text-xs font-extrabold border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register as VIP / Friend
            </Button>
          </div>
        )
      )}

      {/* Name input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Customer Name
        </label>
        <Input
          id="cust-name"
          type="text"
          disabled={isCustomerLocked}
          placeholder={isCustomerLocked ? "Customer name (locked)" : "e.g. Ramesh Sharma"}
          value={custName}
          onChange={(e) => setCustName(e.target.value)}
          className={`h-11 font-bold text-sm rounded-xl ${
            isCustomerLocked
              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
              : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          }`}
        />
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-1">
        {isCustomerLocked ? (
          <div className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-extrabold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
            <Lock className="h-4 w-4 text-amber-500" /> Customer Details Locked (Bill Generated)
          </div>
        ) : (
          <button
            id="save-customer-btn"
            disabled={isSavingCustomer}
            onClick={onUpdateCustomer}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-md shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSavingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            {isSavingCustomer ? "Saving..." : matchedCustomer ? "Link Customer & Update Order" : "Save Customer Info"}
          </button>
        )}

        {!isCustomerLocked &&
          (selectedOrder.customerDetails?.name ||
            selectedOrder.customerDetails?.phone ||
            selectedOrder.customerDetails?.customerId) && (
            <button
              disabled={isSavingCustomer}
              onClick={onUnlinkCustomer}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Unlink / Clear Customer
            </button>
          )}
      </div>
    </div>
  );
}

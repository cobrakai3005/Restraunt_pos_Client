"use client";

import { Lock, User, Percent, Receipt } from "lucide-react";
import { Order, KotItem } from "./types";
import { Customer } from "@/services/customer.service";
import { CashierBillTab } from "./cashier-bill-tab";
import { CashierCustomerTab } from "./cashier-customer-tab";
import { CashierDiscountTab } from "./cashier-discount-tab";

interface CashierSettlementDrawerProps {
  selectedOrder: Order | null;
  billingTab: "bill" | "customer" | "discount";
  setBillingTab: (tab: "bill" | "customer" | "discount") => void;
  // Customer props
  custPhone: string;
  setCustPhone: (phone: string) => void;
  custName: string;
  setCustName: (name: string) => void;
  matchedCustomer: Customer | null;
  setMatchedCustomer: (cust: Customer | null) => void;
  isSearchingCustomer: boolean;
  isSavingCustomer: boolean;
  onUpdateCustomer: () => void;
  onUnlinkCustomer: () => void;
  onApplyCustomerDiscount: (cust: Customer) => void;
  onOpenCreateCustomerDialog: () => void;
  // Discount props
  discountAmount: string;
  setDiscountAmount: (val: string) => void;
  isSavingDiscount: boolean;
  onUpdateDiscount: (customDisc?: number) => void;
  // Bill / Payment props
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isProcessing: boolean;
  hasCust: boolean;
  getOrderGrandTotal: (ord: Order | null) => number;
  onToggleComplimentaryDialog: (item: KotItem) => void;
  onOpenSplitDialog: () => void;
  onQuickCashAndPrint: (orderId: string) => void;
  onGenerateBill: (orderId: string) => void;
  onPrintBill: () => void;
  onReopenOrder: (orderId: string) => void;
  onCheckout: (orderId: string) => void;
}

export function CashierSettlementDrawer({
  selectedOrder,
  billingTab,
  setBillingTab,
  custPhone,
  setCustPhone,
  custName,
  setCustName,
  matchedCustomer,
  setMatchedCustomer,
  isSearchingCustomer,
  isSavingCustomer,
  onUpdateCustomer,
  onUnlinkCustomer,
  onApplyCustomerDiscount,
  onOpenCreateCustomerDialog,
  discountAmount,
  setDiscountAmount,
  isSavingDiscount,
  onUpdateDiscount,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  hasCust,
  getOrderGrandTotal,
  onToggleComplimentaryDialog,
  onOpenSplitDialog,
  onQuickCashAndPrint,
  onGenerateBill,
  onPrintBill,
  onReopenOrder,
  onCheckout,
}: CashierSettlementDrawerProps) {
  if (!selectedOrder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-3">
        <Receipt className="h-16 w-16 opacity-20" />
        <p className="text-base font-medium">Select an order to view the bill</p>
      </div>
    );
  }

  const isBillLocked = selectedOrder.status === "BILLED" || selectedOrder.status === "PAID";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* Header + Sub-tabs */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-6 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Order #{selectedOrder._id?.slice(-4)}
              </h2>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                  selectedOrder.status === "BILLED"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                }`}
              >
                {selectedOrder.status === "BILLED" ? "Bill Generated" : "Unbilled"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedOrder.orderType === "DINE_IN"
                ? `Dine-In • Table ${selectedOrder.tableId?.tableNumber}`
                : selectedOrder.orderType}
              {selectedOrder.customerDetails?.name && ` • 👤 ${selectedOrder.customerDetails.name}`}
            </p>
          </div>
        </div>

        {/* Sub-tabs: Bill | Customer | Discount */}
        <div className="px-6 flex gap-1 pb-0">
          {(
            [
              { id: "bill", label: "Bill", icon: Receipt, dot: false },
              {
                id: "customer",
                label: isBillLocked ? "Customer (Locked)" : "Customer",
                icon: isBillLocked ? Lock : User,
                dot: !!(selectedOrder.customerDetails?.name || selectedOrder.customerDetails?.phone),
              },
              {
                id: "discount",
                label: isBillLocked ? "Discount (Locked)" : "Discount",
                icon: isBillLocked ? Lock : Percent,
                dot: (selectedOrder.financials?.discount ?? 0) > 0,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isActive = billingTab === t.id;
            const isLockedTab = (t.id === "customer" || t.id === "discount") && isBillLocked;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setBillingTab(t.id);
                  if (t.id === "customer") {
                    setCustPhone(selectedOrder.customerDetails?.phone || "");
                    setCustName(selectedOrder.customerDetails?.name || "");
                  }
                  if (t.id === "discount") {
                    setDiscountAmount(String(selectedOrder.financials?.discount ?? ""));
                  }
                }}
                className={`px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                  isActive
                    ? t.id === "customer"
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : t.id === "discount"
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${isLockedTab ? "text-amber-500" : ""}`} /> {t.label}
                  {t.dot && (
                    <span
                      className={`ml-0.5 w-1.5 h-1.5 rounded-full inline-block ${
                        t.id === "discount" ? "bg-emerald-500" : "bg-violet-500"
                      }`}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      {billingTab === "customer" && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5 max-w-lg mx-auto space-y-5">
            <CashierCustomerTab
              selectedOrder={selectedOrder}
              custPhone={custPhone}
              setCustPhone={setCustPhone}
              custName={custName}
              setCustName={setCustName}
              matchedCustomer={matchedCustomer}
              setMatchedCustomer={setMatchedCustomer}
              isSearchingCustomer={isSearchingCustomer}
              isSavingCustomer={isSavingCustomer}
              isSavingDiscount={isSavingDiscount}
              onUpdateCustomer={onUpdateCustomer}
              onUnlinkCustomer={onUnlinkCustomer}
              onApplyCustomerDiscount={onApplyCustomerDiscount}
              onOpenCreateCustomerDialog={onOpenCreateCustomerDialog}
            />
          </div>
        </div>
      )}

      {billingTab === "discount" && (
        <CashierDiscountTab
          selectedOrder={selectedOrder}
          matchedCustomer={matchedCustomer}
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          isSavingDiscount={isSavingDiscount}
          onApplyCustomerDiscount={onApplyCustomerDiscount}
          onUpdateDiscount={onUpdateDiscount}
        />
      )}

      {billingTab === "bill" && (
        <CashierBillTab
          selectedOrder={selectedOrder}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          isProcessing={isProcessing}
          hasCust={hasCust}
          getOrderGrandTotal={getOrderGrandTotal}
          onToggleComplimentaryDialog={onToggleComplimentaryDialog}
          onOpenSplitDialog={onOpenSplitDialog}
          onOpenCustomerTab={() => setBillingTab("customer")}
          onQuickCashAndPrint={onQuickCashAndPrint}
          onGenerateBill={onGenerateBill}
          onPrintBill={onPrintBill}
          onReopenOrder={onReopenOrder}
          onCheckout={onCheckout}
        />
      )}
    </div>
  );
}

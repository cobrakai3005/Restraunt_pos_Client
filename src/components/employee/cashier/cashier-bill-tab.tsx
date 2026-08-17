"use client";

import { Order, KotItem, calculateOrderFinancials } from "./types";
import { CashierKotItemsTable } from "./cashier-kot-items-table";
import { CashierBillSummary } from "./cashier-bill-summary";
import { CashierPaymentMethods } from "./cashier-payment-methods";
import { CashierActionFooter } from "./cashier-action-footer";

interface CashierBillTabProps {
  selectedOrder: Order;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isProcessing: boolean;
  hasCust: boolean;
  getOrderGrandTotal: (ord: Order | null) => number;
  onToggleComplimentaryDialog: (item: KotItem) => void;
  onOpenSplitDialog: () => void;
  onOpenCustomerTab: () => void;
  onQuickCashAndPrint: (orderId: string) => void;
  onGenerateBill: (orderId: string) => void;
  onPrintBill: () => void;
  onReopenOrder: (orderId: string) => void;
  onCheckout: (orderId: string) => void;
}

export function CashierBillTab({
  selectedOrder,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  hasCust,
  getOrderGrandTotal,
  onToggleComplimentaryDialog,
  onOpenSplitDialog,
  onOpenCustomerTab,
  onQuickCashAndPrint,
  onGenerateBill,
  onPrintBill,
  onReopenOrder,
  onCheckout,
}: CashierBillTabProps) {
  const { subtotal, totalTax, grandTotal } = calculateOrderFinancials(selectedOrder);

  return (
    <>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 space-y-5 max-w-3xl mx-auto">
          {/* ── KOT Item Table ── */}
          <CashierKotItemsTable
            order={selectedOrder}
            onToggleComplimentaryDialog={onToggleComplimentaryDialog}
          />

          {/* ── Bill Summary ── */}
          <CashierBillSummary
            order={selectedOrder}
            subtotal={subtotal}
            totalTax={totalTax}
            grandTotal={grandTotal}
          />

          {/* ── Payment Methods ── */}
          {selectedOrder.status === "BILLED" && (
            <CashierPaymentMethods
              order={selectedOrder}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              hasCust={hasCust}
              onOpenSplitDialog={onOpenSplitDialog}
              onOpenCustomerTab={onOpenCustomerTab}
            />
          )}
        </div>
      </div>

      {/* ── Sticky Action Footer ── */}
      <CashierActionFooter
        order={selectedOrder}
        paymentMethod={paymentMethod}
        isProcessing={isProcessing}
        hasCust={hasCust}
        getOrderGrandTotal={getOrderGrandTotal}
        onOpenSplitDialog={onOpenSplitDialog}
        onOpenCustomerTab={onOpenCustomerTab}
        onQuickCashAndPrint={onQuickCashAndPrint}
        onGenerateBill={onGenerateBill}
        onPrintBill={onPrintBill}
        onReopenOrder={onReopenOrder}
        onCheckout={onCheckout}
      />
    </>
  );
}

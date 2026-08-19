"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { OrderTakingPanel } from "./order-taking-panel";
import { CashierPickupPanel } from "./cashier-pickup-panel";
import { ComplimentaryItemDialog } from "./complimentary-item-dialog";
import { CreateCustomerDialog } from "./create-customer-dialog";
import { ReceiptModal } from "./ReceiptModal";
import { CashierReceivablesPanel } from "./cashier-receivables-panel";
import { PosReportsHub } from "@/components/client/reports/pos-reports-hub";
import {
  DashboardProps,
  KotItem,
  Order,
  Mode,
  useCashierDashboard,
  CashierHeader,
  CashierBillingOrdersList,
  CashierSettlementDrawer,
  CashierSplitPaymentDialog,
  CashierReceiveCreditDialog,
  CashierDueHistoryDialog,
} from "./cashier";

export type { DashboardProps, KotItem, Order, Mode };

export function CashierDashboard({ user, onOpenDrawer, currentMode, onModeChange }: DashboardProps) {
  const {
    orders,
    tables,
    filteredOrders,
    searchQuery,
    setSearchQuery,
    isLoading,
    selectedOrder,
    setSelectedOrder,
    selectedOrderForHistory,
    setSelectedOrderForHistory,
    completedReceiptOrder,
    setCompletedReceiptOrder,
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    showReceipt,
    setShowReceipt,
    mode: internalMode,
    setMode: internalSetMode,
    readyItemCount,
    pendingCount,
    // Split payment
    showSplitDialog,
    setShowSplitDialog,
    splitCash,
    setSplitCash,
    splitUpi,
    setSplitUpi,
    splitCard,
    setSplitCard,
    splitCredit,
    setSplitCredit,
    // Customer Tab
    billingTab,
    setBillingTab,
    custPhone,
    setCustPhone,
    custName,
    setCustName,
    matchedCustomer,
    setMatchedCustomer,
    isSearchingCustomer,
    showCreateCustomerDialog,
    setShowCreateCustomerDialog,
    isSavingCustomer,
    // Credit Payment Dialog
    showReceiveCreditDialog,
    setShowReceiveCreditDialog,
    creditPaymentOrder,
    creditPaymentMode,
    setCreditPaymentMode,
    creditPaymentAmount,
    setCreditPaymentAmount,
    creditPaymentMethod,
    setCreditPaymentMethod,
    creditSplitCash,
    setCreditSplitCash,
    creditSplitUpi,
    setCreditSplitUpi,
    creditSplitCard,
    setCreditSplitCard,
    creditSplitOther,
    setCreditSplitOther,
    creditPaymentNotes,
    setCreditPaymentNotes,
    isSubmittingCreditPayment,
    // Discount Tab
    discountAmount,
    setDiscountAmount,
    isSavingDiscount,
    // Complimentary
    complimentaryItem,
    setComplimentaryItem,
    showComplimentaryDialog,
    setShowComplimentaryDialog,
    // Handlers
    isCustomerLinked,
    getOrderGrandTotal,
    fetchOrders,
    handleOpenReceiveCredit,
    handleCollectCreditPayment,
    handleToggleComplimentary,
    handleGenerateBill,
    handleCheckout,
    handleSplitCheckout,
    handleQuickCashAndPrint,
    handleReopenOrder,
    handleUpdateCustomer,
    handleUnlinkCustomer,
    handleApplyCustomerDiscount,
    handleUpdateDiscount,
  } = useCashierDashboard();

  const mode = currentMode !== undefined ? currentMode : internalMode;
  const setMode = (newMode: Mode) => {
    internalSetMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

  useEffect(() => {
    fetchOrders();
  }, [mode]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="font-medium">Loading Cashier Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      {/* Top Header */}
      <CashierHeader
        mode={mode}
        setMode={setMode}
        readyItemCount={readyItemCount}
        pendingCount={pendingCount}
        onOpenDrawer={onOpenDrawer}
      />

      {/* Mode Content */}
      {mode === "orders" ? (
        <div className="flex-1 min-h-0 p-4 bg-slate-100/50 dark:bg-slate-900/50">
          <OrderTakingPanel onOrderFired={fetchOrders} />
        </div>
      ) : mode === "kitchen" ? (
        <div className="flex-1 min-h-0 p-4 bg-slate-100/50 dark:bg-slate-900/50">
          <CashierPickupPanel user={user} embedded />
        </div>
      ) : mode === "receivables" ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <CashierReceivablesPanel
            onCollectPayment={handleOpenReceiveCredit}
            onViewHistory={(ord) => setSelectedOrderForHistory(ord)}
          />
        </div>
      ) : mode === "reports" ? (
        <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/50">
          <PosReportsHub
            initialRestaurantId={typeof user.restaurantId === 'object' ? (user.restaurantId as any)?._id : user.restaurantId}
            hideRestaurantSelector={true}
            defaultTab="executive"
          />
        </div>
      ) : (
        /* ── BILLING & SETTLEMENTS ── */
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Orders List */}
          <CashierBillingOrdersList
            orders={orders}
            filteredOrders={filteredOrders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            pendingCount={pendingCount}
          />

          {/* Right: Bill & Settlement Drawer */}
          <CashierSettlementDrawer
            selectedOrder={selectedOrder}
            billingTab={billingTab}
            setBillingTab={setBillingTab}
            custPhone={custPhone}
            setCustPhone={setCustPhone}
            custName={custName}
            setCustName={setCustName}
            matchedCustomer={matchedCustomer}
            setMatchedCustomer={setMatchedCustomer}
            isSearchingCustomer={isSearchingCustomer}
            isSavingCustomer={isSavingCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onUnlinkCustomer={handleUnlinkCustomer}
            onApplyCustomerDiscount={handleApplyCustomerDiscount}
            onOpenCreateCustomerDialog={() => setShowCreateCustomerDialog(true)}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            isSavingDiscount={isSavingDiscount}
            onUpdateDiscount={handleUpdateDiscount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isProcessing={isProcessing}
            hasCust={isCustomerLinked(selectedOrder)}
            getOrderGrandTotal={getOrderGrandTotal}
            onToggleComplimentaryDialog={(item) => {
              setComplimentaryItem(item);
              setShowComplimentaryDialog(true);
            }}
            onOpenSplitDialog={() => {
              if (!selectedOrder) return;
              const g = selectedOrder.financials?.grandTotal || 0;
              setSplitCash(g.toFixed(0));
              setSplitUpi("0");
              setSplitCard("0");
              setSplitCredit("0");
              setShowSplitDialog(true);
            }}
            onQuickCashAndPrint={handleQuickCashAndPrint}
            onGenerateBill={handleGenerateBill}
            onPrintBill={() => {
              setCompletedReceiptOrder(selectedOrder);
              setShowReceipt(true);
            }}
            onReopenOrder={handleReopenOrder}
            onCheckout={handleCheckout}
          />

          <ReceiptModal
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
            order={completedReceiptOrder || selectedOrder}
            tables={tables}
            restaurant={(user as any)?.restaurant}
          />
        </div>
      )}

      {/* ── Multi-Payment / Split Payment Dialog ── */}
      <CashierSplitPaymentDialog
        isOpen={showSplitDialog}
        onOpenChange={setShowSplitDialog}
        selectedOrder={selectedOrder}
        grandTotal={getOrderGrandTotal(selectedOrder)}
        hasCust={isCustomerLinked(selectedOrder)}
        splitCash={splitCash}
        setSplitCash={setSplitCash}
        splitUpi={splitUpi}
        setSplitUpi={setSplitUpi}
        splitCard={splitCard}
        setSplitCard={setSplitCard}
        splitCredit={splitCredit}
        setSplitCredit={setSplitCredit}
        isProcessing={isProcessing}
        onSplitCheckout={handleSplitCheckout}
        onOpenCustomerTab={() => {
          setBillingTab("customer");
        }}
      />

      {/* ── Receive Credit Payment Dialog ── */}
      <CashierReceiveCreditDialog
        isOpen={showReceiveCreditDialog}
        onOpenChange={setShowReceiveCreditDialog}
        order={creditPaymentOrder}
        creditPaymentMode={creditPaymentMode}
        setCreditPaymentMode={setCreditPaymentMode}
        creditPaymentAmount={creditPaymentAmount}
        setCreditPaymentAmount={setCreditPaymentAmount}
        creditPaymentMethod={creditPaymentMethod}
        setCreditPaymentMethod={setCreditPaymentMethod}
        creditPaymentNotes={creditPaymentNotes}
        setCreditPaymentNotes={setCreditPaymentNotes}
        creditSplitCash={creditSplitCash}
        setCreditSplitCash={setCreditSplitCash}
        creditSplitUpi={creditSplitUpi}
        setCreditSplitUpi={setCreditSplitUpi}
        creditSplitCard={creditSplitCard}
        setCreditSplitCard={setCreditSplitCard}
        creditSplitOther={creditSplitOther}
        setCreditSplitOther={setCreditSplitOther}
        isSubmittingCreditPayment={isSubmittingCreditPayment}
        onCollectCreditPayment={handleCollectCreditPayment}
      />

      {/* ── Credit Payment History Dialog ── */}
      <CashierDueHistoryDialog
        order={selectedOrderForHistory}
        onClose={() => setSelectedOrderForHistory(null)}
      />

      {/* ── Quick Create VIP / Friend Dialog ── */}
      <CreateCustomerDialog
        isOpen={showCreateCustomerDialog}
        onClose={() => setShowCreateCustomerDialog(false)}
        initialPhone={custPhone}
        initialName={custName}
        onCustomerCreated={(newCust) => {
          setMatchedCustomer(newCust);
          setCustName(newCust.name);
          if (newCust.phone) setCustPhone(newCust.phone);
          if (newCust.discountType && newCust.discountType !== "NONE" && newCust.discountValue) {
            handleApplyCustomerDiscount(newCust);
          }
        }}
      />

      {/* ── Complimentary (FOC) Item Dialog ── */}
      <ComplimentaryItemDialog
        isOpen={showComplimentaryDialog}
        onClose={() => {
          setShowComplimentaryDialog(false);
          setComplimentaryItem(null);
        }}
        item={complimentaryItem}
        onConfirm={handleToggleComplimentary}
      />
    </div>
  );
}

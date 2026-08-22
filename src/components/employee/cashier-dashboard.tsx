"use client";

import { lazy, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { DashboardProps, KotItem, Order, Mode } from "./cashier/types";
import { useCashierDashboard } from "./cashier/use-cashier-dashboard";
import { CashierHeader } from "./cashier/cashier-header";

export type { DashboardProps, KotItem, Order, Mode };

const OrderTakingPanel = lazy(() => import("./order-taking-panel").then((module) => ({ default: module.OrderTakingPanel })));
const CashierPickupPanel = lazy(() => import("./cashier-pickup-panel").then((module) => ({ default: module.CashierPickupPanel })));
const CashierReceivablesPanel = lazy(() => import("./cashier-receivables-panel").then((module) => ({ default: module.CashierReceivablesPanel })));
const PosReportsHub = lazy(() => import("@/components/client/reports/pos-reports-hub").then((module) => ({ default: module.PosReportsHub })));
const CashierBillingOrdersList = lazy(() => import("./cashier/cashier-billing-orders-list").then((module) => ({ default: module.CashierBillingOrdersList })));
const CashierSettlementDrawer = lazy(() => import("./cashier/cashier-settlement-drawer").then((module) => ({ default: module.CashierSettlementDrawer })));
const ReceiptModal = lazy(() => import("./ReceiptModal").then((module) => ({ default: module.ReceiptModal })));
const CashierSplitPaymentDialog = lazy(() => import("./cashier/cashier-split-payment-dialog").then((module) => ({ default: module.CashierSplitPaymentDialog })));
const CashierReceiveCreditDialog = lazy(() => import("./cashier/cashier-receive-credit-dialog").then((module) => ({ default: module.CashierReceiveCreditDialog })));
const CashierDueHistoryDialog = lazy(() => import("./cashier/cashier-due-history-dialog").then((module) => ({ default: module.CashierDueHistoryDialog })));
const BulkSettleDialog = lazy(() => import("./cashier/bulk-settle-dialog").then((module) => ({ default: module.BulkSettleDialog })));
const CreateCustomerDialog = lazy(() => import("./create-customer-dialog").then((module) => ({ default: module.CreateCustomerDialog })));
const ComplimentaryItemDialog = lazy(() => import("./complimentary-item-dialog").then((module) => ({ default: module.ComplimentaryItemDialog })));
const CashierHistoryDrawer = lazy(() => import("./cashier/cashier-history-drawer").then((module) => ({ default: module.CashierHistoryDrawer })));

function CashierPanelFallback() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
      Loading workspace…
    </div>
  );
}

export function CashierDashboard({ user, onOpenDrawer, currentMode, onModeChange }: DashboardProps) {
  const router = useRouter();
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
    // Paid Orders toggle
    showPaidOrders,
    setShowPaidOrders,
    paidOrders,
    isFetchingPaid,
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
    // Bulk Settle
    showBulkSettleDialog,
    setShowBulkSettleDialog,
    bulkSettleCustomer,
    bulkSettleOrders,
    isLoadingBulkSettle,
    isSubmittingBulkSettle,
    handleOpenBulkSettle,
    handleConfirmBulkSettle,
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
  } = useCashierDashboard(currentMode);

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const mode = currentMode !== undefined ? currentMode : internalMode;
  const setMode = (newMode: Mode) => {
    internalSetMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

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

  const restaurantId =
    typeof user.restaurantId === "object"
      ? (user.restaurantId as any)?._id
      : user.restaurantId || "";

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      {/* Top Header */}
      <CashierHeader
        mode={mode}
        setMode={setMode}
        readyItemCount={readyItemCount}
        pendingCount={pendingCount}
        onOpenDrawer={onOpenDrawer}
        onOpenZReport={() => router.push("/pos/register/close")}
        onOpenHistory={() => setShowHistoryDrawer(true)}
      />

      {/* Mode Content */}
      {mode === "orders" ? (
        <div className="flex-1 min-h-0 p-4 bg-slate-100/50 dark:bg-slate-900/50">
          <Suspense fallback={<CashierPanelFallback />}>
            <OrderTakingPanel />
          </Suspense>
        </div>
      ) : mode === "kitchen" ? (
        <div className="flex-1 min-h-0 p-4 bg-slate-100/50 dark:bg-slate-900/50">
          <Suspense fallback={<CashierPanelFallback />}>
            <CashierPickupPanel user={user} embedded />
          </Suspense>
        </div>
      ) : mode === "receivables" ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Suspense fallback={<CashierPanelFallback />}>
            <CashierReceivablesPanel
              onCollectPayment={handleOpenReceiveCredit}
              onViewHistory={(ord) => setSelectedOrderForHistory(ord)}
              onBulkSettle={handleOpenBulkSettle}
              onViewReceipt={(ord) => {
                setCompletedReceiptOrder(ord);
                setShowReceipt(true);
              }}
            />
          </Suspense>
        </div>
      ) : mode === "reports" ? (
        <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/50">
          <Suspense fallback={<CashierPanelFallback />}>
            <PosReportsHub
              initialRestaurantId={typeof user.restaurantId === 'object' ? (user.restaurantId as any)?._id : user.restaurantId}
              hideRestaurantSelector={true}
              defaultTab="executive"
            />
          </Suspense>
        </div>
      ) : (
        /* ── BILLING & SETTLEMENTS ── */
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Orders List */}
          <Suspense fallback={<CashierPanelFallback />}>
            <CashierBillingOrdersList
            orders={orders}
            filteredOrders={filteredOrders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            pendingCount={pendingCount}
            showPaidOrders={showPaidOrders}
            onTogglePaidOrders={() => setShowPaidOrders(!showPaidOrders)}
            paidOrders={paidOrders}
            isFetchingPaid={isFetchingPaid}
            onViewReceipt={(ord) => {
              setCompletedReceiptOrder(ord);
              setShowReceipt(true);
            }}
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
            onBulkSettle={handleOpenBulkSettle}
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
          </Suspense>
        </div>
      )}

      {/* ── Global POS Receipt Modal (Available across all tabs) ── */}
      {showReceipt && (
        <Suspense fallback={null}>
          <ReceiptModal
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
            order={completedReceiptOrder || selectedOrder}
            tables={tables}
            restaurant={(user as any)?.restaurant}
          />
        </Suspense>
      )}

      {/* ── Multi-Payment / Split Payment Dialog ── */}
      {showSplitDialog && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* ── Receive Credit Payment Dialog ── */}
      {showReceiveCreditDialog && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* ── Bulk Settle All Dues Dialog ── */}
      {showBulkSettleDialog && (
        <Suspense fallback={null}>
          <BulkSettleDialog
        isOpen={showBulkSettleDialog}
        onOpenChange={setShowBulkSettleDialog}
        customer={bulkSettleCustomer}
        dueOrders={bulkSettleOrders}
        isLoading={isLoadingBulkSettle}
        isSubmitting={isSubmittingBulkSettle}
        onConfirmBulkSettle={handleConfirmBulkSettle}
          />
        </Suspense>
      )}

      {/* ── Credit Payment History Dialog ── */}
      {selectedOrderForHistory && (
        <Suspense fallback={null}>
          <CashierDueHistoryDialog
            order={selectedOrderForHistory}
            onClose={() => setSelectedOrderForHistory(null)}
          />
        </Suspense>
      )}

      {/* ── Quick Create VIP / Friend Dialog ── */}
      {showCreateCustomerDialog && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* ── Complimentary (FOC) Item Dialog ── */}
      {showComplimentaryDialog && (
        <Suspense fallback={null}>
          <ComplimentaryItemDialog
            isOpen={showComplimentaryDialog}
            onClose={() => {
              setShowComplimentaryDialog(false);
              setComplimentaryItem(null);
            }}
            item={complimentaryItem}
            onConfirm={handleToggleComplimentary}
          />
        </Suspense>
      )}

      {/* ── Order History Drawer ── */}
      {showHistoryDrawer && (
        <Suspense fallback={null}>
          <CashierHistoryDrawer
            isOpen={showHistoryDrawer}
            onClose={() => setShowHistoryDrawer(false)}
            onViewReceipt={(ord) => {
              setCompletedReceiptOrder(ord);
              setShowReceipt(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Layers,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Customer } from "@/services/customer.service";
import { Order } from "./types";

interface BulkSettleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  dueOrders: Order[];
  isLoading: boolean;
  isSubmitting: boolean;
  onConfirmBulkSettle: (payload: {
    customerId: string;
    amount?: number;
    method?: "CASH" | "UPI" | "CARD" | "OTHER";
    payments?: Array<{ amount: number; method: "CASH" | "UPI" | "CARD" | "OTHER" }>;
    notes?: string;
  }) => Promise<void>;
}

export function BulkSettleDialog({
  isOpen,
  onOpenChange,
  customer,
  dueOrders,
  isLoading,
  isSubmitting,
  onConfirmBulkSettle,
}: BulkSettleDialogProps) {
  // Sort due orders oldest first (FIFO)
  const sortedOrders = useMemo(() => {
    return [...dueOrders]
      .filter((o) => Number(o.financials?.dueAmount || 0) > 0)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [dueOrders]);

  const totalOutstandingDue = useMemo(() => {
    return sortedOrders.reduce((sum, o) => sum + Number(o.financials?.dueAmount || 0), 0);
  }, [sortedOrders]);

  // Form State
  const [paymentMode, setPaymentMode] = useState<"SINGLE" | "SPLIT">("SINGLE");
  const [singleAmount, setSingleAmount] = useState<string>("");
  const [singleMethod, setSingleMethod] = useState<"CASH" | "UPI" | "CARD" | "OTHER">("CASH");
  const [splitCash, setSplitCash] = useState<string>("");
  const [splitUpi, setSplitUpi] = useState<string>("");
  const [splitCard, setSplitCard] = useState<string>("");
  const [splitOther, setSplitOther] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Initialize amount to full due on open
  useEffect(() => {
    if (isOpen) {
      setSingleAmount(totalOutstandingDue > 0 ? totalOutstandingDue.toString() : "");
      setPaymentMode("SINGLE");
      setSingleMethod("CASH");
      setSplitCash("");
      setSplitUpi("");
      setSplitCard("");
      setSplitOther("");
      setNotes("");
    }
  }, [isOpen, totalOutstandingDue]);

  // Total amount parsed from user input
  const effectiveTotalAmount = useMemo(() => {
    if (paymentMode === "SINGLE") {
      const parsed = parseFloat(singleAmount);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    } else {
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      const cd = parseFloat(splitCard) || 0;
      const o = parseFloat(splitOther) || 0;
      return c + u + cd + o;
    }
  }, [paymentMode, singleAmount, splitCash, splitUpi, splitCard, splitOther]);

  // Live FIFO distribution preview across sorted orders
  const distributionPreview = useMemo(() => {
    let unallocated = effectiveTotalAmount;
    return sortedOrders.map((order) => {
      const due = Number(order.financials?.dueAmount || 0);
      const applied = Math.min(due, unallocated);
      unallocated = Math.max(0, unallocated - applied);
      const remaining = Math.max(0, due - applied);
      const status = remaining === 0 ? "PAID" : applied > 0 ? "PARTIAL" : "PENDING";
      return {
        order,
        due,
        applied,
        remaining,
        status,
      };
    });
  }, [sortedOrders, effectiveTotalAmount]);

  const remainingCustomerBalance = Math.max(0, totalOutstandingDue - effectiveTotalAmount);
  const fullySettledCount = distributionPreview.filter((d) => d.status === "PAID").length;
  const partialSettledCount = distributionPreview.filter((d) => d.status === "PARTIAL").length;

  const isOverPaying = effectiveTotalAmount > totalOutstandingDue;
  const isInvalidAmount = isLoading || effectiveTotalAmount <= 0 || isOverPaying;

  const handleSubmit = async () => {
    if (!customer?._id) return;
    if (isInvalidAmount) return;

    if (paymentMode === "SINGLE") {
      await onConfirmBulkSettle({
        customerId: customer._id,
        amount: effectiveTotalAmount,
        method: singleMethod,
        notes: notes.trim() || undefined,
      });
    } else {
      const payments: Array<{ amount: number; method: "CASH" | "UPI" | "CARD" | "OTHER" }> = [];
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      const cd = parseFloat(splitCard) || 0;
      const o = parseFloat(splitOther) || 0;
      if (c > 0) payments.push({ amount: c, method: "CASH" });
      if (u > 0) payments.push({ amount: u, method: "UPI" });
      if (cd > 0) payments.push({ amount: cd, method: "CARD" });
      if (o > 0) payments.push({ amount: o, method: "OTHER" });

      await onConfirmBulkSettle({
        customerId: customer._id,
        payments,
        notes: notes.trim() || undefined,
      });
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Bulk Due Settlement • Settle in One Go
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Accept a lump-sum payment and auto-distribute it across outstanding credit orders (oldest first).
            </DialogDescription>
          </DialogHeader>

          {/* Customer Summary Banner */}
          <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-slate-900/60 rounded-xl border border-amber-300/60 dark:border-amber-700/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {customer.name}
                  {customer.tags && (
                    <Badge variant="outline" className="text-[10px] uppercase font-extrabold px-1.5 py-0">
                      {customer.tags}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                    </span>
                  )}
                  <span>•</span>
                  <span>{isLoading ? "Loading outstanding invoices..." : `${sortedOrders.length} Outstanding Invoices`}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 dark:text-amber-300">
                Total Outstanding Due
              </div>
              <div className="text-xl font-black text-red-600 dark:text-red-400">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-auto" />
                ) : (
                  `₹${totalOutstandingDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <ScrollArea className="flex-1 p-5 space-y-4 max-h-[calc(90vh-230px)]">
          <div className="space-y-4 pr-1">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMode("SINGLE")}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  paymentMode === "SINGLE"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Single Tender
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("SPLIT")}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  paymentMode === "SPLIT"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                🔀 Split / Multi-Tender
              </button>
            </div>

            {/* Single Payment Mode Form */}
            {paymentMode === "SINGLE" ? (
              <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Amount Received to Settle (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSingleAmount(String(totalOutstandingDue))}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Settle Full (₹{totalOutstandingDue.toLocaleString("en-IN")})
                  </button>
                </div>
                <Input
                  type="number"
                  min="1"
                  max={totalOutstandingDue}
                  step="any"
                  placeholder="e.g. 3400"
                  value={singleAmount}
                  onChange={(e) => setSingleAmount(e.target.value)}
                  className="h-10 text-base font-black rounded-xl border-amber-300 dark:border-amber-700/60 focus-visible:ring-amber-500"
                  autoFocus
                />

                {/* Method selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "CASH", label: "Cash", icon: Banknote },
                      { id: "UPI", label: "UPI / QR", icon: QrCode },
                      { id: "CARD", label: "Card", icon: CreditCard },
                      { id: "OTHER", label: "Other", icon: Layers },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSingleMethod(id as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                          singleMethod === id
                            ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Split Payment Mode Form */
              <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Allocate Split Tender Amounts (₹)
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total: <strong className="text-slate-900 dark:text-white">₹{effectiveTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Banknote className="w-3 h-3 text-emerald-600" /> Cash (₹)
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="h-9 text-xs font-bold rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-blue-600" /> UPI / QR (₹)
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(e.target.value)}
                      className="h-9 text-xs font-bold rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-purple-600" /> Card (₹)
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value)}
                      className="h-9 text-xs font-bold rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-600" /> Other (₹)
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={splitOther}
                      onChange={(e) => setSplitOther(e.target.value)}
                      className="h-9 text-xs font-bold rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Overpay error message */}
            {isOverPaying && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Total payment (₹{effectiveTotalAmount.toFixed(2)}) cannot exceed total outstanding due (₹{totalOutstandingDue.toFixed(2)}).
                </span>
              </div>
            )}

            {/* FIFO Distribution Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" /> Live Settlement Distribution (Oldest First)
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {fullySettledCount} of {sortedOrders.length} will be fully cleared
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">Order / Date</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase">Original Due</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase text-emerald-600">Settle Amount</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase">Remaining</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributionPreview.map(({ order, due, applied, remaining, status }) => (
                      <TableRow
                        key={order._id}
                        className={
                          status === "PAID"
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                            : status === "PARTIAL"
                            ? "bg-blue-50/40 dark:bg-blue-950/20"
                            : ""
                        }
                      >
                        <TableCell className="py-2">
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            #ORD-{order._id.slice(-4).toUpperCase()}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "—"}{" "}
                            • {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : order.orderType}
                          </div>
                        </TableCell>

                        <TableCell className="text-right py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          ₹{due.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right py-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {applied > 0 ? `₹${applied.toFixed(2)}` : "—"}
                        </TableCell>

                        <TableCell className="text-right py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          ₹{remaining.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-center py-2">
                          {status === "PAID" && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0">
                              ✓ Paid
                            </Badge>
                          )}
                          {status === "PARTIAL" && (
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0">
                              Partial
                            </Badge>
                          )}
                          {status === "PENDING" && (
                            <Badge variant="outline" className="text-slate-400 text-[9px] font-bold px-1.5 py-0">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Notes field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Payment Notes / Cheque / Ref Number (Optional)
              </label>
              <Input
                placeholder="e.g. Paid by brother in cash / GPay UTR 98234..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer Summary & Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Paying: </span>
              <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                ₹{effectiveTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <div>
              <span className="text-muted-foreground">Remaining Balance: </span>
              <strong
                className={`text-sm font-black ${
                  remainingCustomerBalance === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                ₹{remainingCustomerBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                {remainingCustomerBalance === 0 && " (Cleared! 🎉)"}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || isInvalidAmount}
              onClick={handleSubmit}
              className="rounded-xl text-xs font-extrabold px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Settling Dues...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Confirm & Settle ₹
                  {effectiveTotalAmount.toLocaleString("en-IN")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

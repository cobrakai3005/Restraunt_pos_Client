"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Order } from "./types";

interface CashierDueHistoryDialogProps {
  order: Order | null;
  onClose: () => void;
}

export function CashierDueHistoryDialog({
  order,
  onClose,
}: CashierDueHistoryDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
            <History className="h-5 w-5 text-blue-600" />
            Credit Payment History
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Order #ORD-{order._id.slice(-4).toUpperCase()} • {order.customerDetails?.name || "Walk-in Guest"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Grand Total:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{order.financials?.grandTotal?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Total Paid:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ₹{(order.financials?.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Outstanding Due:</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                ₹{(order.financials?.dueAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Payment Records</h4>
            {!order.financials?.duePayments || order.financials.duePayments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No partial credit payments recorded yet.</p>
            ) : (
              order.financials.duePayments.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="text-emerald-600 font-extrabold">₹{p.amount.toFixed(2)}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase">
                        {p.method}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(p.receivedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {p.receivedBy &&
                        typeof p.receivedBy === "object" &&
                        (p.receivedBy as any).contactName && (
                          <span> • Recvd by {(p.receivedBy as any).contactName}</span>
                        )}
                    </div>
                    {p.notes && <div className="text-[10px] italic text-slate-500 mt-0.5">Note: {p.notes}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

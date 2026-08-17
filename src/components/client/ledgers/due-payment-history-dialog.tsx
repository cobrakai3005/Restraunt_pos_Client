"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { Order } from "./types";

interface DuePaymentHistoryDialogProps {
  order: Order | null;
  onClose: () => void;
}

export function DuePaymentHistoryDialog({ order, onClose }: DuePaymentHistoryDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Credit Payment History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border/60 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                #ORD-{order._id.slice(-4).toUpperCase()}
              </span>
              <div className="text-muted-foreground">
                {order.customerDetails?.name || "Walk-in Guest"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-amber-600">
                Remaining: ₹{(order.financials?.dueAmount || 0).toFixed(2)}
              </div>
              <div className="text-muted-foreground text-[10px]">
                Total: ₹{(order.financials?.grandTotal || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
            {(order.financials?.duePayments || []).length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No payment history records found.
              </div>
            ) : (
              (order.financials?.duePayments || []).map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border/50 bg-white dark:bg-slate-950 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400">
                      + ₹{p.amount.toFixed(2)} via {p.method}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(p.receivedAt).toLocaleString("en-IN")}
                    </div>
                    {p.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        "{p.notes}"
                      </div>
                    )}
                  </div>
                  {p.receivedBy && typeof p.receivedBy === "object" && (
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {(p.receivedBy as any).contactName || "Staff"}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, CheckCircle2, Clock, Check } from "lucide-react";
import { DueSummary } from "./types";

interface CustomerReceivablesKpisProps {
  dueSummary: DueSummary;
}

export function CustomerReceivablesKpis({ dueSummary }: CustomerReceivablesKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/20 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Outstanding Credit
            </p>
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
              ₹{dueSummary.totalOutstandingDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Unsettled receivables</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            <CreditCard className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Collected Credit
            </p>
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
              ₹{dueSummary.totalCollectedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Total recovered dues</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Credit Orders
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {dueSummary.activeDueCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pending / partial balance</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Clock className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Settled Orders
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {dueSummary.settledDueCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Fully paid credit orders</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Check className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

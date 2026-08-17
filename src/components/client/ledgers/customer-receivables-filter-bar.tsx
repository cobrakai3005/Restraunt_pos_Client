"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSearchSelect } from "@/components/ui/customer-search-select";
import { Loader2, Download, User } from "lucide-react";
import { Customer, Order } from "./types";

interface CustomerReceivablesFilterBarProps {
  dueCustomers: Customer[];
  dueCustomerId: string;
  setDueCustomerId: (id: string) => void;
  dueStatusFilter: string;
  setDueStatusFilter: (status: string) => void;
  dueFromDate: string;
  setDueFromDate: (date: string) => void;
  dueToDate: string;
  setDueToDate: (date: string) => void;
  setDuePage: (page: number | ((p: number) => number)) => void;
  isDueLoading: boolean;
  isDueExporting: boolean;
  dueOrders: Order[];
  onExportCSV: () => void;
}

export function CustomerReceivablesFilterBar({
  dueCustomers,
  dueCustomerId,
  setDueCustomerId,
  dueStatusFilter,
  setDueStatusFilter,
  dueFromDate,
  setDueFromDate,
  dueToDate,
  setDueToDate,
  setDuePage,
  isDueLoading,
  isDueExporting,
  dueOrders,
  onExportCSV,
}: CustomerReceivablesFilterBarProps) {
  const selectedCustomerObj = dueCustomers.find((c) => c._id === dueCustomerId);

  const custTotalDue = (() => {
    const ordersSum = dueOrders
      .filter(
        (o) =>
          o.financials?.dueStatus === "PENDING" ||
          o.financials?.dueStatus === "PARTIAL" ||
          Number(o.financials?.dueAmount || 0) > 0
      )
      .reduce((sum, o) => sum + Number(o.financials?.dueAmount || 0), 0);

    if (ordersSum > 0) return ordersSum;
    if (Number(selectedCustomerObj?.outstandingDue || 0) > 0) {
      return Number(selectedCustomerObj?.outstandingDue);
    }
    if (Number(selectedCustomerObj?.closingBalance || 0) > 0) {
      return Number(selectedCustomerObj?.closingBalance);
    }
    return ordersSum;
  })();

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {/* Searchable Customer Combobox */}
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Customer (Khata / Credit)
              </Label>
              <CustomerSearchSelect
                customers={dueCustomers}
                selectedCustomerId={dueCustomerId}
                onSelectCustomer={(cId) => {
                  setDueCustomerId(cId);
                  setDuePage(1);
                }}
                placeholder="Search customer by name / phone..."
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Credit Status
              </Label>
              <Select
                value={dueStatusFilter}
                onValueChange={(val) => {
                  setDueStatusFilter(val);
                  setDuePage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending (Full Credit)</SelectItem>
                  <SelectItem value="PARTIAL">Partial Credit</SelectItem>
                  <SelectItem value="PAID">Settled (Paid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">From Date</Label>
              <Input
                type="date"
                value={dueFromDate}
                onChange={(e) => {
                  setDueFromDate(e.target.value);
                  setDuePage(1);
                }}
                className="h-10 text-xs font-medium rounded-xl"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">To Date</Label>
              <Input
                type="date"
                value={dueToDate}
                onChange={(e) => {
                  setDueToDate(e.target.value);
                  setDuePage(1);
                }}
                className="h-10 text-xs font-medium rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onExportCSV}
              disabled={isDueExporting || isDueLoading || dueOrders.length === 0}
              className="gap-2 font-bold h-10 rounded-xl shadow-xs"
            >
              {isDueExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
          </div>
        </div>

        {/* Active Customer Filter Banner */}
        {dueCustomerId !== "ALL" && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <User className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span>
                  Viewing credit receivables for:{" "}
                  <strong>{selectedCustomerObj?.name || "Selected Customer"}</strong>{" "}
                  {selectedCustomerObj?.phone ? `(${selectedCustomerObj.phone})` : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 font-extrabold text-xs border border-amber-300 dark:border-amber-700">
                  Total Due:{" "}
                  <strong className="text-sm font-black text-red-600 dark:text-red-400">
                    ₹{custTotalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDueCustomerId("ALL");
                setDuePage(1);
              }}
              className="h-7 px-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg shrink-0"
            >
              ✕ Clear Customer Filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

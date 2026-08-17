"use client";

import { Customer, Order, DueSummary } from "./types";
import { CustomerReceivablesKpis } from "./customer-receivables-kpis";
import { CustomerReceivablesFilterBar } from "./customer-receivables-filter-bar";
import { CustomerReceivablesTable } from "./customer-receivables-table";

interface CustomerReceivablesTabProps {
  dueOrders: Order[];
  dueCustomers: Customer[];
  dueCustomerId: string;
  setDueCustomerId: (id: string) => void;
  dueSummary: DueSummary;
  isDueLoading: boolean;
  isDueExporting: boolean;
  dueStatusFilter: string;
  setDueStatusFilter: (status: string) => void;
  dueFromDate: string;
  setDueFromDate: (date: string) => void;
  dueToDate: string;
  setDueToDate: (date: string) => void;
  duePage: number;
  setDuePage: (page: number | ((p: number) => number)) => void;
  dueLimit: number;
  setDueLimit: (limit: number) => void;
  dueTotalItems: number;
  dueTotalPages: number;
  onExportCSV: () => void;
  onOpenCollect: (order: Order) => void;
  onViewHistory: (order: Order) => void;
}

export function CustomerReceivablesTab({
  dueOrders,
  dueCustomers,
  dueCustomerId,
  setDueCustomerId,
  dueSummary,
  isDueLoading,
  isDueExporting,
  dueStatusFilter,
  setDueStatusFilter,
  dueFromDate,
  setDueFromDate,
  dueToDate,
  setDueToDate,
  duePage,
  setDuePage,
  dueLimit,
  setDueLimit,
  dueTotalItems,
  dueTotalPages,
  onExportCSV,
  onOpenCollect,
  onViewHistory,
}: CustomerReceivablesTabProps) {
  return (
    <div className="space-y-6">
      {/* ── Summary KPI Cards ── */}
      <CustomerReceivablesKpis dueSummary={dueSummary} />

      {/* ── Filter Bar & Customer Search ── */}
      <CustomerReceivablesFilterBar
        dueCustomers={dueCustomers}
        dueCustomerId={dueCustomerId}
        setDueCustomerId={setDueCustomerId}
        dueStatusFilter={dueStatusFilter}
        setDueStatusFilter={setDueStatusFilter}
        dueFromDate={dueFromDate}
        setDueFromDate={setDueFromDate}
        dueToDate={dueToDate}
        setDueToDate={setDueToDate}
        setDuePage={setDuePage}
        isDueLoading={isDueLoading}
        isDueExporting={isDueExporting}
        dueOrders={dueOrders}
        onExportCSV={onExportCSV}
      />

      {/* ── Receivables Table & Pagination ── */}
      <CustomerReceivablesTable
        dueOrders={dueOrders}
        isDueLoading={isDueLoading}
        duePage={duePage}
        setDuePage={setDuePage}
        dueLimit={dueLimit}
        setDueLimit={setDueLimit}
        dueTotalItems={dueTotalItems}
        dueTotalPages={dueTotalPages}
        onOpenCollect={onOpenCollect}
        onViewHistory={onViewHistory}
      />
    </div>
  );
}

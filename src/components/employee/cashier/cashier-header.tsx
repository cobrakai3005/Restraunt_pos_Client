"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calculator, Menu, History } from "lucide-react";
import { Mode, TABS } from "./types";

interface CashierHeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  readyItemCount: number;
  pendingCount: number;
  onOpenDrawer?: () => void;
  onOpenZReport?: () => void;
  onOpenHistory?: () => void;
}

export function CashierHeader({
  mode,
  setMode,
  readyItemCount,
  pendingCount,
  onOpenDrawer,
  onOpenZReport,
  onOpenHistory,
}: CashierHeaderProps) {
  const router = useRouter();
  const activeTab = TABS.find((t) => t.id === mode) || TABS[0];

  const handleZReportClick = () => {
    if (onOpenZReport) {
      onOpenZReport();
    } else {
      router.push("/pos/register/close");
    }
  };

  return (
    <div className="shrink-0 z-20 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex items-center justify-between gap-3 overflow-x-auto">
      {/* ── Left: Menu Drawer & Terminal Title ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenDrawer && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenDrawer}
            title="Open Restaurant POS Menu & Settings"
            className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs shrink-0"
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>
        )}
        <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-800 text-white shadow-xs shrink-0">
          <Calculator className="h-4 w-4" />
        </div>
        <div className="hidden xl:block min-w-0">
          <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Cashier Terminal</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
            {activeTab.description}
          </p>
        </div>
      </div>

      {/* ── Center: Segmented Navigation Control ── */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 shadow-xs dark:border-slate-800 dark:bg-slate-950/80 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;

          const badge =
            tab.id === "kitchen"
              ? readyItemCount
              : tab.id === "billing"
              ? pendingCount
              : 0;

          return (
            <Button
              key={tab.id}
              size="sm"
              onClick={() => setMode(tab.id)}
              className={`relative h-9 rounded-xl px-3 md:px-3.5 text-xs font-extrabold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400"
                  : "border border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`mr-1.5 h-3.5 w-3.5 ${
                  isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              />

              <span>{tab.label}</span>

              {badge > 0 && (
                <span
                  className={`ml-1.5 flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isActive
                      ? "bg-white text-blue-700 shadow-xs"
                      : "bg-orange-500 text-white shadow-xs"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* ── Right: History & Z-Report Action Buttons ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Order History Button */}
        {onOpenHistory && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenHistory}
            title="View today's order history & reprint receipts"
            className="h-9 rounded-xl px-3 text-xs font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <History className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">History</span>
          </Button>
        )}

        {/* Day-End / Z-Report Action Button */}
        <Button
          size="sm"
          onClick={handleZReportClick}
          className="h-9 rounded-xl px-3.5 text-xs font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-black hover:to-slate-800 text-white dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-slate-700 dark:border-slate-600 shadow-xs flex items-center gap-1.5 transition-all"
          title="Open Cash Drawer & Day-End Z-Report Reconciliation"
        >
          <Calculator className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">End Day / Z-Report</span>
          <span className="sm:hidden">Z-Report</span>
        </Button>
      </div>
    </div>
  );
}

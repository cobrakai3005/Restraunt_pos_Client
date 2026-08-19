"use client";

import { Button } from "@/components/ui/button";
import { Calculator, Menu } from "lucide-react";
import { Mode, TABS } from "./types";

interface CashierHeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  readyItemCount: number;
  pendingCount: number;
  onOpenDrawer?: () => void;
  onOpenZReport?: () => void;
}

export function CashierHeader({
  mode,
  setMode,
  readyItemCount,
  pendingCount,
  onOpenDrawer,
  onOpenZReport,
}: CashierHeaderProps) {
  const activeTab = TABS.find((t) => t.id === mode) || TABS[0];

  return (
    <div className="shrink-0 z-20 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {onOpenDrawer && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenDrawer}
            title="Open Restaurant POS Menu & Settings"
            className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-800 text-white shadow-md">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Cashier Terminal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            {activeTab.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Day-End / Z-Report Action Button */}
        {onOpenZReport && (
          <Button
            size="sm"
            onClick={onOpenZReport}
            className="h-11 rounded-xl px-4 text-xs font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-black hover:to-slate-800 text-white dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-slate-700 dark:border-slate-600 shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            title="Open Cash Drawer & Day-End Z-Report Reconciliation"
          >
            <Calculator className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">End Day / Z-Report</span>
            <span className="sm:hidden">Z-Report</span>
          </Button>
        )}

        {/* Segmented control */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-inner">
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
                className={`relative h-11 rounded-xl px-4 text-sm font-extrabold transition-all duration-200 md:px-6 ${
                  isActive
                    ? "scale-105 bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                    : "border border-slate-200 bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`mr-2 h-4 w-4 ${
                    isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                />

                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.label.split(" ")[0]}</span>

                {badge > 0 && (
                  <span
                    className={`ml-2.5 flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-black ${
                      isActive
                        ? "bg-white text-blue-700 shadow-sm"
                        : "bg-orange-500 text-white shadow-sm"
                    }`}
                  >
                    {badge}
                  </span>
                )}

                {/* Active Underline */}
                {isActive && (
                  <span className="absolute -bottom-1 left-4 right-4 h-1 animate-pulse rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

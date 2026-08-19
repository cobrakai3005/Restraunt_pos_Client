"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, GitMerge, Split, Link2, Users } from "lucide-react";
import { Table, Order } from "./types";

interface TableFloorSidebarProps {
  tables: Table[];
  activeOrders: Order[];
  selectedTable: string;
  onSelectTable: (tableId: string) => void;
  onOpenMergeDialog: () => void;
  onUnmergeOrder: (order: Order | null, tableId?: string) => void;
}

export function TableFloorSidebar({
  tables,
  activeOrders,
  selectedTable,
  onSelectTable,
  onOpenMergeDialog,
  onUnmergeOrder,
}: TableFloorSidebarProps) {
  const freeTablesCount = tables.filter(
    (t) =>
      t.status === "AVAILABLE" &&
      !activeOrders.some((o) => {
        if (!o || o.status === "COMPLETED" || o.status === "CANCELLED" || o.status === "CLOSED" || o.status === "MERGED") {
          return false;
        }
        const tId = typeof o.tableId === "object" ? o.tableId?._id : o.tableId;
        const tNum = typeof o.tableId === "object" ? o.tableId?.tableNumber : (o as any).tableNumber;
        return (tId && String(tId) === String(t._id)) || (tNum && String(tNum) === String(t.tableNumber));
      })
  ).length;

  const activeTablesCount = tables.filter((t) =>
    activeOrders.some((o) => {
      if (!o || o.status === "COMPLETED" || o.status === "CANCELLED" || o.status === "CLOSED" || o.status === "MERGED") {
        return false;
      }
      const tId = typeof o.tableId === "object" ? o.tableId?._id : o.tableId;
      const tNum = typeof o.tableId === "object" ? o.tableId?.tableNumber : (o as any).tableNumber;
      return (tId && String(tId) === String(t._id)) || (tNum && String(tNum) === String(t.tableNumber));
    })
  ).length;

  return (
    <div className="hidden md:flex flex-col w-[225px] border-r border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 z-10 shrink-0 shadow-sm transition-colors backdrop-blur-xl">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Store className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Table Floor
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenMergeDialog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-bold transition-all active:scale-95 shadow-xs shrink-0"
            title="Merge two or more tables"
          >
            <GitMerge className="h-3.5 w-3.5 text-indigo-500" />
            <span>Merge</span>
          </button>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className="flex-1 text-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-1 rounded-md border border-emerald-500/20">
            {freeTablesCount} Free
          </span>
          <span className="flex-1 text-center bg-amber-500/10 text-amber-600 dark:text-amber-400 py-1 rounded-md border border-amber-500/20">
            {activeTablesCount} Active
          </span>
        </div>
      </div>

      {/* Tables Grid */}
      <ScrollArea className="flex-1 p-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {tables.map((t) => {
            const isMergedSecondary = t.status === "MERGED" || Boolean(t.mergedIntoTableId);
            const parentTableId = isMergedSecondary
              ? typeof t.mergedIntoTableId === "object"
                ? t.mergedIntoTableId?._id
                : t.mergedIntoTableId
              : null;
            const parentTable = parentTableId
              ? tables.find((pt) => String(pt._id) === String(parentTableId))
              : null;

            const order = activeOrders.find((o) => {
              if (!o || o.status === "COMPLETED" || o.status === "CANCELLED" || o.status === "CLOSED" || o.status === "MERGED") {
                return false;
              }
              const tId = typeof o.tableId === "object" ? o.tableId?._id : o.tableId;
              const tNum = typeof o.tableId === "object" ? o.tableId?.tableNumber : (o as any).tableNumber;
              return (tId && String(tId) === String(t._id)) || (tNum && String(tNum) === String(t.tableNumber));
            });

            const isOccupied = !isMergedSecondary && (!!order || t.status === "OCCUPIED" || (t as any).isOccupied === true);
            const isMergedParent = tables.some((st) => {
              const pId = typeof st.mergedIntoTableId === "object" ? st.mergedIntoTableId?._id : st.mergedIntoTableId;
              return pId && String(pId) === String(t._id);
            }) || Boolean(order?.tableIds && Array.isArray(order.tableIds) && order.tableIds.length > 1);

            let hasReady = false;
            if (order) {
              order.kots?.forEach((kot) => {
                kot.items?.forEach((item) => {
                  if (item.itemStatus === "READY") hasReady = true;
                });
              });
            }

            const isSelected = selectedTable === t._id;
            const showHoverOverlay = isMergedParent || isMergedSecondary || (isOccupied && !!order);

            return (
              <div
                key={t._id}
                onClick={() => onSelectTable(t._id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[104px] relative overflow-hidden active:scale-95 group select-none ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-sm"
                    : isMergedSecondary
                    ? "border-indigo-300/80 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-white dark:via-slate-900 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/40 hover:border-indigo-400 shadow-xs"
                    : isOccupied
                    ? "border-amber-400/80 dark:border-amber-700/70 bg-gradient-to-br from-amber-50/80 via-amber-50/30 dark:via-slate-900 to-orange-50/30 dark:from-amber-950/40 dark:to-orange-950/30 hover:border-amber-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 shadow-xs"
                }`}
              >
                {/* Top Row: Table Name & Status Pill/Dot */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-black text-xs leading-tight truncate ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : isMergedSecondary
                        ? "text-indigo-950 dark:text-indigo-200"
                        : "text-slate-900 dark:text-white"
                    }`}
                    title={t.tableNumber}
                  >
                    {t.tableNumber}
                  </span>

                  {hasReady ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-ping shrink-0"
                      title="Food Ready"
                    />
                  ) : isMergedSecondary ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-100/90 dark:bg-indigo-900/70 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      <Link2 className="h-2.5 w-2.5" />
                      <span>T-{parentTable?.tableNumber || "?"}</span>
                    </div>
                  ) : isOccupied ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] shrink-0"
                      title="Occupied"
                    />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-emerald-500/40 shrink-0" title="Available" />
                  )}
                </div>

                {/* Middle Content */}
                {isMergedSecondary ? (
                  <div className="my-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100/70 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs">
                      <GitMerge className="h-4 w-4" />
                    </div>
                  </div>
                ) : isOccupied ? (
                  <div className="my-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-800/90 dark:text-amber-300">
                    <Users className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Active</span>
                  </div>
                ) : (
                  <div className="my-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    <Users className="h-3 w-3 shrink-0" />
                    <span>{t.capacity} Seats</span>
                  </div>
                )}

                {/* Bottom Row */}
                <div className="flex items-center justify-between gap-1 mt-auto">
                  {isMergedSecondary ? (
                    <span className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100/90 dark:bg-indigo-900/60 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                      Merged
                    </span>
                  ) : isOccupied ? (
                    <>
                      <span className="text-[11px] font-mono font-black text-amber-700 dark:text-amber-400 truncate">
                        {order ? `#${String(order.orderNumber || order._id || "").slice(-4)}` : "Occupied"}
                      </span>
                      {isMergedParent && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg bg-indigo-100/90 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                          MERGED
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-lg border border-emerald-200/40">
                      Available
                    </span>
                  )}
                </div>

                {/* Hover Action Overlay */}
                {showHoverOverlay && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-900/95 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center gap-1.5 p-2 z-10">
                    {order && (() => {
                      const allItems = order.kots?.flatMap((k) => k.items || []) || [];
                      const totalQty = allItems.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
                      const totalAmt = allItems.reduce(
                        (s: number, i: any) => s + (i.variantPrice || 0) * (i.quantity || 1),
                        0
                      );
                      return (
                        <div className="text-center leading-tight">
                          <span className="text-[10px] font-bold text-white/90 block">
                            {totalQty} item{totalQty !== 1 ? "s" : ""}
                          </span>
                          {totalAmt > 0 && (
                            <span className="text-[11px] font-black text-emerald-400 block mt-0.5">
                              ₹{totalAmt.toFixed(0)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {(isMergedParent || isMergedSecondary) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnmergeOrder(order || null, t._id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all active:scale-95 shadow-md"
                        title="Unmerge table"
                      >
                        <Split className="h-3 w-3" /> Unmerge
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

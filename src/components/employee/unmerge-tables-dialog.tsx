"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  Split,
  Utensils,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Minus,
  Plus,
  Info,
} from "lucide-react";
import { employeeService } from "@/services/employee.service";

interface UnmergeTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryOrder: any;
  tables: any[];
  onUnmergeSuccess?: (result: any) => void;
  preselectedUnmergeTableId?: string;
}

export function UnmergeTablesDialog({
  open,
  onOpenChange,
  primaryOrder,
  tables,
  onUnmergeSuccess,
  preselectedUnmergeTableId,
}: UnmergeTablesDialogProps) {
  const { toast } = useToast();

  const [unmergeTableId, setUnmergeTableId] = useState<string>("");
  const [unmergedGuestCount, setUnmergedGuestCount] = useState<number>(2);
  const [itemSelections, setItemSelections] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter linked secondary tables that can be unmerged
  const primaryTableId = String(primaryOrder?.tableId?._id || primaryOrder?.tableId || "");
  const linkedTableIds: string[] = useMemo(() => {
    if (primaryOrder?.tableIds && Array.isArray(primaryOrder.tableIds) && primaryOrder.tableIds.length > 0) {
      return primaryOrder.tableIds
        .map((t: any) => String(t?._id || t))
        .filter((id: string) => id !== primaryTableId);
    }
    // Fallback for vacant merged tables or secondary table target
    return tables
      .filter((t) => t.status === "MERGED" && t.mergedIntoTableId)
      .map((t) => t._id);
  }, [primaryOrder, primaryTableId, tables]);

  useEffect(() => {
    if (open) {
      if (preselectedUnmergeTableId && linkedTableIds.includes(preselectedUnmergeTableId)) {
        setUnmergeTableId(preselectedUnmergeTableId);
      } else {
        setUnmergeTableId(linkedTableIds[0] || "");
      }
      setItemSelections({});
      setUnmergedGuestCount(2);
    }
  }, [open, preselectedUnmergeTableId, linkedTableIds]);

  const updateItemQty = (kotId: string, itemId: string, maxQty: number, delta: number) => {
    const key = `${kotId}_${itemId}`;
    setItemSelections((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: next };
    });
  };

  const handleUnmergeSubmit = async () => {
    if (!unmergeTableId) {
      toast({
        variant: "destructive",
        title: "Select Table to Unmerge",
        description: "Please choose which table you want to separate from this order.",
      });
      return;
    }

    const formattedItemSelections = Object.entries(itemSelections).map(([key, qty]) => {
      const [kotId, itemId] = key.split("_");
      return {
        kotId,
        itemId,
        quantity: qty,
      };
    });

    setIsSubmitting(true);
    try {
      const payload: any = {
        unmergeTableId,
        itemSelections: formattedItemSelections,
        unmergedGuestCount: Math.max(1, unmergedGuestCount),
      };
      if (primaryOrder?._id) {
        payload.orderId = primaryOrder._id;
      }

      const res = await employeeService.unmergeTables(payload);
      toast({
        title: "✅ Table Unmerged Successfully",
        description: `Table ${tables.find((t) => t._id === unmergeTableId)?.tableNumber || ""} separated into its own order.`,
      });

      onUnmergeSuccess?.(res.data);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Unmerge Failed",
        description: err.response?.data?.message || err.message || "Failed to unmerge table.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMovedCount = Object.values(itemSelections).reduce((sum, q) => sum + q, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
              <Split className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black">Unmerge Tables &amp; Split Items</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Separate a linked table from this order and optionally transfer specific KOT items to it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
            {/* Step 1: Choose Table to Unmerge */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1. Select Table to Unmerge
              </Label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Primary Table is{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  Table {tables.find((t) => t._id === primaryTableId)?.tableNumber || primaryTableId}
                </span>
                . Choose which secondary table to detach:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {linkedTableIds.map((id) => {
                  const tab = tables.find((t) => t._id === id);
                  const isSelected = unmergeTableId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setUnmergeTableId(id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      🍽️ Table {tab?.tableNumber || id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Covers for Unmerged Table */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  2. Covers for Separated Table
                </Label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Guest count assigned to the newly separated table
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnmergedGuestCount((g) => Math.max(1, g - 1))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  -
                </button>
                <span className="w-6 text-center font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                  {unmergedGuestCount}
                </span>
                <button
                  type="button"
                  onClick={() => setUnmergedGuestCount((g) => g + 1)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Step 3: Item Transfer Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  3. Select Items to Transfer to Separated Table
                </Label>
                <Badge variant="outline" className="text-xs font-mono">
                  {selectedMovedCount} Items Selected to Move
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Items not selected will remain on the Primary Table. If no items are moved, the table will simply be released.
              </p>

              <div className="space-y-3 pt-1">
                {(primaryOrder?.kots || []).map((kot: any) => (
                  <div
                    key={kot._id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        KOT #{kot.kotNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {kot.items?.length || 0} items
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(kot.items || []).map((item: any) => {
                        const key = `${kot._id}_${item._id}`;
                        const selectedQty = itemSelections[key] || 0;
                        const maxQty = item.quantity || 1;
                        const itemName = item.menuItemId?.name || "Item";

                        return (
                          <div
                            key={item._id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                              selectedQty > 0
                                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                            }`}
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {itemName} - {item.variantName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ₹{item.variantPrice} × Total Qty: {maxQty}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-500">
                                Move:
                              </span>
                              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(kot._id, item._id, maxQty, -1)}
                                  disabled={selectedQty === 0}
                                  className="h-5 w-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center font-black text-xs text-indigo-600 dark:text-indigo-400">
                                  {selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(kot._id, item._id, maxQty, 1)}
                                  disabled={selectedQty >= maxQty}
                                  className="h-5 w-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs font-bold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleUnmergeSubmit}
            disabled={!unmergeTableId || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-6 h-10 rounded-xl shadow-md shadow-indigo-600/30 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Separating...</span>
              </>
            ) : (
              <>
                <Split className="h-4 w-4" />
                <span>Confirm &amp; Unmerge Table</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

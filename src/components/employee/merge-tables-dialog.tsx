"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Users,
  Utensils,
  Percent,
  UserCheck,
  Loader2,
  Info,
} from "lucide-react";
import { employeeService } from "@/services/employee.service";

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  mergedIntoTableId?: any;
}

interface MergeTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: Table[];
  activeOrders: any[];
  onMergeSuccess?: (result: any) => void;
  preselectedTableId?: string;
}

export function MergeTablesDialog({
  open,
  onOpenChange,
  tables,
  activeOrders,
  onMergeSuccess,
  preselectedTableId,
}: MergeTablesDialogProps) {
  const { toast } = useToast();

  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [primaryTableId, setPrimaryTableId] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(2);

  const [checking, setChecking] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolved Customer Conflict state
  const [selectedCustomerChoice, setSelectedCustomerChoice] = useState<string>("PRIMARY");
  const [customCustName, setCustomCustName] = useState<string>("");
  const [customCustPhone, setCustomCustPhone] = useState<string>("");
  const [customCustId, setCustomCustId] = useState<string | null>(null);

  // Resolved Discount Conflict state
  const [selectedDiscountChoice, setSelectedDiscountChoice] = useState<string>("PRIMARY");
  const [customDiscountType, setCustomDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED" | "MANUAL">("NONE");
  const [customDiscountValue, setCustomDiscountValue] = useState<number>(0);
  const [customDiscountReason, setCustomDiscountReason] = useState<string>("");

  // Initialize selection when opened
  useEffect(() => {
    if (open) {
      if (preselectedTableId) {
        setSelectedTableIds([preselectedTableId]);
        setPrimaryTableId(preselectedTableId);
      } else {
        setSelectedTableIds([]);
        setPrimaryTableId("");
      }
      setConflictData(null);
      setSelectedCustomerChoice("PRIMARY");
      setSelectedDiscountChoice("PRIMARY");
    }
  }, [open, preselectedTableId]);

  // Run conflict check whenever selected tables change
  useEffect(() => {
    if (selectedTableIds.length >= 2) {
      checkConflicts(selectedTableIds);
    } else {
      setConflictData(null);
    }
  }, [selectedTableIds]);

  const checkConflicts = async (ids: string[]) => {
    setChecking(true);
    try {
      const res = await employeeService.checkMergeConflicts(ids);
      if (res?.data) {
        setConflictData(res.data);
        if (res.data.totalCombinedGuestCount) {
          setGuestCount(res.data.totalCombinedGuestCount);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to verify table merge conditions";
      setConflictData({
        canMerge: false,
        blockedReason: msg,
      });
    } finally {
      setChecking(false);
    }
  };

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((prev) => {
      let updated: string[];
      if (prev.includes(tableId)) {
        updated = prev.filter((id) => id !== tableId);
        if (primaryTableId === tableId) {
          setPrimaryTableId(updated[0] || "");
        }
      } else {
        updated = [...prev, tableId];
        if (!primaryTableId) {
          setPrimaryTableId(tableId);
        }
      }
      return updated;
    });
  };

  const handleMergeSubmit = async () => {
    if (selectedTableIds.length < 2) {
      toast({
        variant: "destructive",
        title: "Select at least 2 tables",
        description: "You must select a primary table and at least one secondary table to merge.",
      });
      return;
    }

    if (!primaryTableId) {
      toast({
        variant: "destructive",
        title: "Select a Primary Table",
        description: "Please choose which table will be the authoritative primary table.",
      });
      return;
    }

    const secondaryTableIds = selectedTableIds.filter((id) => id !== primaryTableId);

    // Build resolved customer details if resolved
    let resolvedCustomerDetails: any = undefined;
    if (conflictData?.hasCustomerConflict) {
      if (selectedCustomerChoice === "NONE") {
        resolvedCustomerDetails = { name: "", phone: "", customerId: null };
      } else if (selectedCustomerChoice !== "PRIMARY") {
        const found = conflictData.conflictingCustomers?.find(
          (c: any) => String(c.tableId) === selectedCustomerChoice
        );
        if (found) {
          resolvedCustomerDetails = {
            name: found.name,
            phone: found.phone,
            customerId: found.customerId || null,
          };
        }
      }
    }

    // Build resolved discount if resolved
    let resolvedDiscount: any = undefined;
    if (conflictData?.hasDiscountConflict) {
      if (selectedDiscountChoice === "NONE") {
        resolvedDiscount = { discountType: "NONE", discountValue: 0, discountReason: "" };
      } else if (selectedDiscountChoice !== "PRIMARY") {
        const found = conflictData.conflictingDiscounts?.find(
          (d: any) => String(d.tableId) === selectedDiscountChoice
        );
        if (found) {
          resolvedDiscount = {
            discountType: found.discountType,
            discountValue: found.discountValue,
            discountReason: found.discountReason,
          };
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        primaryTableId,
        secondaryTableIds,
        guestCount: Math.max(1, guestCount),
        resolvedCustomerDetails,
        resolvedDiscount,
      };

      const res = await employeeService.mergeTables(payload);
      toast({
        title: "✅ Tables Merged Successfully",
        description: `Tables successfully combined into Primary Table ${
          tables.find((t) => t._id === primaryTableId)?.tableNumber || ""
        }.`,
      });

      onMergeSuccess?.(res.data);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Merge Failed",
        description: err.response?.data?.message || err.message || "Failed to merge tables.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black">Merge Tables</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Combine 2 or more table orders into a single authoritative order with combined KOTs &amp; covers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
            {/* Step 1: Table Selector Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  1. Select Tables ({selectedTableIds.length} selected)
                </Label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click to select 2 or more tables
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {tables.map((t) => {
                  const isSelected = selectedTableIds.includes(t._id);
                  const isPrimary = primaryTableId === t._id;
                  const activeOrder = activeOrders.find(
                    (o) =>
                      (o.tableId?._id === t._id || o.tableId === t._id) &&
                      (o.status === "OPEN" || o.status === "BILLED")
                  );
                  const isBilled = activeOrder?.status === "BILLED";
                  const isMerged = t.status === "MERGED";

                  return (
                    <div
                      key={t._id}
                      onClick={() => !isBilled && toggleTableSelection(t._id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between relative select-none ${
                        isBilled
                          ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                          : isSelected
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/50 shadow-md"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Table {t.tableNumber}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>{t.capacity} Seats</span>
                        {isBilled ? (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">Billed</Badge>
                        ) : activeOrder ? (
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] px-1 py-0">
                            Active
                          </Badge>
                        ) : isMerged ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">Merged</Badge>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Free</span>
                        )}
                      </div>

                      {isPrimary && (
                        <div className="absolute -top-2 -right-1 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                          PRIMARY
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Primary Table Selection */}
            {selectedTableIds.length >= 2 && (
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  2. Choose Primary (Authoritative) Table
                </Label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  All KOTs, kitchen tickets, and billing will be consolidated under this table.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedTableIds.map((id) => {
                    const tab = tables.find((t) => t._id === id);
                    const isSelected = primaryTableId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPrimaryTableId(id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        🍽️ Table {tab?.tableNumber} {isSelected && "★ Primary"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conflict & Validation Report */}
            {checking ? (
              <div className="flex items-center justify-center p-6 gap-2 text-xs font-bold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Checking orders and table compatibility...</span>
              </div>
            ) : conflictData ? (
              <div className="space-y-4">
                {!conflictData.canMerge ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm">Cannot Merge Selected Tables</h4>
                      <p className="text-xs mt-1">{conflictData.blockedReason}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Customer Conflict Resolver */}
                    {conflictData.hasCustomerConflict && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                          <UserCheck className="h-4 w-4" />
                          <h4 className="font-extrabold text-xs uppercase tracking-wider">
                            Customer Details Conflict Detected
                          </h4>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Different customer names or phones exist on the selected tables. Choose which customer profile to retain on the merged order:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {conflictData.conflictingCustomers?.map((cust: any) => (
                            <div
                              key={cust.tableId}
                              onClick={() => setSelectedCustomerChoice(String(cust.tableId))}
                              className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                                selectedCustomerChoice === String(cust.tableId)
                                  ? "border-amber-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500"
                                  : "border-amber-300/60 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 bg-amber-100/30 dark:bg-amber-950/20"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold">Table {cust.tableNumber}</span>
                                {selectedCustomerChoice === String(cust.tableId) && (
                                  <Badge className="bg-amber-600 text-white text-[9px]">Selected</Badge>
                                )}
                              </div>
                              <p className="mt-1 text-slate-600 dark:text-slate-400">
                                {cust.name || "Walk-in"} {cust.phone ? `(${cust.phone})` : ""}
                              </p>
                            </div>
                          ))}

                          <div
                            onClick={() => setSelectedCustomerChoice("NONE")}
                            className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                              selectedCustomerChoice === "NONE"
                                ? "border-amber-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500"
                                : "border-amber-300/60 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 bg-amber-100/30 dark:bg-amber-950/20"
                            }`}
                          >
                            <span className="font-extrabold">Clear / Walk-in Guest</span>
                            <p className="mt-1 text-slate-500 text-[11px]">Don't attach any specific customer profile</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Discount Conflict Resolver */}
                    {conflictData.hasDiscountConflict && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                          <Percent className="h-4 w-4" />
                          <h4 className="font-extrabold text-xs uppercase tracking-wider">
                            Discount Conflict Detected
                          </h4>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Multiple tables have different discounts applied. Choose which discount rule to keep:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {conflictData.conflictingDiscounts?.map((disc: any) => (
                            <div
                              key={disc.tableId}
                              onClick={() => setSelectedDiscountChoice(String(disc.tableId))}
                              className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                                selectedDiscountChoice === String(disc.tableId)
                                  ? "border-amber-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500"
                                  : "border-amber-300/60 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 bg-amber-100/30 dark:bg-amber-950/20"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold">Table {disc.tableNumber}</span>
                                <Badge className="bg-emerald-600 text-white text-[9px]">
                                  {disc.discountType === "PERCENTAGE" ? `${disc.discountValue}% OFF` : `₹${disc.discountValue} OFF`}
                                </Badge>
                              </div>
                              <p className="mt-1 text-slate-500 text-[11px]">
                                {disc.discountReason || "General discount"}
                              </p>
                            </div>
                          ))}

                          <div
                            onClick={() => setSelectedDiscountChoice("NONE")}
                            className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                              selectedDiscountChoice === "NONE"
                                ? "border-amber-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500"
                                : "border-amber-300/60 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 bg-amber-100/30 dark:bg-amber-950/20"
                            }`}
                          >
                            <span className="font-extrabold">No Discount</span>
                            <p className="mt-1 text-slate-500 text-[11px]">Reset discount to zero on merged order</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Merge Summary Preview */}
                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="h-4 w-4" /> Merge Summary Preview
                        </span>
                        <Badge className="bg-blue-600 text-white font-mono text-xs">
                          {selectedTableIds.length} Tables
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/50 dark:border-blue-900/50">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Total Covers
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                              className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                              {guestCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setGuestCount((g) => g + 1)}
                              className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/50 dark:border-blue-900/50">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Total Items
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white block mt-1">
                            {conflictData.totalItemsCount || 0}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/50 dark:border-blue-900/50">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Est. Subtotal
                          </span>
                          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 block mt-1">
                            ₹{conflictData.estimatedSubtotal || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
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
            onClick={handleMergeSubmit}
            disabled={
              selectedTableIds.length < 2 ||
              !primaryTableId ||
              checking ||
              isSubmitting ||
              (conflictData && !conflictData.canMerge)
            }
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-6 h-10 rounded-xl shadow-md shadow-blue-600/30 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Merging...</span>
              </>
            ) : (
              <>
                <GitMerge className="h-4 w-4" />
                <span>Confirm &amp; Merge Tables</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, AlertCircle, RotateCcw, Check } from "lucide-react";

interface ComplimentaryItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    _id: string;
    name?: string;
    menuItemId?: { name: string };
    variantName?: string;
    variantPrice: number;
    quantity: number;
    isComplimentary?: boolean;
    complimentaryReason?: string;
  } | null;
  onConfirm: (itemId: string, isComplimentary: boolean, reason?: string) => Promise<void>;
}

const REASON_PRESETS = [
  "VIP / Owner Guest",
  "Food Quality Issue / Delayed Item",
  "Chef / Staff Tasting",
  "Customer Loyalty & Promo",
  "Manager Discretion",
];

export function ComplimentaryItemDialog({
  isOpen,
  onClose,
  item,
  onConfirm,
}: ComplimentaryItemDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isCurrentlyComp = Boolean(item?.isComplimentary);
  const itemName = item?.menuItemId?.name || item?.name || "Item";
  const unitPrice = item?.variantPrice || 0;
  const quantity = item?.quantity || 1;
  const totalWaived = unitPrice * quantity;

  useEffect(() => {
    if (item) {
      setReason(item.complimentaryReason || "");
      setError("");
    }
  }, [item, isOpen]);

  const handleSubmit = async (makeComplimentary: boolean) => {
    if (!item) return;
    if (makeComplimentary && !reason.trim()) {
      setError("Please specify a reason for marking this item as complimentary.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onConfirm(item._id, makeComplimentary, makeComplimentary ? reason.trim() : undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update complimentary status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header banner */}
        <div className={`p-5 text-white ${isCurrentlyComp ? "bg-gradient-to-r from-amber-600 to-orange-600" : "bg-gradient-to-r from-purple-600 to-indigo-600"}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-white">
                {isCurrentlyComp ? "Manage Complimentary Item" : "Mark Item as Complimentary (FOC)"}
              </DialogTitle>
              <p className="text-xs text-white/80 mt-0.5">
                {isCurrentlyComp ? "Remove FOC or update reason" : "Free of Charge — ₹0.00 customer billing"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Item details card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase">{itemName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {quantity}x • {item.variantName} (₹{unitPrice.toFixed(2)} / unit)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Waived Amount</span>
              <span className="text-base font-black text-purple-600 dark:text-purple-400">
                ₹{totalWaived.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reason presets */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Preset Reason
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setError("");
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    reason === preset
                      ? "bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          <div className="space-y-1.5">
            <Label htmlFor="comp-reason" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Complimentary Reason <span className="text-red-500">*</span>
            </Label>
            <Input
              id="comp-reason"
              placeholder="e.g. Table requested manager compensation"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              className="h-10 text-xs font-semibold rounded-xl"
            />
            <p className="text-[10px] text-slate-400">
              * Inventory &amp; recipe stock will continue to deduct normally for audit and cost accounting.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
          {isCurrentlyComp ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-xl gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Revert to Normal Billing
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl px-4 gap-1.5 shadow-md shadow-purple-600/20"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isCurrentlyComp ? "Update Reason" : "Confirm Complimentary (FOC)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

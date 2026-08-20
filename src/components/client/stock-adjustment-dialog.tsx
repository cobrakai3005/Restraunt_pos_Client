"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem } from "@/services/inventory.service";
import { stockLogService } from "@/services/stockLog.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Sliders, TrendingUp, TrendingDown } from "lucide-react";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  restaurantId: string;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
  restaurantId,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [physicalCount, setPhysicalCount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setPhysicalCount(String(item.currentStock));
      setNotes("");
    }
  }, [item, open]);

  if (!item) return null;

  const currentStock = item.currentStock || 0;
  const countNum = Number(physicalCount);
  const isValidCount = !isNaN(countNum) && countNum >= 0;
  const variance = isValidCount ? Number((countNum - currentStock).toFixed(4)) : 0;
  const varianceValue = Math.abs(variance) * (item.costPerUnit || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCount) {
      toast({ variant: "destructive", title: "Please enter a valid physical count" });
      return;
    }

    if (variance === 0) {
      toast({ title: "No Change", description: "Physical count matches current stock." });
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      const type = variance > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
      await stockLogService.adjustStock(
        item._id,
        {
          type,
          quantity: Math.abs(variance),
          unit: item.unit,
          reason: "PHYSICAL_COUNT_AUDIT",
          notes: notes || "Physical stock count reconciliation audit",
        },
        restaurantId
      );

      toast({
        title: "Stock Reconciled",
        description: `Updated stock to ${countNum} ${item.unit} (Variance: ${variance > 0 ? "+" : ""}${variance}).`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to adjust stock",
        description: err?.response?.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Sliders className="w-5 h-5 text-blue-600" />
            Stock Count Audit & Quick Adjust
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Item Info Banner */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white text-base">{item.name}</div>
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Current Recorded Stock: <strong className="text-slate-800 dark:text-slate-200">{currentStock} {item.unit}</strong></span>
              <span>Rate: <strong className="text-slate-800 dark:text-slate-200">₹{item.costPerUnit} / {item.unit}</strong></span>
            </div>
          </div>

          {/* Physical Count Input */}
          <div className="space-y-2">
            <Label>Actual Physical Count ({item.unit}) *</Label>
            <Input
              type="number"
              min="0"
              step="0.0001"
              required
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
              placeholder="Enter counted quantity"
              className="text-lg font-bold"
            />
          </div>

          {/* Variance Card */}
          {isValidCount && variance !== 0 && (
            <div className={`p-3 rounded-lg border text-sm space-y-1 ${
              variance > 0 
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            }`}>
              <div className="flex justify-between items-center font-semibold">
                <span className="flex items-center gap-1.5">
                  {variance > 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-amber-600" />}
                  {variance > 0 ? "Surplus Detected (Stock In)" : "Deficit / Missing (Stock Out)"}
                </span>
                <span>{variance > 0 ? `+${variance}` : variance} {item.unit}</span>
              </div>
              <div className="text-xs flex justify-between opacity-80">
                <span>Financial Impact:</span>
                <span className="font-semibold">₹{varianceValue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Audit Notes (Optional)</Label>
            <Textarea
              placeholder="e.g. Weekly physical inventory count discrepancy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValidCount} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Adjustment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

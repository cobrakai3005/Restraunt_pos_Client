"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "@/services/inventory.service";
import { stockLogService } from "@/services/stockLog.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { getCompatibleUnits, convertUOM } from "@/lib/uomConverter";

interface LogWastageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  restaurantId: string;
  onSuccess: () => void;
}

const WASTAGE_REASONS = [
  { value: "EXPIRED", label: "🥛 Expired / Spoiled" },
  { value: "BURNT_COOKING_ERROR", label: "🔥 Burnt / Cooking Mistake" },
  { value: "SPILLAGE_BREAKAGE", label: "💥 Spillage / Dropped / Broken" },
  { value: "STAFF_MEAL", label: "👥 Staff Meal / Tasting" },
  { value: "CUSTOMER_RETURN", label: "↩️ Customer Returned / Rejected" },
  { value: "THEFT_MISSING", label: "❓ Theft / Unaccounted Missing" },
  { value: "OTHER", label: "📝 Other Reason" },
];

export function LogWastageDialog({
  open,
  onOpenChange,
  item,
  restaurantId,
  onSuccess,
}: LogWastageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [reason, setReason] = useState("EXPIRED");
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const baseUnit = item.unit || "PCS";
  const compatibleUnits = getCompatibleUnits(baseUnit);
  const currentUnit = selectedUnit || baseUnit;

  const rawQty = Number(quantity) || 0;
  const convertedQty = convertUOM(rawQty, currentUnit, baseUnit);
  const lossValue = convertedQty * (item.costPerUnit || 0);
  const newProjectedStock = Math.max(0, item.currentStock - convertedQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawQty <= 0) {
      toast({ variant: "destructive", title: "Please enter a valid quantity greater than 0" });
      return;
    }

    try {
      setLoading(true);
      await stockLogService.adjustStock(
        item._id,
        {
          type: "WASTAGE",
          quantity: rawQty,
          unit: currentUnit,
          reason,
          notes,
        },
        restaurantId
      );

      toast({
        title: "Wastage Logged",
        description: `Logged ${rawQty} ${currentUnit} waste for ${item.name}. Stock updated.`,
      });
      onSuccess();
      onOpenChange(false);
      setQuantity("");
      setNotes("");
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to log wastage",
        description: err?.response?.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Log Stock Wastage & Spoilage
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Item Info Banner */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white text-base">{item.name}</div>
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Current Stock: <strong className="text-slate-800 dark:text-slate-200">{item.currentStock} {item.unit}</strong></span>
              <span>Unit Cost: <strong className="text-slate-800 dark:text-slate-200">₹{item.costPerUnit} / {item.unit}</strong></span>
            </div>
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Quantity Wasted *</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                required
                placeholder="e.g. 250"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={currentUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleUnits.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Wastage Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {WASTAGE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Details (Optional)</Label>
            <Textarea
              placeholder="e.g. Found expired during morning prep, burnt in oven during lunch rush..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Live Loss Financial Summary */}
          {rawQty > 0 && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 rounded-lg text-sm space-y-1">
              <div className="flex justify-between items-center text-red-900 dark:text-red-200">
                <span className="font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Estimated Financial Loss:
                </span>
                <span className="font-bold text-base text-red-600">₹{lossValue.toFixed(2)}</span>
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 flex justify-between">
                <span>Stock After Wastage:</span>
                <span>{newProjectedStock.toFixed(3)} {baseUnit}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || rawQty <= 0} className="bg-red-600 hover:bg-red-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Wastage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

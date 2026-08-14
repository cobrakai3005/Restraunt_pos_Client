"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Variant {
  _id?: string;
  name: string;
  price: number;
}

interface VariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemImage?: string;
  variants: Variant[];
  onSelect: (variant: Variant) => void;
}

export function VariantPickerDialog({ open, onOpenChange, itemName, itemImage, variants, onSelect }: VariantPickerDialogProps) {
  const handleSelect = (variant: Variant) => {
    onSelect(variant);
    onOpenChange(false);
  };

  // Keyboard shortcut listener: ONLY active when dialog is OPEN and user is NOT typing in an input
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= variants.length) {
        e.preventDefault();
        handleSelect(variants[num - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, variants]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl overflow-hidden p-0 gap-0">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg text-slate-900 dark:text-white flex items-start gap-3">
              {itemImage && (
                <img src={itemImage} alt={itemName} className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
              )}
              <span className="leading-snug">{itemName}</span>
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Choose a variant</span>
            <span className="text-[10px] text-blue-500 font-mono">Press [1], [2] to select</span>
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {variants.map((variant, idx) => (
            <Button
              key={variant._id || variant.name}
              variant="outline"
              className="w-full justify-between h-14 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group"
              onClick={() => handleSelect(variant)}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                <kbd className="h-5 w-5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-500 flex items-center justify-center">
                  {idx + 1}
                </kbd>
                {variant.name}
              </span>
              <Badge className="bg-blue-600 dark:bg-blue-500 text-white">
                ₹{variant.price.toFixed(2)}
              </Badge>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

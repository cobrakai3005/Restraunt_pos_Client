"use client";

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
  if (!open) return null;

  const handleSelect = (variant: Variant) => {
    onSelect(variant);
    onOpenChange(false);
  };

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
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Choose a variant to add
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {variants.map(variant => (
            <Button
              key={variant._id || variant.name}
              variant="outline"
              className="w-full justify-between h-14 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group"
              onClick={() => handleSelect(variant)}
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
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

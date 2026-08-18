"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Check, ShoppingCart } from "lucide-react";
import { ModifierGroup, ModifierOption } from "@/services/menu.service";

export interface Variant {
  _id?: string;
  name: string;
  price: number;
}

export interface SelectedModifier {
  name: string;
  price: number;
  groupName: string;
}

interface VariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemImage?: string;
  variants: Variant[];
  modifierGroups?: ModifierGroup[];
  onSelect: (variant: Variant, selectedModifiers?: SelectedModifier[], notes?: string) => void;
}

export function VariantPickerDialog({
  open,
  onOpenChange,
  itemName,
  itemImage,
  variants,
  modifierGroups = [],
  onSelect,
}: VariantPickerDialogProps) {
  const hasModifiers = modifierGroups && modifierGroups.length > 0;

  // Selected State
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedModifiersMap, setSelectedModifiersMap] = useState<{ [groupIdx: number]: ModifierOption[] }>({});
  const [notes, setNotes] = useState("");

  // Initialize defaults on open
  useEffect(() => {
    if (open) {
      const defaultVar = variants.length > 0 ? variants[0] : null;
      setSelectedVariant(defaultVar);

      // Set default modifier selections
      const initialMap: { [groupIdx: number]: ModifierOption[] } = {};
      if (hasModifiers) {
        modifierGroups.forEach((group, gIdx) => {
          const defaultOpts = group.options.filter((opt) => opt.isDefault);
          if (defaultOpts.length > 0) {
            initialMap[gIdx] = defaultOpts;
          } else if (group.maxSelection === 1 && group.minSelection > 0 && group.options.length > 0) {
            // Pick first option if mandatory single-choice
            initialMap[gIdx] = [group.options[0]];
          } else {
            initialMap[gIdx] = [];
          }
        });
      }
      setSelectedModifiersMap(initialMap);
      setNotes("");
    }
  }, [open, variants, modifierGroups, hasModifiers]);

  // Fast single-click or keyboard selection for simple variant items (no modifiers)
  const handleFastSelect = (variant: Variant) => {
    onSelect(variant, [], "");
    onOpenChange(false);
  };

  // Keyboard shortcut listener: ONLY active when dialog is OPEN, no modifiers, and user is NOT typing in an input
  useEffect(() => {
    if (!open || hasModifiers) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= variants.length) {
        e.preventDefault();
        handleFastSelect(variants[num - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, variants, hasModifiers]);

  // Calculate live total
  const modifiersPriceTotal = useMemo(() => {
    let sum = 0;
    Object.values(selectedModifiersMap).forEach((opts) => {
      opts.forEach((opt) => {
        sum += Number(opt.price) || 0;
      });
    });
    return sum;
  }, [selectedModifiersMap]);

  const liveTotalPrice = (selectedVariant?.price || 0) + modifiersPriceTotal;

  // Toggle modifier option
  const toggleModifier = (groupIdx: number, group: ModifierGroup, option: ModifierOption) => {
    const current = selectedModifiersMap[groupIdx] || [];
    const isSingle = group.maxSelection === 1;

    if (isSingle) {
      // Radio behavior
      const isAlreadySelected = current.some((o) => o.name === option.name);
      if (isAlreadySelected && group.minSelection === 0) {
        // Optional single choice -> unselect
        setSelectedModifiersMap({ ...selectedModifiersMap, [groupIdx]: [] });
      } else {
        // Select this option
        setSelectedModifiersMap({ ...selectedModifiersMap, [groupIdx]: [option] });
      }
    } else {
      // Checkbox multi-select behavior
      const exists = current.some((o) => o.name === option.name);
      if (exists) {
        setSelectedModifiersMap({
          ...selectedModifiersMap,
          [groupIdx]: current.filter((o) => o.name !== option.name),
        });
      } else {
        if (current.length < group.maxSelection) {
          setSelectedModifiersMap({
            ...selectedModifiersMap,
            [groupIdx]: [...current, option],
          });
        }
      }
    }
  };

  const handleConfirmCustomization = () => {
    if (!selectedVariant) return;

    const flattenedModifiers: SelectedModifier[] = [];
    Object.entries(selectedModifiersMap).forEach(([gIdxStr, opts]) => {
      const gIdx = parseInt(gIdxStr);
      const groupName = modifierGroups[gIdx]?.name || "Customization";
      opts.forEach((opt) => {
        flattenedModifiers.push({
          name: opt.name,
          price: Number(opt.price) || 0,
          groupName,
        });
      });
    });

    onSelect(selectedVariant, flattenedModifiers, notes.trim());
    onOpenChange(false);
  };

  if (!open) return null;

  // SIMPLE VARIANT PICKER (No modifier groups)
  if (!hasModifiers) {
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
                onClick={() => handleFastSelect(variant)}
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

  // RICH CUSTOMIZATION DIALOG (With Modifiers & Add-ons)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 shrink-0">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-3">
              {itemImage && (
                <img src={itemImage} alt={itemName} className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
              )}
              <div>
                <span className="leading-snug block font-black">{itemName}</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3" /> Customize your order
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* 1. Size / Variant Selection */}
          {variants.length > 0 && (
            <div className="space-y-2.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Select Size / Portion *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.name === v.name;
                  return (
                    <button
                      key={v._id || v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 relative ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <span className="text-sm font-bold truncate">{v.name}</span>
                      <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                        ₹{v.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Dynamic Modifier Groups */}
          {modifierGroups.map((group, gIdx) => {
            const selectedOpts = selectedModifiersMap[gIdx] || [];
            const isSingle = group.maxSelection === 1;

            return (
              <div key={gIdx} className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>{gIdx + 2}. {group.name}</span>
                  </Label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isSingle ? "Choose 1" : `Pick up to ${group.maxSelection}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.options.map((opt, optIdx) => {
                    const isSelected = selectedOpts.some((o) => o.name === opt.name);
                    const optPrice = Number(opt.price) || 0;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => toggleModifier(gIdx, group, opt)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-200 dark:hover:border-purple-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-${isSingle ? "full" : "md"} border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {opt.name}
                          </span>
                        </div>
                        <span className={`text-xs font-extrabold shrink-0 ${optPrice > 0 ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`}>
                          {optPrice > 0 ? `+₹${optPrice}` : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Special Instructions / Notes */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kitchen Instructions / Notes (Optional)
            </Label>
            <Input
              placeholder="e.g. Well done crust, less spicy, extra oregano"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Footer with Total Price & Add to Cart */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Price</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{liveTotalPrice.toFixed(2)}
            </span>
          </div>

          <Button
            type="button"
            onClick={handleConfirmCustomization}
            disabled={!selectedVariant}
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


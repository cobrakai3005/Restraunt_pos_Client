"use client";

import { useState, useEffect } from "react";
import { recipeService, Recipe, RecipeIngredient } from "@/services/recipe.service";
import { menuService, MenuItem } from "@/services/menu.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, Trash2, Loader2, Calculator } from "lucide-react";
import { getCompatibleUnits, calculateIngredientCost } from "@/lib/uomConverter";

interface CreateRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingRecipe: Recipe | null;
  restaurantId: string;
}

export default function CreateRecipeModal({ open, onOpenChange, onSuccess, existingRecipe, restaurantId }: CreateRecipeModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [menuItemId, setMenuItemId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  useEffect(() => {
    if (open && restaurantId) {
      loadData();
      if (existingRecipe) {
        setMenuItemId(typeof existingRecipe.menuItemId === 'object' ? existingRecipe.menuItemId._id : existingRecipe.menuItemId);
        setVariantName(existingRecipe.variantName);
        setIngredients(
          existingRecipe.ingredients.map(ing => {
            const invId = typeof ing.inventoryItemId === 'object' ? ing.inventoryItemId._id : ing.inventoryItemId;
            return {
              inventoryItemId: invId,
              quantityUsed: ing.quantityUsed,
              unit: ing.unit || "",
            };
          })
        );
      } else {
        setMenuItemId("");
        setVariantName("");
        setIngredients([]);
      }
    }
  }, [open, restaurantId, existingRecipe]);

  const loadData = async () => {
    try {
      const [menuRes, invRes] = await Promise.all([
        menuService.getMenuItems(restaurantId),
        inventoryService.getInventoryItems(restaurantId)
      ]);
      setMenuItems(menuRes.data?.menuItems || []);
      setInventoryItems(invRes.data?.inventoryItems || invRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedMenuItem = menuItems.find(m => m._id === menuItemId);
  const selectedVariant = selectedMenuItem?.variants.find(v => v.name === variantName);
  const sellingPrice = selectedVariant?.price || 0;

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: "", quantityUsed: 1, unit: "" }]);
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-set default unit when inventoryItemId changes
    if (field === "inventoryItemId") {
      const inv = inventoryItems.find(item => item._id === value);
      if (inv) {
        updated[index].unit = inv.unit;
      }
    }

    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  // Calculate Total Recipe Cost
  const totalRecipeCost = ingredients.reduce((total, ing) => {
    const inv = inventoryItems.find(item => item._id === ing.inventoryItemId);
    if (!inv) return total;
    const cost = calculateIngredientCost(
      Number(ing.quantityUsed) || 0,
      ing.unit || inv.unit,
      inv.costPerUnit,
      inv.unit
    );
    return total + cost;
  }, 0);

  const foodCostPercentage = sellingPrice > 0 ? (totalRecipeCost / sellingPrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItemId || !variantName) {
      alert("Please select a menu item and variant");
      return;
    }

    if (ingredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    const payload = {
      menuItemId,
      variantName,
      ingredients: ingredients.map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantityUsed: Number(i.quantityUsed),
        unit: i.unit
      }))
    };

    setLoading(true);
    try {
      if (existingRecipe) {
        await recipeService.updateRecipe(existingRecipe._id, payload, restaurantId);
      } else {
        await recipeService.createRecipe(payload, restaurantId);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save recipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingRecipe ? "Edit Recipe" : "Create Recipe Mapping"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Menu Item</Label>
              <SearchableSelect
                options={menuItems.map(m => ({ value: m._id, label: m.name }))}
                value={menuItemId}
                onChange={(val) => { setMenuItemId(val); setVariantName(""); }}
                placeholder="Search & select a menu item..."
                searchPlaceholder="Search menu item..."
                disabled={!!existingRecipe}
              />
            </div>
            <div className="space-y-2">
              <Label>Variant</Label>
              <Select value={variantName} onValueChange={setVariantName} disabled={!menuItemId || !!existingRecipe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a variant..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedMenuItem?.variants.map(v => (
                    <SelectItem key={v.name} value={v.name}>{v.name} - ₹{v.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Ingredients & Bill of Materials</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient}>
                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <div className="text-sm text-muted-foreground italic text-center p-4 border rounded-md">
                No ingredients added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ing, idx) => {
                  const inv = inventoryItems.find(item => item._id === ing.inventoryItemId);
                  const compatibleUnits = inv ? getCompatibleUnits(inv.unit) : [];
                  const rowCost = inv ? calculateIngredientCost(Number(ing.quantityUsed) || 0, ing.unit || inv.unit, inv.costPerUnit, inv.unit) : 0;

                  return (
                    <div key={idx} className="flex items-end gap-3 p-3 border rounded-md bg-muted/20">
                      <div className="flex-1 space-y-2">
                        <Label>Raw Material</Label>
                        <SearchableSelect
                          options={inventoryItems.map(item => ({
                            value: item._id,
                            label: item.name,
                            subLabel: `Stock: ${item.currentStock} ${item.unit} • ₹${item.costPerUnit}/${item.unit}`,
                            badge: item.unit,
                          }))}
                          value={ing.inventoryItemId}
                          onChange={(val) => handleIngredientChange(idx, "inventoryItemId", val)}
                          placeholder="Search & select raw material..."
                          searchPlaceholder="Search raw material (e.g. Milk, Paneer)..."
                        />
                      </div>

                      <div className="w-24 space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          required
                          value={ing.quantityUsed}
                          onChange={(e) => handleIngredientChange(idx, "quantityUsed", e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="w-28 space-y-2">
                        <Label>Unit</Label>
                        <Select 
                          value={ing.unit || inv?.unit || "PCS"} 
                          onValueChange={(val) => handleIngredientChange(idx, "unit", val)}
                          disabled={!inv}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {compatibleUnits.map((u) => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-24 pb-2 text-right">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          ₹{rowCost.toFixed(2)}
                        </span>
                      </div>

                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-time Recipe Costing Card */}
          {ingredients.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
                <Calculator className="w-4 h-4 text-blue-600" />
                Live Food Cost Analysis
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Total Recipe Cost</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">₹{totalRecipeCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Selling Price</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">₹{sellingPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Food Cost %</span>
                  <span className={`font-bold text-base ${
                    foodCostPercentage > 40 ? "text-red-600" : foodCostPercentage > 30 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {sellingPrice > 0 ? `${foodCostPercentage.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !menuItemId || !variantName || ingredients.length === 0 || ingredients.some(i => !i.inventoryItemId)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Recipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

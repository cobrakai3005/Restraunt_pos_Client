"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { recipeService } from "@/services/recipe.service";
import { InventoryItem } from "@/services/inventory.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Calculator } from "lucide-react";
import { getCompatibleUnits, calculateIngredientCost } from "@/lib/uomConverter";

interface MenuItemVariant {
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  name: string;
  variants: MenuItemVariant[];
}

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  restaurantId: string;
  menuItems: MenuItem[];
  inventoryItems: InventoryItem[];
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  onSuccess,
  restaurantId,
  menuItems,
  inventoryItems,
}: AddRecipeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [menuItemId, setMenuItemId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [ingredients, setIngredients] = useState<{ inventoryItemId: string; quantityUsed: number | string; unit?: string }[]>([]);

  // Find the selected menu item to get its variants and selling price
  const selectedMenuItem = menuItems.find(m => m._id === menuItemId);
  const selectedVariant = selectedMenuItem?.variants.find(v => v.name === variantName);
  const sellingPrice = selectedVariant?.price || 0;

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: "", quantityUsed: "", unit: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    
    // Auto-set default unit when inventoryItemId changes
    if (field === "inventoryItemId") {
      const inv = inventoryItems.find(item => item._id === value);
      if (inv) {
        newIngredients[index].unit = inv.unit;
      }
    }
    
    setIngredients(newIngredients);
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
      toast({ variant: "destructive", title: "Please select a Menu Item and Variant" });
      return;
    }
    
    // Filter out invalid ingredients
    const validIngredients = ingredients
      .map(i => ({ 
        inventoryItemId: i.inventoryItemId, 
        quantityUsed: Number(i.quantityUsed),
        unit: i.unit
      }))
      .filter(i => i.inventoryItemId && i.quantityUsed > 0);

    if (validIngredients.length === 0) {
      toast({ variant: "destructive", title: "Please add at least one valid ingredient with quantity > 0" });
      return;
    }

    try {
      setLoading(true);
      await recipeService.createRecipe({
        menuItemId,
        variantName,
        ingredients: validIngredients,
      }, restaurantId);

      toast({ title: "Success", description: "Recipe mapped successfully." });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setMenuItemId("");
      setVariantName("");
      setIngredients([]);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Failed to create recipe", 
        description: error?.response?.data?.message || "Ensure a recipe doesn't already exist for this variant."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Menu Item *</Label>
              <SearchableSelect 
                options={menuItems.map((m) => ({ value: m._id, label: m.name }))}
                value={menuItemId} 
                onChange={(val) => {
                  setMenuItemId(val);
                  setVariantName(""); // Reset variant when item changes
                }}
                placeholder="Search & select Menu Item"
                searchPlaceholder="Search menu item..."
              />
            </div>

            <div className="space-y-2">
              <Label>Variant *</Label>
              <Select 
                value={variantName} 
                onValueChange={setVariantName}
                disabled={!selectedMenuItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Variant" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMenuItem?.variants.map((v) => (
                    <SelectItem key={v.name} value={v.name}>{v.name} (₹{v.price})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Ingredients & Bill of Materials</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient}>
                <Plus className="h-4 w-4 mr-2" /> Add Ingredient
              </Button>
            </div>

            {ingredients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No ingredients added yet.</p>
            )}

            {ingredients.map((ing, index) => {
              const inv = inventoryItems.find(item => item._id === ing.inventoryItemId);
              const compatibleUnits = inv ? getCompatibleUnits(inv.unit) : [];
              const rowCost = inv ? calculateIngredientCost(Number(ing.quantityUsed) || 0, ing.unit || inv.unit, inv.costPerUnit, inv.unit) : 0;

              return (
                <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Raw Material</Label>
                    <SearchableSelect 
                      options={inventoryItems.map((item) => ({
                        value: item._id,
                        label: item.name,
                        subLabel: `Stock: ${item.currentStock} ${item.unit} • ₹${item.costPerUnit}/${item.unit}`,
                        badge: item.unit,
                      }))}
                      value={ing.inventoryItemId} 
                      onChange={(val) => handleIngredientChange(index, "inventoryItemId", val)}
                      placeholder="Search & select Item"
                      searchPlaceholder="Search raw item..."
                    />
                  </div>
                  
                  <div className="w-24 space-y-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.0001" 
                      required 
                      value={ing.quantityUsed}
                      onChange={(e) => handleIngredientChange(index, "quantityUsed", e.target.value)}
                      className="bg-background"
                      placeholder="0"
                    />
                  </div>

                  <div className="w-28 space-y-2">
                    <Label className="text-xs">Unit</Label>
                    <Select 
                      value={ing.unit || inv?.unit || "PCS"} 
                      onValueChange={(val) => handleIngredientChange(index, "unit", val)}
                      disabled={!inv}
                    >
                      <SelectTrigger className="bg-background">
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

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Recipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

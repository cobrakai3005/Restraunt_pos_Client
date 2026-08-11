"use client";

import { useState, useEffect } from "react";

import { recipeService, Recipe, RecipeIngredient } from "@/services/recipe.service";
import { menuService, MenuItem, Variant } from "@/services/menu.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";

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
          existingRecipe.ingredients.map(ing => ({
            inventoryItemId: typeof ing.inventoryItemId === 'object' ? ing.inventoryItemId._id : ing.inventoryItemId,
            quantityUsed: ing.quantityUsed
          }))
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

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: "", quantityUsed: 1 }]);
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        menuItemId,
        variantName,
        ingredients: ingredients.map(ing => ({
          inventoryItemId: ing.inventoryItemId,
          quantityUsed: Number(ing.quantityUsed)
        }))
      };

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
              <Select value={menuItemId} onValueChange={(val) => { setMenuItemId(val); setVariantName(""); }} disabled={!!existingRecipe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu item..." />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map(m => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label className="text-base font-semibold">Ingredients</Label>
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
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 border rounded-md bg-muted/20">
                    <div className="flex-1 space-y-2">
                      <Label>Raw Item</Label>
                      <Select 
                        value={ing.inventoryItemId} 
                        onValueChange={(val) => handleIngredientChange(idx, "inventoryItemId", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select raw item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map(item => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.name} ({item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Quantity Used</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        required
                        value={ing.quantityUsed}
                        onChange={(e) => handleIngredientChange(idx, "quantityUsed", e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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

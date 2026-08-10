"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { recipeService, Recipe, RecipeIngredient } from "@/services/recipe.service";
import { InventoryItem } from "@/services/inventory.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface MenuItemVariant {
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  name: string;
  variants: MenuItemVariant[];
}

interface EditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  restaurantId: string;
  menuItems: MenuItem[];
  inventoryItems: InventoryItem[];
  recipe: Recipe | null;
}

export function EditRecipeDialog({
  open,
  onOpenChange,
  onSuccess,
  restaurantId,
  menuItems,
  inventoryItems,
  recipe,
}: EditRecipeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<{ inventoryItemId: string; quantityUsed: number | string }[]>([]);

  useEffect(() => {
    if (recipe) {
      const mapped = recipe.ingredients.map(ing => ({
        inventoryItemId: typeof ing.inventoryItemId === 'string' ? ing.inventoryItemId : ing.inventoryItemId?._id,
        quantityUsed: String(ing.quantityUsed),
      }));
      setIngredients(mapped as { inventoryItemId: string; quantityUsed: string }[]);
    } else {
      setIngredients([]);
    }
  }, [recipe]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: "", quantityUsed: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe) return;

    // Filter out invalid ingredients
    const validIngredients = ingredients
      .map(i => ({ ...i, quantityUsed: Number(i.quantityUsed) }))
      .filter(i => i.inventoryItemId && !isNaN(i.quantityUsed) && i.quantityUsed > 0);
      
    if (validIngredients.length === 0) {
      toast({ variant: "destructive", title: "Please add at least one valid ingredient" });
      return;
    }

    try {
      setLoading(true);
      await recipeService.updateRecipe(recipe._id, {
        ingredients: validIngredients,
      }, restaurantId);

      toast({ title: "Success", description: "Recipe updated successfully." });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update recipe:", error);
      toast({ 
        variant: "destructive", 
        title: "Failed to update recipe", 
        description: error?.response?.data?.message || "An error occurred while updating."
      });
    } finally {
      setLoading(false);
    }
  };

  if (!recipe) return null;

  // The backend usually populates menuItemId. Handle both string ID or object
  const menuItemName = typeof recipe.menuItemId === 'object' && recipe.menuItemId?.name 
    ? recipe.menuItemId.name 
    : menuItems.find(m => m._id === recipe.menuItemId)?.name || "Unknown Menu Item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Menu Item</Label>
              <Input disabled value={menuItemName} className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Variant</Label>
              <Input disabled value={recipe.variantName} className="bg-muted" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Ingredients</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient}>
                <Plus className="h-4 w-4 mr-2" /> Add Ingredient
              </Button>
            </div>

            {ingredients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No ingredients added yet.</p>
            )}

            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Inventory Item</Label>
                  <Select 
                    value={ing.inventoryItemId} 
                    onValueChange={(val) => handleIngredientChange(index, "inventoryItemId", val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((inv) => (
                        <SelectItem key={inv._id} value={inv._id}>{inv.name} ({inv.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.001" 
                    required 
                    value={ing.quantityUsed}
                    onChange={(e) => handleIngredientChange(index, "quantityUsed", e.target.value)}
                    className="bg-background"
                  />
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
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Recipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
